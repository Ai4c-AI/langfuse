-- Create observations table
CREATE TABLE IF NOT EXISTS observations (
    `id` VARCHAR(255),
    `trace_id` VARCHAR(255),
    `project_id` VARCHAR(255),
    `type` VARCHAR(255),
    `parent_observation_id` VARCHAR(255) NULL,
    `start_time` DATETIME(3),
    `end_time` DATETIME(3) NULL,
    `name` VARCHAR(255),
    `metadata` MAP<VARCHAR(255), VARCHAR(255)>,
    `level` VARCHAR(255),
    `status_message` VARCHAR(255) NULL,
    `version` VARCHAR(255) NULL,
    `input` TEXT NULL,
    `output` TEXT NULL,
    `provided_model_name` VARCHAR(255) NULL,
    `internal_model_id` VARCHAR(255) NULL,
    `model_parameters` TEXT NULL,
    `provided_usage_details` MAP<VARCHAR(255), BIGINT>,
    `usage_details` MAP<VARCHAR(255), BIGINT>,
    `provided_cost_details` MAP<VARCHAR(255), DECIMAL(38, 12)>,
    `cost_details` MAP<VARCHAR(255), DECIMAL(38, 12)>,
    `total_cost` DECIMAL(38, 12) NULL,
    `completion_start_time` DATETIME(3) NULL,
    `prompt_id` VARCHAR(255) NULL,
    `prompt_name` VARCHAR(255) NULL,
    `prompt_version` SMALLINT NULL,
    `created_at` DATETIME(3),
    `updated_at` DATETIME(3),
    `event_ts` DATETIME(3),
    `is_deleted` TINYINT
) ENGINE=OLAP
DUPLICATE KEY(`project_id`, `type`, `id`)
DISTRIBUTED BY HASH(`project_id`) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);