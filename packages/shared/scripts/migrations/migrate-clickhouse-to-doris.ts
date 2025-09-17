import { migrateFromClickHouseToDoris } from "../../src/server/doris/migrations/migrateFromClickHouse";
import { logger } from "../../src/logger";
import { initializeDoris } from "../../src/server/doris/migrations/initialize";

async function migrateData() {
  logger.info("Starting migration from ClickHouse to Doris...");

  try {
    // Initialize Doris first (run migrations)
    await initializeDoris();

    // Migrate data from ClickHouse to Doris
    await migrateFromClickHouseToDoris({
      tables: ["traces", "observations", "scores", "blob_storage_file_log"],
      batchSize: 500,
    });

    logger.info("Migration from ClickHouse to Doris completed successfully");
  } catch (error) {
    logger.error("Error during migration:", error);
    throw error;
  }
}

migrateData()
  .then(() => {
    logger.info("Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Migration script failed:", error);
    process.exit(1);
  });