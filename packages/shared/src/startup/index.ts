import { logger } from "../logger";
import { initializeDorisOnStartup } from "./initializeDoris";
import { env } from "../../env";

/**
 * Initializes all required services during application startup.
 */
export async function initializeServices(): Promise<void> {
  logger.info("Initializing services...");
  
  try {
    // Initialize Doris if enabled
    if (env.LANGFUSE_USE_DORIS === "true") {
      await initializeDorisOnStartup();
    }
    
    logger.info("All services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize services:", error);
    throw error;
  }
}