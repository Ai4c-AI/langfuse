import { dorisClient } from "./client";
import { measureAndReturn } from "./measureAndReturn";
import { logger } from "../logger";
import { isValidTableName } from "./schemaUtils";

/**
 * Service for handling trace data in Doris.
 */
export class DorisTraceService {
  /**
   * Gets a trace by ID.
   * @param traceId The trace ID.
   * @param projectId The project ID.
   * @returns The trace data.
   */
  static async getTraceById(traceId: string, projectId: string): Promise<any> {
    return await measureAndReturn({
      name: "get-trace-by-id",
      query: `
        SELECT * 
        FROM traces 
        WHERE id = ? 
        AND project_id = ? 
        AND is_deleted = 0
        LIMIT 1
      `,
      params: [traceId, projectId],
    });
  }

  /**
   * Gets observations for a trace.
   * @param traceId The trace ID.
   * @param projectId The project ID.
   * @returns The observations data.
   */
  static async getObservationsForTrace(traceId: string, projectId: string): Promise<any[]> {
    return await measureAndReturn({
      name: "get-observations-for-trace",
      query: `
        SELECT * 
        FROM observations 
        WHERE trace_id = ? 
        AND project_id = ? 
        AND is_deleted = 0
        ORDER BY start_time ASC
      `,
      params: [traceId, projectId],
    });
  }

  /**
   * Gets scores for a trace.
   * @param traceId The trace ID.
   * @param projectId The project ID.
   * @returns The scores data.
   */
  static async getScoresForTrace(traceId: string, projectId: string): Promise<any[]> {
    return await measureAndReturn({
      name: "get-scores-for-trace",
      query: `
        SELECT * 
        FROM scores 
        WHERE trace_id = ? 
        AND project_id = ? 
        AND is_deleted = 0
        ORDER BY created_at ASC
      `,
      params: [traceId, projectId],
    });
  }

  /**
   * Gets traces with pagination.
   * @param options Query options.
   * @returns The traces data with pagination info.
   */
  static async getTraces(options: {
    projectId: string;
    limit: number;
    offset: number;
    orderBy?: string;
    orderDir?: "ASC" | "DESC";
    filters?: Record<string, any>;
  }): Promise<{ data: any[]; total: number }> {
    const { projectId, limit, offset, orderBy = "timestamp", orderDir = "DESC", filters = {} } = options;
    
    // Validate order by column to prevent SQL injection
    if (!isValidTableName(orderBy)) {
      throw new Error(`Invalid orderBy column: ${orderBy}`);
    }
    
    // Build WHERE clause from filters
    let whereClause = "project_id = ? AND is_deleted = 0";
    const params: any[] = [projectId];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Validate column name to prevent SQL injection
        if (!isValidTableName(key)) {
          throw new Error(`Invalid filter column: ${key}`);
        }
        
        whereClause += ` AND ${key} = ?`;
        params.push(value);
      }
    });
    
    // Get total count
    const totalResult = await measureAndReturn({
      name: "get-traces-count",
      query: `
        SELECT COUNT(*) as total
        FROM traces
        WHERE ${whereClause}
      `,
      params,
    });
    
    const total = totalResult[0]?.total || 0;
    
    // Get paginated data
    const data = await measureAndReturn({
      name: "get-traces-paginated",
      query: `
        SELECT *
        FROM traces
        WHERE ${whereClause}
        ORDER BY ${orderBy} ${orderDir}
        LIMIT ? OFFSET ?
      `,
      params: [...params, limit, offset],
    });
    
    return { data, total };
  }

  /**
   * Deletes a trace and its related data.
   * @param traceId The trace ID.
   * @param projectId The project ID.
   * @returns True if successful.
   */
  static async deleteTrace(traceId: string, projectId: string): Promise<boolean> {
    const connection = dorisClient();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Soft delete trace
      await connection.query(
        `UPDATE traces SET is_deleted = 1 WHERE id = ? AND project_id = ?`,
        [traceId, projectId]
      );
      
      // Soft delete observations
      await connection.query(
        `UPDATE observations SET is_deleted = 1 WHERE trace_id = ? AND project_id = ?`,
        [traceId, projectId]
      );
      
      // Soft delete scores
      await connection.query(
        `UPDATE scores SET is_deleted = 1 WHERE trace_id = ? AND project_id = ?`,
        [traceId, projectId]
      );
      
      // Commit transaction
      await connection.commit();
      
      return true;
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      logger.error(`Error deleting trace ${traceId}:`, error);
      throw error;
    }
  }
}