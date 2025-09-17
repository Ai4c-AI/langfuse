import { env } from "../../env";
import { getCurrentSpan } from "../instrumentation";
import { propagation, context } from "@opentelemetry/api";
import { Pool, PoolConfig, createPool } from "mysql2/promise";

export type DorisClientType = Pool;

export type PreferredDorisService = "ReadWrite" | "ReadOnly";

/**
 * DorisClientManager provides a singleton pattern for managing Doris clients.
 * It creates and reuses clients based on their configuration to avoid creating
 * a new connection for each query.
 */
export class DorisClientManager {
  private static instance: DorisClientManager;
  private clientMap: Map<string, DorisClientType> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of the DorisClientManager
   */
  public static getInstance(): DorisClientManager {
    if (!DorisClientManager.instance) {
      DorisClientManager.instance = new DorisClientManager();
    }
    return DorisClientManager.instance;
  }

  /**
   * Generate a consistent hash key for client configurations
   * @param opts Client parameters
   * @returns String hash key
   */
  private generateClientSettings(
    opts: PoolConfig,
    preferredDorisService: PreferredDorisService = "ReadWrite",
  ): PoolConfig {
    const keyParams = {
      host: this.getDorisHost(preferredDorisService),
      port: this.getDorisPort(preferredDorisService),
      user: env.DORIS_USER,
      password: env.DORIS_PASSWORD,
      database: env.DORIS_DB,
      connectionLimit: env.DORIS_MAX_OPEN_CONNECTIONS,
      ...opts,
    };
    return keyParams;
  }

  private generateClientSettingsKey(settings: PoolConfig): string {
    return JSON.stringify(settings);
  }

  private getDorisHost = (preferredDorisService: PreferredDorisService) => {
    return preferredDorisService === "ReadWrite"
      ? env.DORIS_HOST
      : env.DORIS_READ_ONLY_HOST || env.DORIS_HOST;
  };

  private getDorisPort = (preferredDorisService: PreferredDorisService) => {
    return preferredDorisService === "ReadWrite"
      ? env.DORIS_PORT
      : env.DORIS_READ_ONLY_PORT || env.DORIS_PORT;
  };

  /**
   * Get or create a client based on the provided parameters
   * @param opts Client configuration parameters
   * @returns Doris client instance
   */
  public getClient(
    opts: PoolConfig = {},
    preferredDorisService: PreferredDorisService = "ReadWrite",
  ): DorisClientType {
    const settings = this.generateClientSettings(opts, preferredDorisService);
    const key = this.generateClientSettingsKey(settings);
    
    if (!this.clientMap.has(key)) {
      const activeSpan = getCurrentSpan();
      if (activeSpan) {
        // Add trace context to connection if available
        const headers = {};
        propagation.inject(context.active(), headers);
        // MySQL doesn't support headers directly, but we can add them as connection attributes
        // in a real implementation
      }

      const client = createPool(settings);
      this.clientMap.set(key, client);
    }

    return this.clientMap.get(key)!;
  }

  /**
   * Close all client connections - useful for application shutdown
   */
  public async closeAllConnections(): Promise<void> {
    for (const client of this.clientMap.values()) {
      await client.end();
    }
    this.clientMap.clear();
  }
}

export const dorisClient = (
  opts?: PoolConfig,
  preferredDorisService: PreferredDorisService = "ReadWrite",
) => {
  return DorisClientManager.getInstance().getClient(
    opts ?? {},
    preferredDorisService,
  );
};

/**
 * Accepts a JavaScript date and returns the DateTime in format YYYY-MM-DD HH:MM:SS
 */
export const convertDateToDorisDateTime = (date: Date): string => {
  // 2024-11-06T20:37:00.123Z -> 2024-11-06 21:37:00.123
  return date.toISOString().replace("T", " ").replace("Z", "");
};