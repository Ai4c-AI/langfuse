-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
    `id` VARCHAR(255),
    `trace_id` VARCHAR(255),
    `project_id` VARCHAR(255),
    `observation_id` VARCHAR(255) NULL,
    `name` VARCHAR(255),
    `value` DECIMAL(38, 12),
    `comment` TEXT NULL,
    `source` VARCHAR(255),
    `created_at` DATETIME(3),
    `updated_at` DATETIME(3),
    `event_ts` DATETIME(3),
    `is_deleted` TINYINT
) ENGINE=OLAP
DUPLICATE KEY(`project_id`, `id`)
DISTRIBUTED BY HASH(`project_id`) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);