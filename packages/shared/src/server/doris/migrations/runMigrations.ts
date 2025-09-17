import fs from "fs";
import path from "path";
import { dorisClient } from "../client";
import { logger } from "../../../logger";

/**
 * Runs Doris migrations from the specified directory.
 * @param migrationsDir The directory containing migration files.
 */
export async function runDorisMigrations(migrationsDir: string): Promise<void> {
  logger.info(`Running Doris migrations from ${migrationsDir}`);
  
  try {
    const connection = dorisClient();
    
    // Create migrations table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        applied_at DATETIME NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=OLAP
      DUPLICATE KEY(id)
      COMMENT "Table to track applied migrations"
      DISTRIBUTED BY HASH(id) BUCKETS 1
      PROPERTIES (
        "replication_num" = "1"
      )
    `);
    
    // Get applied migrations
    const [appliedMigrations] = await connection.query("SELECT id FROM migrations");
    const appliedMigrationIds = new Set(appliedMigrations.map((m: any) => m.id));
    
    // Read migration files
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort();
    
    if (migrationFiles.length === 0) {
      logger.warn(`No migration files found in ${migrationsDir}`);
      return;
    }
    
    logger.info(`Found ${migrationFiles.length} migration files`);
    
    // Apply migrations
    for (const file of migrationFiles) {
      const migrationId = path.parse(file).name;
      
      if (appliedMigrationIds.has(migrationId)) {
        logger.debug(`Migration ${migrationId} already applied, skipping`);
        continue;
      }
      
      logger.info(`Applying migration: ${migrationId}`);
      
      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(migrationPath, "utf-8");
      
      // Split migration into statements
      const statements = migrationSql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        await connection.query(statement);
      }
      
      // Record migration
      await connection.query(
        "INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, NOW())",
        [migrationId, file]
      );
      
      logger.info(`Migration ${migrationId} applied successfully`);
    }
    
    logger.info("All Doris migrations applied successfully");
  } catch (error) {
    logger.error("Error running Doris migrations:", error);
    throw error;
  }
}