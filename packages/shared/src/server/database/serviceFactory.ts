import { env } from "../../env";
import { logger } from "../logger";
import * as ClickHouseService from "../clickhouse";
import * as DorisService from "../doris";

/**
 * Factory class for creating database service instances based on configuration.
 */
export class DatabaseServiceFactory {
  /**
   * Gets the appropriate database service based on configuration.
   * @returns The database service.
   */
  static getService() {
    const useDoris = env.LANGFUSE_USE_DORIS === "true";
    
    if (useDoris) {
      logger.info("Using Doris as the database service");
      return DorisService;
    } else {
      logger.info("Using ClickHouse as the database service");
      return ClickHouseService;
    }
  }
  
  /**
   * Gets the trace service based on configuration.
   * @returns The trace service.
   */
  static getTraceService() {
    const useDoris = env.LANGFUSE_USE_DORIS === "true";
    
    if (useDoris) {
      return DorisService.DorisTraceService;
    } else {
      return ClickHouseService.ClickHouseTraceService;
    }
  }
}