import { dorisClient } from "../../src/server/doris/client";
import { logger } from "../../src/logger";
import { runDorisMigrations } from "../../src/server/doris/migrations/runMigrations";
import path from "path";

async function seedDoris() {
  logger.info("Seeding Doris database...");

  try {
    // Run migrations first
    const migrationsDir = path.resolve(process.cwd(), "packages/shared/doris/migrations");
    await runDorisMigrations(migrationsDir);

    // Get connection to Doris
    const connection = dorisClient();

    // Insert sample data for traces
    await connection.query(`
      INSERT INTO traces (
        id, project_id, name, user_id, session_id, metadata, tags, 
        created_at, updated_at, timestamp, release, version, 
        start_time, end_time, status, level, parent_observation_id, is_deleted
      ) VALUES 
      (
        'trace-sample-1', 
        'project-sample', 
        'Sample Trace 1', 
        'user-1', 
        'session-1', 
        '{"source": "seed"}', 
        '["sample", "test"]', 
        NOW(), 
        NOW(), 
        NOW(), 
        '1.0.0', 
        '1', 
        NOW(), 
        NOW(), 
        'success', 
        'DEFAULT', 
        NULL, 
        0
      ),
      (
        'trace-sample-2', 
        'project-sample', 
        'Sample Trace 2', 
        'user-2', 
        'session-2', 
        '{"source": "seed"}', 
        '["sample", "test"]', 
        NOW(), 
        NOW(), 
        NOW(), 
        '1.0.0', 
        '1', 
        NOW(), 
        NOW(), 
        'success', 
        'DEFAULT', 
        NULL, 
        0
      )
    `);

    // Insert sample data for observations
    await connection.query(`
      INSERT INTO observations (
        id, trace_id, project_id, type, name, start_time, end_time, 
        metadata, input, output, level, status_message, parent_observation_id, 
        model, model_parameters, completion_tokens, prompt_tokens, total_tokens, 
        unit_cost, computed_cost, version, created_at, updated_at, timestamp, is_deleted
      ) VALUES 
      (
        'observation-sample-1', 
        'trace-sample-1', 
        'project-sample', 
        'generation', 
        'Sample Generation', 
        NOW(), 
        NOW(), 
        '{"source": "seed"}', 
        '{"prompt": "Hello, world!"}', 
        '{"completion": "Hi there!"}', 
        'DEFAULT', 
        NULL, 
        NULL, 
        'gpt-3.5-turbo', 
        '{"temperature": 0.7}', 
        10, 
        5, 
        15, 
        0.002, 
        0.00003, 
        '1', 
        NOW(), 
        NOW(), 
        NOW(), 
        0
      ),
      (
        'observation-sample-2', 
        'trace-sample-2', 
        'project-sample', 
        'span', 
        'Sample Span', 
        NOW(), 
        NOW(), 
        '{"source": "seed"}', 
        '{"action": "process"}', 
        '{"result": "success"}', 
        'DEFAULT', 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        NULL, 
        '1', 
        NOW(), 
        NOW(), 
        NOW(), 
        0
      )
    `);

    // Insert sample data for scores
    await connection.query(`
      INSERT INTO scores (
        id, trace_id, project_id, observation_id, name, value, 
        comment, source, created_at, updated_at, event_ts, is_deleted
      ) VALUES 
      (
        'score-sample-1', 
        'trace-sample-1', 
        'project-sample', 
        'observation-sample-1', 
        'quality', 
        0.95, 
        'Good quality response', 
        'manual', 
        NOW(), 
        NOW(), 
        NOW(), 
        0
      ),
      (
        'score-sample-2', 
        'trace-sample-2', 
        'project-sample', 
        'observation-sample-2', 
        'speed', 
        0.85, 
        'Fast processing', 
        'manual', 
        NOW(), 
        NOW(), 
        NOW(), 
        0
      )
    `);

    logger.info("Doris database seeded successfully");
  } catch (error) {
    logger.error("Error seeding Doris database:", error);
    throw error;
  }
}

seedDoris()
  .then(() => {
    logger.info("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Seed failed:", error);
    process.exit(1);
  });