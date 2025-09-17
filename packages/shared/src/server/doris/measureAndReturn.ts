import { dorisClient } from "./client";
import { logger } from "../logger";
import { instrumentAsync } from "../instrumentation";
import { SpanKind } from "@opentelemetry/api";

/**
 * Executes a query on Doris and measures its performance.
 * @param options Query options.
 * @returns Query result.
 */
export async function measureAndReturn<T>(options: {
  query: string;
  params?: any[];
  name: string;
}): Promise<T> {
  const { query, params, name } = options;
  
  return await instrumentAsync(
    { name: `doris-${name}`, spanKind: SpanKind.CLIENT },
    async (span) => {
      const startTime = Date.now();
      
      try {
        const connection = dorisClient();
        const [result] = await connection.query(query, params);
        
        const duration = Date.now() - startTime;
        span?.setAttribute("doris.query.duration_ms", duration);
        
        if (duration > 1000) {
          logger.warn(`Slow Doris query (${duration}ms): ${query}`);
        }
        
        return result as T;
      } catch (error) {
        const duration = Date.now() - startTime;
        span?.setAttribute("doris.query.duration_ms", duration);
        span?.setAttribute("doris.query.error", (error as Error).message);
        
        logger.error(`Error executing Doris query (${duration}ms): ${query}`, error);
        throw error;
      }
    }
  );
}