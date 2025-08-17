import { Migration, MigrationResult, BackupOptions, TableInfo, ColumnInfo, IndexInfo } from '../types';
import { SQLiteTool } from './SQLiteTool';
/**
 * Administrative features for SQLiteTool including migrations, backups, and statistics.
 */
export declare class SQLiteAdmin {
    private _db;
    constructor(db: SQLiteTool);
    /**
     * Creates the migrations table
     */
    private createMigrationsTable;
    /**
     * Runs migrations
     *
     * @example
     * const admin = new SQLiteAdmin(db);
     * await admin.runMigrations(migrationsArray);
     */
    runMigrations(migrations: Migration[]): Promise<MigrationResult[]>;
    /**
     * Rolls back migrations; caller must provide the migrations list so we can
     * locate the migration objects to run `down`.
     *
     * @example
     * const admin = new SQLiteAdmin(db);
     * await admin.rollbackMigrations(migrationsArray, 1);
     */
    rollbackMigrations(migrations: Migration[], count?: number): Promise<MigrationResult[]>;
    /**
     * Creates a backup of the database.
     *
     * @example
     * await admin.backup({ destination: 'backups/mydb.sqlite' });
     */
    backup(options: BackupOptions): Promise<void>;
    /**
     * Gets information about all tables
     *
     * @example
     * const tables = await admin.getTables();
     * console.log(tables);
     */
    getTables(): Promise<TableInfo[]>;
    /**
     * Gets information about columns in a table
     *
     * @example
     * const cols = await admin.getColumns('users');
     * console.log(cols);
     */
    getColumns(tableName: string): Promise<ColumnInfo[]>;
    /**
     * Gets information about indexes in a table
     *
     * @example
     * const indexes = await admin.getIndexes('users');
     * console.log(indexes);
     */
    getIndexes(tableName: string): Promise<IndexInfo[]>;
    /**
     * Gets database statistics
     *
     * @example
     * const stats = await admin.getDatabaseStats();
     * console.log(stats);
     */
    getDatabaseStats(): Promise<{
        tableCount: number;
        totalRows: number;
        databaseSize: number;
        lastModified: Date;
    }>;
    /**
     * Gets table statistics
     *
     * @example
     * const tStats = await admin.getTableStats('users');
     * console.log(tStats);
     */
    getTableStats(tableName: string): Promise<{
        rowCount: number;
        columnCount: number;
        indexCount: number;
        size: number;
    }>;
    /**
     * Optimizes the database
     *
     * @example
     * await admin.optimize();
     */
    optimize(): Promise<void>;
    /**
     * Checks database integrity
     *
     * @example
     * const ok = await admin.checkIntegrity();
     * console.log('integrity ok?', ok);
     */
    checkIntegrity(): Promise<boolean>;
    /**
     * Gets database configuration
     *
     * @example
     * const cfg = await admin.getConfig();
     * console.log(cfg);
     */
    getConfig(): Promise<{
        version: string;
        encoding: string;
        pageSize: number;
        pageCount: number;
        busyTimeout: number;
    }>;
}
