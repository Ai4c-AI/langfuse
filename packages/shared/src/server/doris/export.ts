import { dorisClient } from "../client";
import { logger } from "../../logger";
import { instrumentAsync } from "../../instrumentation";
import { SpanKind } from "@opentelemetry/api";
import { StorageServiceFactory } from "../../services/StorageService";
import { env } from "../../../env";

/**
 * Exports data from Doris to S3 or other storage systems.
 * @param options Export options.
 */
export async function exportDorisData(options: {
  projectId: string;
  table: string;
  startDate: Date;
  endDate: Date;
  bucketName: string;
  prefix: string;
}): Promise<void> {
  const { projectId, table, startDate, endDate, bucketName, prefix } = options;
  
  return await instrumentAsync(
    { name: `export-doris-${table}`, spanKind: SpanKind.CLIENT },
    async (span) => {
      logger.info(`Starting export of ${table} data for project ${projectId}`);
      
      // Format dates for SQL query
      const formattedStartDate = startDate.toISOString().replace("T", " ").replace("Z", "");
      const formattedEndDate = endDate.toISOString().replace("T", " ").replace("Z", "");
      
      // Query data from Doris
      const connection = dorisClient();
      const [rows] = await connection.query(
        `SELECT * FROM ${table} 
         WHERE project_id = ? 
         AND created_at BETWEEN ? AND ?
         ORDER BY created_at`,
        [projectId, formattedStartDate, formattedEndDate]
      );
      
      const data = rows as Record<string, any>[];
      
      if (data.length === 0) {
        logger.info(`No ${table} data found for project ${projectId} in the specified date range`);
        return;
      }
      
      logger.info(`Found ${data.length} ${table} records to export for project ${projectId}`);
      
      // Initialize storage service
      const storageService = StorageServiceFactory.getInstance({
        bucketName,
        accessKeyId: env.LANGFUSE_S3_CORE_DATA_EXPORT_ACCESS_KEY_ID || env.LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID,
        secretAccessKey: env.LANGFUSE_S3_CORE_DATA_EXPORT_SECRET_ACCESS_KEY || env.LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY,
        endpoint: env.LANGFUSE_S3_CORE_DATA_EXPORT_ENDPOINT || env.LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT,
        region: env.LANGFUSE_S3_CORE_DATA_EXPORT_REGION || env.LANGFUSE_S3_EVENT_UPLOAD_REGION,
        forcePathStyle: (env.LANGFUSE_S3_CORE_DATA_EXPORT_FORCE_PATH_STYLE || env.LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE) === "true",
        awsSse: env.LANGFUSE_S3_CORE_DATA_EXPORT_SSE,
        awsSseKmsKeyId: env.LANGFUSE_S3_CORE_DATA_EXPORT_SSE_KMS_KEY_ID,
      });
      
      // Generate export file path
      const exportDate = new Date().toISOString().split("T")[0];
      const filePath = `${prefix}/${projectId}/${table}/${exportDate}/${table}_${projectId}_${Date.now()}.json`;
      
      // Upload data to storage
      await storageService.uploadJson(filePath, data);
      
      logger.info(`Successfully exported ${data.length} ${table} records to ${filePath}`);
    }
  );
}