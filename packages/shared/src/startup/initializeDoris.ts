import { initializeDoris } from "../server/doris/migrations/initialize";
import { logger } from "../logger";
import { env } from "../../env";

/**
 * Initializes the Doris database during server startup.
 */
export async function initializeDorisOnStartup(): Promise<void> {
  try {
    logger.info("Initializing Doris database on startup...");
    
    // Check if we should migrate data from ClickHouse
    const shouldMigrateFromClickHouse = env.LANGFUSE_MIGRATE_FROM_CLICKHOUSE === "true";
    
    // Initialize Doris
    await initializeDoris({
      migrateFromClickHouse: shouldMigrateFromClickHouse,
    });
    
    logger.info("Doris database initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Doris database:", error);
    throw error;
  }
}