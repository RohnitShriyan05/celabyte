"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = void 0;
// src/services/connectionManager.ts
const pg_1 = require("pg");
const promise_1 = require("mysql2/promise");
const mongodb_1 = require("mongodb");
const logger_1 = require("../utils/logger");
class ConnectionManager {
    constructor() {
        this.connections = new Map();
        // Health check every 5 minutes
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, 5 * 60 * 1000);
        // Cleanup idle connections every 10 minutes
        setInterval(() => {
            this.cleanupIdleConnections();
        }, 10 * 60 * 1000);
    }
    async getConnection(config) {
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
    async releaseConnection(tenantId, connectionId) {
        const key = `${tenantId}-${connectionId}`;
        const connection = this.connections.get(key);
        if (connection && connection.activeQueries > 0) {
            connection.activeQueries--;
        }
    }
    async createConnection(config) {
        logger_1.logger.info({
            tenantId: config.tenantId,
            connectionId: config.id,
            kind: config.kind
        }, "Creating new database connection");
        let client;
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
        }
        catch (error) {
            logger_1.logger.error({
                error: error.message,
                tenantId: config.tenantId,
                connectionId: config.id
            }, "Failed to create database connection");
            throw error;
        }
    }
    async createPostgresConnection(config) {
        const pool = new pg_1.Pool({
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
    async createMysqlConnection(config) {
        const poolConfig = {
            uri: config.uri,
            connectionLimit: config.maxConnections || 10,
            acquireTimeout: config.connectionTimeout || 5000,
            timeout: 60000
        };
        if (config.uri.includes('ssl=true')) {
            poolConfig.ssl = {};
        }
        const pool = (0, promise_1.createPool)(poolConfig);
        // Test connection
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        return pool;
    }
    async createMongoConnection(config) {
        const client = new mongodb_1.MongoClient(config.uri, {
            maxPoolSize: config.maxConnections || 10,
            serverSelectionTimeoutMS: config.connectionTimeout || 5000,
            socketTimeoutMS: 45000,
        });
        await client.connect();
        // Test connection
        await client.db().admin().ping();
        return client;
    }
    async performHealthChecks() {
        logger_1.logger.debug("Performing connection health checks");
        for (const [key, connection] of this.connections.entries()) {
            try {
                const isHealthy = await this.checkConnectionHealth(connection);
                connection.isHealthy = isHealthy;
                if (!isHealthy) {
                    logger_1.logger.warn({
                        tenantId: connection.config.tenantId,
                        connectionId: connection.config.id
                    }, "Connection failed health check");
                    await this.closeConnection(connection);
                    this.connections.delete(key);
                }
            }
            catch (error) {
                logger_1.logger.error({
                    error: error.message,
                    connectionKey: key
                }, "Health check failed");
                connection.isHealthy = false;
            }
        }
    }
    async checkConnectionHealth(connection) {
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
        }
        catch (error) {
            return false;
        }
    }
    async cleanupIdleConnections() {
        const now = Date.now();
        const maxIdleTime = 30 * 60 * 1000; // 30 minutes
        for (const [key, connection] of this.connections.entries()) {
            const idleTime = now - connection.lastUsed;
            if (idleTime > maxIdleTime && connection.activeQueries === 0) {
                logger_1.logger.info({
                    tenantId: connection.config.tenantId,
                    connectionId: connection.config.id,
                    idleTime
                }, "Closing idle connection");
                await this.closeConnection(connection);
                this.connections.delete(key);
            }
        }
    }
    async closeConnection(connection) {
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
        }
        catch (error) {
            logger_1.logger.error({
                error: error.message,
                tenantId: connection.config.tenantId
            }, "Error closing connection");
        }
    }
    async closeAllConnections() {
        logger_1.logger.info("Closing all database connections");
        for (const connection of this.connections.values()) {
            await this.closeConnection(connection);
        }
        this.connections.clear();
        clearInterval(this.healthCheckInterval);
    }
    getConnectionStats() {
        const stats = {
            totalConnections: this.connections.size,
            connectionsByType: {},
            connectionsByTenant: {},
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
exports.connectionManager = new ConnectionManager();
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info("Received SIGTERM, closing database connections");
    await exports.connectionManager.closeAllConnections();
});
process.on('SIGINT', async () => {
    logger_1.logger.info("Received SIGINT, closing database connections");
    await exports.connectionManager.closeAllConnections();
    process.exit(0);
});
