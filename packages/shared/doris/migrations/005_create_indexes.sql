-- Create indexes for traces table
ALTER TABLE traces ADD INDEX idx_traces_project_id (project_id) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_user_id (user_id) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_session_id (session_id) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_name (name) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_status (status) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_level (level) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_created_at (created_at) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_timestamp (timestamp) USING BITMAP;
ALTER TABLE traces ADD INDEX idx_traces_is_deleted (is_deleted) USING BITMAP;

-- Create indexes for observations table
ALTER TABLE observations ADD INDEX idx_observations_trace_id (trace_id) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_project_id (project_id) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_type (type) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_name (name) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_model (model) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_level (level) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_created_at (created_at) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_timestamp (timestamp) USING BITMAP;
ALTER TABLE observations ADD INDEX idx_observations_is_deleted (is_deleted) USING BITMAP;

-- Create indexes for scores table
ALTER TABLE scores ADD INDEX idx_scores_trace_id (trace_id) USING BITMAP;
ALTER TABLE scores ADD INDEX idx_scores_project_id (project_id) USING BITMAP;
ALTER TABLE scores ADD INDEX idx_scores_observation_id (observation_id) USING BITMAP;
ALTER TABLE scores ADD INDEX idx_scores_name (name) USING BITMAP;
ALTER TABLE scores ADD INDEX idx_scores_source (source) USING BITMAP;
ALTER TABLE scores ADD INDEX idx_scores_created_at (created_at) USING BITMAP;
ALTER TABLE scores ADD INDEX idx_scores_is_deleted (is_deleted) USING BITMAP;

-- Create indexes for blob_storage_file_log table
ALTER TABLE blob_storage_file_log ADD INDEX idx_blob_storage_file_log_project_id (project_id) USING BITMAP;
ALTER TABLE blob_storage_file_log ADD INDEX idx_blob_storage_file_log_observation_id (observation_id) USING BITMAP;
ALTER TABLE blob_storage_file_log ADD INDEX idx_blob_storage_file_log_trace_id (trace_id) USING BITMAP;
ALTER TABLE blob_storage_file_log ADD INDEX idx_blob_storage_file_log_file_type (file_type) USING BITMAP;
ALTER TABLE blob_storage_file_log ADD INDEX idx_blob_storage_file_log_storage_type (storage_type) USING BITMAP;
ALTER TABLE blob_storage_file_log ADD INDEX idx_blob_storage_file_log_created_at (created_at) USING BITMAP;
ALTER TABLE blob_storage_file_log ADD INDEX idx_blob_storage_file_log_is_deleted (is_deleted) USING BITMAP;