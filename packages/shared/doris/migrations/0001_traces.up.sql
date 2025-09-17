-- Create traces table
CREATE TABLE IF NOT EXISTS traces (
    `id` VARCHAR(255),
    `project_id` VARCHAR(255),
    `timestamp` DATETIME(3),
    `start_time` DATETIME(3),
    `end_time` DATETIME(3) NULL,
    `name` VARCHAR(255) NULL,
    `metadata` MAP<VARCHAR(255), VARCHAR(255)>,
    `user_id` VARCHAR(255) NULL,
    `session_id` VARCHAR(255) NULL,
    `environment` VARCHAR(255),
    `tags` ARRAY<VARCHAR(255)>,
    `version` VARCHAR(255) NULL,
    `release` VARCHAR(255) NULL,
    `bookmarked` BOOLEAN NULL,
    `public` BOOLEAN NULL,
    `observation_ids` ARRAY<VARCHAR(255)>,
    `score_ids` ARRAY<VARCHAR(255)>,
    `cost_details` MAP<VARCHAR(255), DECIMAL(38, 12)>,
    `usage_details` MAP<VARCHAR(255), BIGINT>,
    `input` TEXT,
    `output` TEXT,
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