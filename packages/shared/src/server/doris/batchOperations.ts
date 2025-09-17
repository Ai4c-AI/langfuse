import { dorisClient } from "./client";
import { logger } from "../logger";
import { instrumentAsync } from "../instrumentation";
import { SpanKind } from "@opentelemetry/api";

/**
 * Options for batch operations in Doris.
 */
interface BatchOperationOptions {
  /**
   * The table name.
   */
  tableName: string;
  
  /**
   * The batch size.
   */
  batchSize: number;
  
  /**
   * The data to insert.
   */
  data: Record<string, any>[];
  
  /**
   * The operation name for instrumentation.
   */
  operationName: string;
}

/**
 * Executes a batch insert operation in Doris.
 * @param options The batch operation options.
 * @returns The number of inserted rows.
 */
export async function batchInsert(options: BatchOperationOptions): Promise<number> {
  const { tableName, batchSize, data, operationName } = options;
  
  if (!data.length) {
    return 0;
  }
  
  return await instrumentAsync(
    { name: `doris-batch-insert-${operationName}`, spanKind: SpanKind.CLIENT },
    async (span) => {
      const startTime = Date.now();
      let insertedCount = 0;
      
      try {
        const connection = dorisClient();
        
        // Process data in batches
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          
          if (batch.length === 0) {
            continue;
          }
          
          // Get column names from the first item
          const columns = Object.keys(batch[0]);
          
          // Create placeholders for each row
          const placeholders = batch.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
          
          // Flatten values for the query
          const values = batch.flatMap(item => columns.map(col => item[col]));
          
          // Build and execute the query
          const query = `
            INSERT INTO ${tableName} (${columns.join(", ")})
            VALUES ${placeholders}
          `;
          
          await connection.query(query, values);
          insertedCount += batch.length;
          
          logger.debug(`Inserted ${batch.length} rows into ${tableName}, progress: ${i + batch.length}/${data.length}`);
        }
        
        const duration = Date.now() - startTime;
        span?.setAttribute("doris.batch_insert.duration_ms", duration);
        span?.setAttribute("doris.batch_insert.rows", insertedCount);
        
        logger.info(`Batch insert into ${tableName} completed: ${insertedCount} rows in ${duration}ms`);
        
        return insertedCount;
      } catch (error) {
        const duration = Date.now() - startTime;
        span?.setAttribute("doris.batch_insert.duration_ms", duration);
        span?.setAttribute("doris.batch_insert.error", (error as Error).message);
        
        logger.error(`Error during batch insert into ${tableName}:`, error);
        throw error;
      }
    }
  );
}