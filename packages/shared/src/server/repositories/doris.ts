import { env } from "../../env";
import {
  dorisClient,
  convertDateToDorisDateTime,
  PreferredDorisService,
} from "../doris/client";
import { logger } from "../logger";
import { getTracer, instrumentAsync } from "../instrumentation";
import { randomUUID } from "crypto";
import { getDorisEntityType } from "../doris/schemaUtils";
import { PoolConfig } from "mysql2/promise";
import { context, SpanKind, trace } from "@opentelemetry/api";
import { backOff } from "exponential-backoff";
import {
  StorageService,
  StorageServiceFactory,
} from "../services/StorageService";

let s3StorageServiceClient: StorageService;

const getS3StorageServiceClient = (bucketName: string): StorageService => {
  if (!s3StorageServiceClient) {
    s3StorageServiceClient = StorageServiceFactory.getInstance({
      bucketName,
      accessKeyId: env.LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID,
      secretAccessKey: env.LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY,
      endpoint: env.LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT,
      region: env.LANGFUSE_S3_EVENT_UPLOAD_REGION,
      forcePathStyle: env.LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE === "true",
      awsSse: env.LANGFUSE_S3_EVENT_UPLOAD_SSE,
      awsSseKmsKeyId: env.LANGFUSE_S3_EVENT_UPLOAD_SSE_KMS_KEY_ID,
    });
  }
  return s3StorageServiceClient;
};

export async function upsertDoris<
  T extends Record<string, unknown>,
>(opts: {
  table: "scores" | "traces" | "observations" | "traces_null";
  records: T[];
  eventBodyMapper: (body: T) => Record<string, unknown>; // eslint-disable-line no-unused-vars
  tags?: Record<string, string>;
}): Promise<void> {
  return await instrumentAsync(
    { name: "doris-upsert", spanKind: SpanKind.CLIENT },
    async (span) => {
      // https://opentelemetry.io/docs/specs/semconv/database/database-spans/
      span.setAttribute("doris.query.table", opts.table);
      span.setAttribute("db.system", "doris");
      span.setAttribute("db.operation.name", "UPSERT");

      await Promise.all(
        opts.records.map(async (record) => {
          // drop trailing s and pretend it's always a create.
          // Only applicable to scores and traces.
          let eventType = `${opts.table.slice(0, -1)}-create`;
          if (opts.table === "observations") {
            // @ts-ignore - If it's an observation we now that `type` is a string
            eventType = `${record["type"].toLowerCase()}-create`;
          }

          const eventId = randomUUID();
          const bucketPath = `${env.LANGFUSE_S3_EVENT_UPLOAD_PREFIX}${record.project_id}/${getDorisEntityType(eventType)}/${record.id}/${eventId}.json`;

          if (env.LANGFUSE_ENABLE_BLOB_STORAGE_FILE_LOG === "true") {
            // Write new file directly to Doris
            const connection = dorisClient();
            await connection.query(
              `INSERT INTO blob_storage_file_log 
               (id, project_id, entity_type, entity_id, event_id, bucket_name, bucket_path, event_ts, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                randomUUID(),
                record.project_id,
                getDorisEntityType(eventType),
                record.id,
                eventId,
                env.LANGFUSE_S3_EVENT_UPLOAD_BUCKET,
                bucketPath,
                convertDateToDorisDateTime(new Date()),
                0,
              ]
            );
          }

          return getS3StorageServiceClient(
            env.LANGFUSE_S3_EVENT_UPLOAD_BUCKET,
          ).uploadJson(bucketPath, [
            {
              id: eventId,
              timestamp: new Date().toISOString(),
              type: eventType,
              body: opts.eventBodyMapper(record),
            },
          ]);
        }),
      );

      // Prepare the SQL for batch insert
      const connection = dorisClient();
      const columns = Object.keys(opts.records[0]);
      const placeholders = columns.map(() => '?').join(', ');
      
      // Add event_ts to each record
      const recordsWithTimestamp = opts.records.map(record => ({
        ...record,
        event_ts: convertDateToDorisDateTime(new Date()),
      }));
      
      // Extract values for each record
      const values = recordsWithTimestamp.map(record => 
        columns.map(col => record[col])
      );
      
      // Execute the batch insert
      const [result] = await connection.query(
        `INSERT INTO ${opts.table} (${columns.join(', ')}) VALUES ?`,
        [values]
      );
      
      // Log query in development
      if (env.NODE_ENV === "development") {
        logger.info(`doris:insert ${opts.table} - ${values.length} records`);
      }

      // Add query information to span
      span.setAttribute("doris.affectedRows", (result as any).affectedRows);
    },
  );
}

export async function queryDoris<T>(opts: {
  query: string;
  params?: any[] | undefined;
  dorisConfigs?: PoolConfig;
  tags?: Record<string, string>;
  preferredDorisService?: PreferredDorisService;
}): Promise<T[]> {
  return await instrumentAsync(
    { name: "doris-query", spanKind: SpanKind.CLIENT },
    async (span) => {
      // https://opentelemetry.io/docs/specs/semconv/database/database-spans/
      span.setAttribute("doris.query.text", opts.query);
      span.setAttribute("db.system", "doris");
      span.setAttribute("db.query.text", opts.query);
      span.setAttribute("db.operation.name", opts.query.trim().split(/\s+/)[0].toUpperCase());

      const connection = dorisClient(
        opts.dorisConfigs,
        opts.preferredDorisService,
      );

      // Execute the query with parameters
      const [rows] = await connection.query(opts.query, opts.params || []);

      // Log query in development
      if (env.NODE_ENV === "development") {
        logger.info(`doris:query ${opts.query}`);
      }

      // Add query information to span
      span.setAttribute("doris.rowCount", (rows as any[]).length);

      return rows as T[];
    },
  );
}

export async function* queryDorisStream<T>(opts: {
  query: string;
  params?: any[] | undefined;
  dorisConfigs?: PoolConfig;
  tags?: Record<string, string>;
  preferredDorisService?: PreferredDorisService;
}): AsyncGenerator<T> {
  const tracer = getTracer("doris-query-stream");
  const span = tracer.startSpan("doris-query-stream", {
    kind: SpanKind.CLIENT,
  });

  try {
    // https://opentelemetry.io/docs/specs/semconv/database/database-spans/
    span.setAttribute("doris.query.text", opts.query);
    span.setAttribute("db.system", "doris");
    span.setAttribute("db.query.text", opts.query);
    span.setAttribute("db.operation.name", opts.query.trim().split(/\s+/)[0].toUpperCase());

    const connection = dorisClient(
      opts.dorisConfigs,
      opts.preferredDorisService,
    );

    // Execute the query with parameters
    const [rows] = await connection.query(opts.query, opts.params || []);

    // Log query in development
    if (env.NODE_ENV === "development") {
      logger.info(`doris:query-stream ${opts.query}`);
    }

    // Add query information to span
    span.setAttribute("doris.rowCount", (rows as any[]).length);

    // Yield each row
    for (const row of rows as T[]) {
      yield row;
    }
  } finally {
    span.end();
  }
}

export async function commandDoris(opts: {
  query: string;
  params?: any[] | undefined;
  dorisConfigs?: PoolConfig;
  tags?: Record<string, string>;
}): Promise<void> {
  return await instrumentAsync(
    { name: "doris-command", spanKind: SpanKind.CLIENT },
    async (span) => {
      // https://opentelemetry.io/docs/specs/semconv/database/database-spans/
      span.setAttribute("doris.query.text", opts.query);
      span.setAttribute("db.system", "doris");
      span.setAttribute("db.query.text", opts.query);
      span.setAttribute("db.operation.name", opts.query.trim().split(/\s+/)[0].toUpperCase());

      const connection = dorisClient(opts.dorisConfigs);

      // Execute the command with parameters
      const [result] = await connection.query(opts.query, opts.params || []);

      // Log query in development
      if (env.NODE_ENV === "development") {
        logger.info(`doris:command ${opts.query}`);
      }

      // Add query information to span
      span.setAttribute("doris.affectedRows", (result as any).affectedRows);
    },
  );
}

export const parseDorisDateTimeFormat = (dateTimeString: string): Date => {
  return new Date(dateTimeString);
};