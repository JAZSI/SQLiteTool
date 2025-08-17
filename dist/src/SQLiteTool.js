"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteTool = void 0;
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
const TableBuilder_1 = require("./TableBuilder");
const QueryBuilder_1 = require("./QueryBuilder");
/**
 * SQLite database utility with TypeScript support
 *
 * @example
 * const db = new SQLiteTool('./database.sqlite', {
 *   logging: true,
 *   verbose: true
 * });
 *
 * await db.connect();
 *
 * // Create table with builder
 * await db.createTable('users', builder => {
 *   builder
 *     .id()
 *     .string('name').notNull()
 *     .integer('age')
 *     .boolean('active').default(true)
 *     .date('created_at');
 * });
 *
 * // Insert data
 * const result = await db.insert('users', {
 *   name: 'John Doe',
 *   age: 30,
 *   active: true
 * });
 *
 * // Find with pagination
 * const users = await db.findPaginated('users', {}, {
 *   page: 1,
 *   limit: 10
 * });
 */
class SQLiteTool {
    constructor(dbPath, options = {}) {
        var _a, _b, _c, _d, _e, _f;
        this._db = null;
        this._isConnected = false;
        this._dbPath = dbPath;
        // Default configuration
        this._config = {
            logging: (_a = options.logging) !== null && _a !== void 0 ? _a : false,
            logger: (_b = options.logger) !== null && _b !== void 0 ? _b : {
                info: console.log,
                error: console.error,
                debug: console.debug,
                warn: console.warn
            },
            timeout: (_c = options.timeout) !== null && _c !== void 0 ? _c : 30000,
            verbose: (_d = options.verbose) !== null && _d !== void 0 ? _d : false,
            readonly: (_e = options.readonly) !== null && _e !== void 0 ? _e : false,
            fileMustExist: (_f = options.fileMustExist) !== null && _f !== void 0 ? _f : false
        };
    }
    // ==================== CONNECTION METHODS ====================
    /**
     * Opens the database connection
    *
    * @example
    * const db = new SQLiteTool('./data/app.sqlite');
    * await db.connect();
     */
    async connect() {
        try {
            if (this._isConnected) {
                this._log('debug', 'Already connected to database');
                return;
            }
            this._db = await (0, sqlite_1.open)({
                filename: this._dbPath,
                driver: sqlite3_1.default.Database,
                mode: this._config.readonly ? sqlite3_1.default.OPEN_READONLY : sqlite3_1.default.OPEN_READWRITE | sqlite3_1.default.OPEN_CREATE
            });
            if (this._config.timeout) {
                await this._db.exec(`PRAGMA busy_timeout = ${this._config.timeout}`);
            }
            this._isConnected = true;
            this._log('info', `Connected to SQLite database at ${this._dbPath}`);
        }
        catch (error) {
            this._log('error', `Error connecting to SQLite database at ${this._dbPath}:`, error);
            throw error;
        }
    }
    /**
     * Closes the database connection
    *
    * @example
    * await db.close();
     */
    async close() {
        try {
            if (!this._isConnected || !this._db) {
                this._log('debug', 'No active connection to close');
                return;
            }
            await this._db.close();
            this._isConnected = false;
            this._db = null;
            this._log('info', 'Closed SQLite database connection');
        }
        catch (error) {
            this._log('error', 'Error closing SQLite database:', error);
            throw error;
        }
    }
    /**
     * Checks if the database is connected
    *
    * @example
    * const connected = db.getConnectionStatus();
    * console.log(connected);
     */
    getConnectionStatus() {
        return this._isConnected;
    }
    // ==================== SCHEMA METHODS ====================
    /**
     * Creates a table using the TableBuilder
    *
    * @example
    * await db.createTable('users', t => {
    *   t.id();
    *   t.string('name').notNull();
    * });
     */
    async createTable(tableName, builder, options = {}) {
        try {
            this._ensureConnected();
            const tableBuilder = new TableBuilder_1.TableBuilder(tableName);
            builder(tableBuilder);
            const { columns, constraints } = tableBuilder.build();
            let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  `;
            sql += columns.join(',\n  ');
            if (constraints.length > 0) {
                sql += ',\n  ' + constraints.join(',\n  ');
            }
            sql += '\n)';
            if (options.temporary) {
                sql = sql.replace('CREATE TABLE', 'CREATE TEMPORARY TABLE');
            }
            if (options.withoutRowId) {
                sql += ' WITHOUT ROWID';
            }
            if (options.strict) {
                sql += ' STRICT';
            }
            await this._db.exec(sql);
            this._log('info', `Table ${tableName} created or already exists`);
        }
        catch (error) {
            this._log('error', 'Error creating table:', error);
            throw error;
        }
    }
    /**
     * Drops a table
    *
    * @example
    * await db.dropTable('users');
     */
    async dropTable(tableName) {
        try {
            this._ensureConnected();
            await this._db.exec(`DROP TABLE IF EXISTS ${tableName}`);
            this._log('info', `Table ${tableName} dropped`);
        }
        catch (error) {
            this._log('error', 'Error dropping table:', error);
            throw error;
        }
    }
    /**
     * Checks if a table exists
    *
    * @example
    * const exists = await db.tableExists('users');
    * console.log(exists);
     */
    async tableExists(tableName) {
        try {
            this._ensureConnected();
            const result = await this._db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
            return !!result;
        }
        catch (error) {
            this._log('error', 'Error checking table existence:', error);
            throw error;
        }
    }
    // ==================== CRUD METHODS ====================
    /**
     * Inserts a new record
    *
    * @example
    * const result = await db.insert('users', { name: 'Ann' });
    * console.log(result.lastID);
     */
    async insert(tableName, data) {
        try {
            this._ensureConnected();
            const columns = Object.keys(data).join(', ');
            const placeholders = Object.keys(data).fill('?').join(', ');
            const values = Object.values(data).map(this._prepareValue);
            const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
            this._log('debug', 'Executing SQL:', sql, values);
            const result = await this._db.run(sql, values);
            return {
                lastID: result.lastID || 0,
                changes: result.changes || 0
            };
        }
        catch (error) {
            this._log('error', 'Error inserting record:', error);
            throw error;
        }
    }
    /**
     * Finds records with optional conditions
    *
    * @example
    * const rows = await db.find('users', { age: { operator: '>=', value: 18 } }, { orderBy: 'name' });
     */
    async find(tableName, conditions = {}, options = {}) {
        try {
            this._ensureConnected();
            const queryBuilder = new QueryBuilder_1.QueryBuilder(tableName);
            if (options.columns) {
                queryBuilder.select(options.columns);
            }
            for (const [key, value] of Object.entries(conditions)) {
                if (Array.isArray(value)) {
                    queryBuilder.whereIn(key, value);
                }
                else if (value && typeof value === 'object' && 'operator' in value) {
                    queryBuilder.where(key, value.operator, value.value);
                }
                else {
                    queryBuilder.where(key, '=', value);
                }
            }
            if (options.orderBy) {
                const orderBy = Array.isArray(options.orderBy) ? options.orderBy.join(', ') : options.orderBy;
                queryBuilder.orderBy(orderBy, options.direction);
            }
            if (options.limit) {
                queryBuilder.limit(options.limit);
                if (options.offset) {
                    queryBuilder.offset(options.offset);
                }
            }
            if (options.groupBy) {
                queryBuilder.groupBy(options.groupBy);
            }
            if (options.having) {
                queryBuilder.having(options.having);
            }
            // Note: distinct option is not implemented in this version
            const { sql, values } = queryBuilder.toSQL();
            this._log('debug', 'Executing SQL:', sql, values);
            const stmt = await this._db.prepare(sql);
            const results = await stmt.all(...values);
            await stmt.finalize();
            return results;
        }
        catch (error) {
            this._log('error', 'Error finding records:', error);
            throw error;
        }
    }
    /**
     * Finds a single record
    *
    * @example
    * const user = await db.findOne('users', { id: 1 });
     */
    async findOne(tableName, conditions = {}, options = {}) {
        try {
            const results = await this.find(tableName, conditions, { ...options, limit: 1 });
            return results[0] || null;
        }
        catch (error) {
            this._log('error', 'Error finding record:', error);
            throw error;
        }
    }
    /**
     * Updates records
    *
    * @example
    * await db.update('users', { age: 31 }, { id: 5 });
     */
    async update(tableName, data, conditions = {}) {
        try {
            this._ensureConnected();
            const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = Object.values(data).map(this._prepareValue);
            let sql = `UPDATE ${tableName} SET ${setClause}`;
            const conditionKeys = Object.keys(conditions);
            const conditionValues = Object.values(conditions).map(this._prepareValue);
            if (conditionKeys.length > 0) {
                const whereClause = conditionKeys.map(key => `${key} = ?`).join(' AND ');
                sql += ` WHERE ${whereClause}`;
                values.push(...conditionValues);
            }
            const result = await this._db.run(sql, values);
            return { changes: result.changes || 0 };
        }
        catch (error) {
            this._log('error', 'Error updating records:', error);
            throw error;
        }
    }
    /**
     * Deletes records
    *
    * @example
    * await db.delete('users', { id: 10 });
     */
    async delete(tableName, conditions = {}) {
        try {
            this._ensureConnected();
            let sql = `DELETE FROM ${tableName}`;
            const conditionKeys = Object.keys(conditions);
            const conditionValues = Object.values(conditions).map(this._prepareValue);
            if (conditionKeys.length > 0) {
                const whereClause = conditionKeys.map(key => `${key} = ?`).join(' AND ');
                sql += ` WHERE ${whereClause}`;
            }
            const result = await this._db.run(sql, conditionValues);
            return { changes: result.changes || 0 };
        }
        catch (error) {
            this._log('error', 'Error deleting records:', error);
            throw error;
        }
    }
    /**
     * Counts records
    *
    * @example
    * const c = await db.count('users', { active: 1 });
    * console.log(c);
     */
    async count(tableName, conditions = {}) {
        try {
            this._ensureConnected();
            const queryBuilder = new QueryBuilder_1.QueryBuilder(tableName);
            for (const [key, value] of Object.entries(conditions)) {
                if (Array.isArray(value)) {
                    queryBuilder.whereIn(key, value);
                }
                else if (value && typeof value === 'object' && 'operator' in value) {
                    queryBuilder.where(key, value.operator, value.value);
                }
                else {
                    queryBuilder.where(key, '=', value);
                }
            }
            const { sql, values } = queryBuilder.toCountSQL();
            const result = await this._db.get(sql, values);
            return result.count;
        }
        catch (error) {
            this._log('error', 'Error counting records:', error);
            throw error;
        }
    }
    /**
     * Finds records with pagination
    *
    * @example
    * const paged = await db.findPaginated('users', {}, { page: 1, limit: 20 });
     */
    async findPaginated(tableName, conditions = {}, pagination, options = {}) {
        try {
            const total = await this.count(tableName, conditions);
            const totalPages = Math.ceil(total / pagination.limit);
            const data = await this.find(tableName, conditions, {
                ...options,
                limit: pagination.limit,
                offset: (pagination.page - 1) * pagination.limit
            });
            return {
                data,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages,
                    hasNext: pagination.page < totalPages,
                    hasPrev: pagination.page > 1
                }
            };
        }
        catch (error) {
            this._log('error', 'Error finding paginated records:', error);
            throw error;
        }
    }
    // ==================== TRANSACTION METHODS ====================
    /**
     * Executes operations in a transaction
    *
    * @example
    * await db.transaction(async () => {
    *   await db.insert('users', { name: 'Tx' });
    * });
     */
    async transaction(callback, options = {}) {
        try {
            this._ensureConnected();
            const isolation = options.isolation || 'DEFERRED';
            await this._db.exec(`BEGIN ${isolation} TRANSACTION`);
            const result = await callback();
            await this._db.exec('COMMIT');
            return result;
        }
        catch (error) {
            await this._db.exec('ROLLBACK');
            this._log('error', 'Transaction failed, rolled back:', error);
            throw error;
        }
    }
    // ==================== UTILITY METHODS ====================
    /**
     * Logs a message if logging is enabled
     */
    _log(level, message, ...args) {
        if (this._config.logging) {
            this._config.logger[level](`[SQLiteTool] ${message}`, ...args);
        }
    }
    /**
     * Ensures the database is connected
     */
    _ensureConnected() {
        if (!this._isConnected || !this._db) {
            throw new Error('Database is not connected. Call connect() first.');
        }
    }
    /**
     * Prepares a value for SQL
     */
    _prepareValue(value) {
        if (value === null || value === undefined) {
            return null;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (typeof value === 'boolean') {
            return value ? 1 : 0;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return value;
    }
    /**
     * Escapes a value for SQL
     */
    _escapeValue(value) {
        if (value === null || value === undefined)
            return 'NULL';
        if (typeof value === 'string') {
            if (value === 'CURRENT_TIMESTAMP')
                return value;
            return `'${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === 'boolean')
            return value ? '1' : '0';
        if (value instanceof Date)
            return `'${value.toISOString()}'`;
        return value.toString();
    }
    /**
     * Enables or disables logging
    *
    * @example
    * db.setLogging(true);
     */
    setLogging(enabled) {
        this._config.logging = enabled;
        this._log('info', `Logging ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * Gets the database instance (for advanced usage)
    *
    * @example
    * const raw = db.getDatabase();
    * // use raw driver methods if needed
     */
    getDatabase() {
        return this._db;
    }
    /**
     * Gets the database file path
    *
    * @example
    * console.log(db.getDatabasePath());
     */
    getDatabasePath() {
        return this._dbPath;
    }
}
exports.SQLiteTool = SQLiteTool;
