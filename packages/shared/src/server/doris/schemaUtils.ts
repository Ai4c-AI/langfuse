/**
 * Valid table names in Doris.
 */
const VALID_TABLE_NAMES = [
  "traces",
  "observations",
  "scores",
  "blob_storage_file_log",
  "migrations",
];

/**
 * Valid column names in Doris.
 */
const VALID_COLUMN_NAMES: Record<string, string[]> = {
  traces: [
    "id",
    "project_id",
    "name",
    "user_id",
    "session_id",
    "metadata",
    "tags",
    "created_at",
    "updated_at",
    "timestamp",
    "release",
    "version",
    "start_time",
    "end_time",
    "status",
    "level",
    "parent_observation_id",
    "is_deleted",
  ],
  observations: [
    "id",
    "trace_id",
    "project_id",
    "type",
    "name",
    "start_time",
    "end_time",
    "metadata",
    "input",
    "output",
    "level",
    "status_message",
    "parent_observation_id",
    "model",
    "model_parameters",
    "completion_tokens",
    "prompt_tokens",
    "total_tokens",
    "unit_cost",
    "computed_cost",
    "version",
    "created_at",
    "updated_at",
    "timestamp",
    "is_deleted",
  ],
  scores: [
    "id",
    "trace_id",
    "project_id",
    "observation_id",
    "name",
    "value",
    "comment",
    "source",
    "created_at",
    "updated_at",
    "event_ts",
    "is_deleted",
  ],
  blob_storage_file_log: [
    "id",
    "project_id",
    "observation_id",
    "trace_id",
    "file_name",
    "file_type",
    "file_size",
    "file_path",
    "storage_type",
    "created_at",
    "updated_at",
    "is_deleted",
  ],
  migrations: [
    "id",
    "name",
    "applied_at",
  ],
};

/**
 * Checks if a table name is valid.
 * @param tableName The table name to check.
 * @returns True if the table name is valid.
 */
export function isValidTableName(tableName: string): boolean {
  return VALID_TABLE_NAMES.includes(tableName);
}

/**
 * Checks if a column name is valid for a table.
 * @param tableName The table name.
 * @param columnName The column name to check.
 * @returns True if the column name is valid for the table.
 */
export function isValidColumnName(tableName: string, columnName: string): boolean {
  if (!isValidTableName(tableName)) {
    return false;
  }
  
  return VALID_COLUMN_NAMES[tableName].includes(columnName);
}