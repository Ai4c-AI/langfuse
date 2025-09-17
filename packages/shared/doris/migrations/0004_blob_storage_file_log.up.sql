-- Create blob_storage_file_log table
CREATE TABLE IF NOT EXISTS blob_storage_file_log (
    `id` VARCHAR(255),
    `project_id` VARCHAR(255),
    `entity_type` VARCHAR(255),
    `entity_id` VARCHAR(255),
    `event_id` VARCHAR(255),
    `bucket_name` VARCHAR(255),
    `bucket_path` VARCHAR(255),
    `event_ts` DATETIME(3),
    `is_deleted` TINYINT
) ENGINE=OLAP
DUPLICATE KEY(`project_id`, `entity_type`, `entity_id`, `event_id`)
DISTRIBUTED BY HASH(`project_id`) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);