import { dorisClient } from "../client";
import { logger } from "../../../logger";
import { runDorisMigrations } from "./runMigrations";
import path from "path";
import { migrateFromClickHouseToDoris } from "./migrateFromClickHouse";

/**
 * Options for initializing Doris.
 */
interface InitializeDorisOptions {
  /**
   * Whether to migrate data from ClickHouse.
   */
  migrateFromClickHouse?: boolean;
}

/**
 * Initializes the Doris database.
 * @param options Initialization options.
 */
export async function initializeDoris(options: InitializeDorisOptions = {}): Promise<void> {
  const { migrateFromClickHouse = false } = options;
  
  logger.info("Initializing Doris database...");
  
  try {
    // Run migrations
    const migrationsDir = path.resolve(process.cwd(), "packages/shared/doris/migrations");
    await runDorisMigrations(migrationsDir);
    
    // Migrate data from ClickHouse if requested
    if (migrateFromClickHouse) {
      logger.info("Migrating data from ClickHouse to Doris...");
      
      await migrateFromClickHouseToDoris({
        tables: ["traces", "observations", "scores", "blob_storage_file_log"],
        batchSize: 500,
      });
      
      logger.info("Data migration from ClickHouse to Doris completed");
    }
    
    logger.info("Doris database initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Doris database:", error);
    throw error;
  }
}