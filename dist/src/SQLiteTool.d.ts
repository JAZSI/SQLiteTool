import { Database } from 'sqlite';
import { SQLiteToolConfig, InsertResult, UpdateResult, DeleteResult, QueryConditions, FindOptions, TableOptions, TransactionOptions, TransactionCallback, PaginatedResult, PaginationOptions } from '../types';
import { TableBuilder } from './TableBuilder';
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
export declare class SQLiteTool {
    private _dbPath;
    private _db;
    private _isConnected;
    private _config;
    constructor(dbPath: string, options?: SQLiteToolConfig);
    /**
     * Opens the database connection
    *
    * @example
    * const db = new SQLiteTool('./data/app.sqlite');
    * await db.connect();
     */
    connect(): Promise<void>;
    /**
     * Closes the database connection
    *
    * @example
    * await db.close();
     */
    close(): Promise<void>;
    /**
     * Checks if the database is connected
    *
    * @example
    * const connected = db.getConnectionStatus();
    * console.log(connected);
     */
    getConnectionStatus(): boolean;
    /**
     * Creates a table using the TableBuilder
    *
    * @example
    * await db.createTable('users', t => {
    *   t.id();
    *   t.string('name').notNull();
    * });
     */
    createTable(tableName: string, builder: (builder: TableBuilder) => void, options?: TableOptions): Promise<void>;
    /**
     * Drops a table
    *
    * @example
    * await db.dropTable('users');
     */
    dropTable(tableName: string): Promise<void>;
    /**
     * Checks if a table exists
    *
    * @example
    * const exists = await db.tableExists('users');
    * console.log(exists);
     */
    tableExists(tableName: string): Promise<boolean>;
    /**
     * Inserts a new record
    *
    * @example
    * const result = await db.insert('users', { name: 'Ann' });
    * console.log(result.lastID);
     */
    insert<T = any>(tableName: string, data: T): Promise<InsertResult>;
    /**
     * Finds records with optional conditions
    *
    * @example
    * const rows = await db.find('users', { age: { operator: '>=', value: 18 } }, { orderBy: 'name' });
     */
    find<T = any>(tableName: string, conditions?: QueryConditions, options?: FindOptions): Promise<T[]>;
    /**
     * Finds a single record
    *
    * @example
    * const user = await db.findOne('users', { id: 1 });
     */
    findOne<T = any>(tableName: string, conditions?: QueryConditions, options?: FindOptions): Promise<T | null>;
    /**
     * Updates records
    *
    * @example
    * await db.update('users', { age: 31 }, { id: 5 });
     */
    update<T = any>(tableName: string, data: Partial<T>, conditions?: QueryConditions): Promise<UpdateResult>;
    /**
     * Deletes records
    *
    * @example
    * await db.delete('users', { id: 10 });
     */
    delete(tableName: string, conditions?: QueryConditions): Promise<DeleteResult>;
    /**
     * Counts records
    *
    * @example
    * const c = await db.count('users', { active: 1 });
    * console.log(c);
     */
    count(tableName: string, conditions?: QueryConditions): Promise<number>;
    /**
     * Finds records with pagination
    *
    * @example
    * const paged = await db.findPaginated('users', {}, { page: 1, limit: 20 });
     */
    findPaginated<T = any>(tableName: string, conditions: QueryConditions | undefined, pagination: PaginationOptions, options?: FindOptions): Promise<PaginatedResult<T>>;
    /**
     * Executes operations in a transaction
    *
    * @example
    * await db.transaction(async () => {
    *   await db.insert('users', { name: 'Tx' });
    * });
     */
    transaction<T = any>(callback: TransactionCallback<T>, options?: TransactionOptions): Promise<T>;
    /**
     * Logs a message if logging is enabled
     */
    private _log;
    /**
     * Ensures the database is connected
     */
    private _ensureConnected;
    /**
     * Prepares a value for SQL
     */
    private _prepareValue;
    /**
     * Escapes a value for SQL
     */
    private _escapeValue;
    /**
     * Enables or disables logging
    *
    * @example
    * db.setLogging(true);
     */
    setLogging(enabled: boolean): void;
    /**
     * Gets the database instance (for advanced usage)
    *
    * @example
    * const raw = db.getDatabase();
    * // use raw driver methods if needed
     */
    getDatabase(): Database | null;
    /**
     * Gets the database file path
    *
    * @example
    * console.log(db.getDatabasePath());
     */
    getDatabasePath(): string;
}
