import { clickhouseClient } from "../../clickhouse/client";
import { dorisClient } from "../client";
import { batchInsert } from "../batchOperations";
import { logger } from "../../../logger";

/**
 * Options for migrating data from ClickHouse to Doris.
 */
interface MigrateFromClickHouseToDorisOptions {
  /**
   * The tables to migrate.
   */
  tables: string[];
  
  /**
   * The batch size for data transfer.
   */
  batchSize: number;
}

/**
 * Migrates data from ClickHouse to Doris.
 * @param options Migration options.
 */
export async function migrateFromClickHouseToDoris(
  options: MigrateFromClickHouseToDorisOptions
): Promise<void> {
  const { tables, batchSize } = options;
  
  logger.info(`Starting migration from ClickHouse to Doris for tables: ${tables.join(", ")}`);
  
  const clickhouse = clickhouseClient();
  const doris = dorisClient();
  
  for (const table of tables) {
    logger.info(`Migrating table: ${table}`);
    
    try {
      // Get total count from ClickHouse
      const [countResult] = await clickhouse.query(`SELECT COUNT(*) as count FROM ${table}`).toPromise();
      const totalCount = countResult.count;
      
      logger.info(`Found ${totalCount} rows in ClickHouse table ${table}`);
      
      if (totalCount === 0) {
        logger.info(`Table ${table} is empty, skipping`);
        continue;
      }
      
      // Get column information from ClickHouse
      const columnsQuery = `
        SELECT name, type
        FROM system.columns
        WHERE table = '${table}'
        ORDER BY position
      `;
      
      const columns = await clickhouse.query(columnsQuery).toPromise();
      const columnNames = columns.map((col: any) => col.name);
      
      logger.info(`Columns in table ${table}: ${columnNames.join(", ")}`);
      
      // Process data in batches
      let offset = 0;
      let processedCount = 0;
      
      while (offset < totalCount) {
        // Fetch batch from ClickHouse
        const query = `
          SELECT ${columnNames.join(", ")}
          FROM ${table}
          ORDER BY created_at
          LIMIT ${batchSize}
          OFFSET ${offset}
        `;
        
        const batchData = await clickhouse.query(query).toPromise();
        
        if (batchData.length === 0) {
          break;
        }
        
        // Insert batch into Doris
        await batchInsert({
          tableName: table,
          batchSize,
          data: batchData,
          operationName: `migrate-${table}`,
        });
        
        offset += batchData.length;
        processedCount += batchData.length;
        
        logger.info(`Migrated ${processedCount}/${totalCount} rows from ${table}`);
      }
      
      logger.info(`Migration of table ${table} completed: ${processedCount} rows migrated`);
    } catch (error) {
      logger.error(`Error migrating table ${table}:`, error);
      throw error;
    }
  }
  
  logger.info("Migration from ClickHouse to Doris completed successfully");
}