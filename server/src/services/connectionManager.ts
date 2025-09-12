// src/services/connectionManager.ts
import { Pool as PgPool } from "pg";
import { createPool as createMysqlPool, Pool as MysqlPool } from "mysql2/promise";
import { MongoClient } from "mongodb";
import { logger } from "../utils/logger";
import { SECURITY } from "../config/security";

interface ConnectionConfig {
  id: string;
  tenantId: string;
  kind: 'POSTGRES' | 'MYSQL' | 'MONGODB' | 'EXCEL';
  uri: string;
  readOnly: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

interface ManagedConnection {
  config: ConnectionConfig;
  client: any;
  lastUsed: number;
  activeQueries: number;
  isHealthy: boolean;
}

class ConnectionManager {
  private connections = new Map<string, ManagedConnection>();
  private healthCheckInterval: NodeJS.Timeout;

  constructor() {
    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 5 * 60 * 1000);

    // Cleanup idle connections every 10 minutes
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 10 * 60 * 1000);
  }

  async getConnection(config: ConnectionConfig): Promise<any> {
    const key = `${config.tenantId}-${config.id}`;
    let connection = this.connections.get(key);

    if (!connection || !connection.isHealthy) {
      connection = await this.createConnection(config);
      this.connections.set(key, connection);
    }

    // Update usage tracking
    connection.lastUsed = Date.now();
    connection.activeQueries++;

    return connection.client;
  }

  async releaseConnection(tenantId: string, connectionId: string): Promise<void> {
    const key = `${tenantId}-${connectionId}`;
    const connection = this.connections.get(key);
    
    if (connection && connection.activeQueries > 0) {
      connection.activeQueries--;
    }
  }

  private async createConnection(config: ConnectionConfig): Promise<ManagedConnection> {
    logger.info({ 
      tenantId: config.tenantId, 
      connectionId: config.id, 
      kind: config.kind 
    }, "Creating new database connection");

    let client: any;

    try {
      switch (config.kind) {
        case 'POSTGRES':
          client = await this.createPostgresConnection(config);
          break;
        case 'MYSQL':
          client = await this.createMysqlConnection(config);
          break;
        case 'MONGODB':
          client = await this.createMongoConnection(config);
          break;
        case 'EXCEL':
          client = { kind: 'EXCEL', path: config.uri };
          break;
        default:
          throw new Error(`Unsupported connection type: ${config.kind}`);
      }

      return {
        config,
        client,
        lastUsed: Date.now(),
        activeQueries: 0,
        isHealthy: true
      };

    } catch (error: any) {
      logger.error({ 
        error: error.message, 
        tenantId: config.tenantId, 
        connectionId: config.id 
      }, "Failed to create database connection");
      throw error;
    }
  }

  private async createPostgresConnection(config: ConnectionConfig): Promise<PgPool> {
    const pool = new PgPool({
      connectionString: config.uri,
      max: config.maxConnections || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.connectionTimeout || 5000,
      ssl: config.uri.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    return pool;
  }

  private async createMysqlConnection(config: ConnectionConfig): Promise<MysqlPool> {
    const poolConfig: any = {
      uri: config.uri,
      connectionLimit: config.maxConnections || 10,
      acquireTimeout: config.connectionTimeout || 5000,
      timeout: 60000
    };

    if (config.uri.includes('ssl=true')) {
      poolConfig.ssl = {};
    }

    const pool = createMysqlPool(poolConfig);

    // Test connection
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();

    return pool;
  }

  private async createMongoConnection(config: ConnectionConfig): Promise<MongoClient> {
    const client = new MongoClient(config.uri, {
      maxPoolSize: config.maxConnections || 10,
      serverSelectionTimeoutMS: config.connectionTimeout || 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    
    // Test connection
    await client.db().admin().ping();

    return client;
  }

  private async performHealthChecks(): Promise<void> {
    logger.debug("Performing connection health checks");

    for (const [key, connection] of this.connections.entries()) {
      try {
        const isHealthy = await this.checkConnectionHealth(connection);
        connection.isHealthy = isHealthy;

        if (!isHealthy) {
          logger.warn({ 
            tenantId: connection.config.tenantId, 
            connectionId: connection.config.id 
          }, "Connection failed health check");
          
          await this.closeConnection(connection);
          this.connections.delete(key);
        }
      } catch (error: any) {
        logger.error({ 
          error: error.message, 
          connectionKey: key 
        }, "Health check failed");
        
        connection.isHealthy = false;
      }
    }
  }

  private async checkConnectionHealth(connection: ManagedConnection): Promise<boolean> {
    try {
      switch (connection.config.kind) {
        case 'POSTGRES':
          const pgClient = await connection.client.connect();
          await pgClient.query('SELECT 1');
          pgClient.release();
          return true;

        case 'MYSQL':
          const mysqlConnection = await connection.client.getConnection();
          await mysqlConnection.execute('SELECT 1');
          mysqlConnection.release();
          return true;

        case 'MONGODB':
          await connection.client.db().admin().ping();
          return true;

        case 'EXCEL':
          return true; // Excel files don't need health checks

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const maxIdleTime = 30 * 60 * 1000; // 30 minutes

    for (const [key, connection] of this.connections.entries()) {
      const idleTime = now - connection.lastUsed;
      
      if (idleTime > maxIdleTime && connection.activeQueries === 0) {
        logger.info({ 
          tenantId: connection.config.tenantId, 
          connectionId: connection.config.id,
          idleTime 
        }, "Closing idle connection");

        await this.closeConnection(connection);
        this.connections.delete(key);
      }
    }
  }

  private async closeConnection(connection: ManagedConnection): Promise<void> {
    try {
      switch (connection.config.kind) {
        case 'POSTGRES':
        case 'MYSQL':
          if (connection.client.end) {
            await connection.client.end();
          }
          break;
        case 'MONGODB':
          await connection.client.close();
          break;
      }
    } catch (error: any) {
      logger.error({ 
        error: error.message, 
        tenantId: connection.config.tenantId 
      }, "Error closing connection");
    }
  }

  async closeAllConnections(): Promise<void> {
    logger.info("Closing all database connections");

    for (const connection of this.connections.values()) {
      await this.closeConnection(connection);
    }

    this.connections.clear();
    clearInterval(this.healthCheckInterval);
  }

  getConnectionStats(): any {
    const stats = {
      totalConnections: this.connections.size,
      connectionsByType: {} as Record<string, number>,
      connectionsByTenant: {} as Record<string, number>,
      activeQueries: 0,
      healthyConnections: 0
    };

    for (const connection of this.connections.values()) {
      const type = connection.config.kind;
      const tenant = connection.config.tenantId;

      stats.connectionsByType[type] = (stats.connectionsByType[type] || 0) + 1;
      stats.connectionsByTenant[tenant] = (stats.connectionsByTenant[tenant] || 0) + 1;
      stats.activeQueries += connection.activeQueries;
      
      if (connection.isHealthy) {
        stats.healthyConnections++;
      }
    }

    return stats;
  }
}

export const connectionManager = new ConnectionManager();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info("Received SIGTERM, closing database connections");
  await connectionManager.closeAllConnections();
});

process.on('SIGINT', async () => {
  logger.info("Received SIGINT, closing database connections");
  await connectionManager.closeAllConnections();
  process.exit(0);
});
