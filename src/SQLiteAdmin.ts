import { Database } from 'sqlite';
import {
  SQLiteToolConfig,
  Migration,
  MigrationResult,
  BackupOptions,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  PaginatedResult,
  PaginationOptions
} from '../types';
import { SQLiteTool } from './SQLiteTool';
import fs from 'fs';
import path from 'path';

/**
 * Administrative features for SQLiteTool including migrations, backups, and statistics.
 */
export class SQLiteAdmin {
  private _db: SQLiteTool;

  constructor(db: SQLiteTool) {
    this._db = db;
  }

  // ==================== MIGRATION METHODS ====================

  /**
   * Creates the migrations table
   */
  private async createMigrationsTable(): Promise<void> {
    await this._db.createTable('migrations', builder => {
      builder
        .integer('id')
        .primaryKey()
        .autoIncrement()
        .integer('version')
        .notNull()
        .string('name')
        .notNull()
        .date('applied_at')
        .default('CURRENT_TIMESTAMP');
    });
  }

  /**
   * Runs migrations
   *
   * @example
   * const admin = new SQLiteAdmin(db);
   * await admin.runMigrations(migrationsArray);
   */
  async runMigrations(migrations: Migration[]): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      await this._db.transaction(async () => {
        await this.createMigrationsTable();

        const appliedMigrations = await this._db.find('migrations', {}, { columns: ['version'] });
        const appliedVersions = new Set(appliedMigrations.map((m: any) => m.version));

        const sortedMigrations = migrations.sort((a, b) => a.version - b.version);

        for (const migration of sortedMigrations) {
          if (!appliedVersions.has(migration.version)) {
            try {
              await migration.up(this._db);
              await this._db.insert('migrations', {
                version: migration.version,
                name: migration.name
              });

              results.push({ version: migration.version, applied: true });
            } catch (error) {
              results.push({
                version: migration.version,
                applied: false,
                error: error instanceof Error ? error.message : String(error)
              });
              throw error;
            }
          }
        }
      });
    } catch (error) {
      throw error;
    }

    return results;
  }

  /**
   * Rolls back migrations; caller must provide the migrations list so we can
   * locate the migration objects to run `down`.
   *
   * @example
   * const admin = new SQLiteAdmin(db);
   * await admin.rollbackMigrations(migrationsArray, 1);
   */
  async rollbackMigrations(migrations: Migration[], count: number = 1): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      await this._db.transaction(async () => {
        const appliedMigrations = await this._db.find('migrations', {}, {
          columns: ['version', 'name'],
          orderBy: 'version',
          direction: 'DESC',
          limit: count
        });

        for (const appliedMigration of appliedMigrations) {
          const migration = migrations.find(m => m.version === appliedMigration.version);
          if (migration) {
            try {
              await migration.down(this._db);
              await this._db.delete('migrations', { version: appliedMigration.version });

              results.push({ version: appliedMigration.version, applied: false });
            } catch (error) {
              results.push({
                version: appliedMigration.version,
                applied: false,
                error: error instanceof Error ? error.message : String(error)
              });
              throw error;
            }
          }
        }
      });
    } catch (error) {
      throw error;
    }

    return results;
  }

  // ==================== BACKUP METHODS ====================

  /**
   * Creates a backup of the database.
   *
   * @example
   * await admin.backup({ destination: 'backups/mydb.sqlite' });
   */
  async backup(options: BackupOptions): Promise<void> {
    const database = this._db.getDatabase();
    if (!database) {
      throw new Error('Database not connected');
    }

    const sourcePath = this._db.getDatabasePath();
    const destPath = options.destination;

    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, destPath);
  }

  // ==================== STATISTICS METHODS ====================

  /**
   * Gets information about all tables
   *
   * @example
   * const tables = await admin.getTables();
   * console.log(tables);
   */
  async getTables(): Promise<TableInfo[]> {
    const database = this._db.getDatabase();
    if (!database) throw new Error('Database not connected');

    const tables = await database.all(`
      SELECT name, type, tbl_name, rootpage, sql 
      FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);

    return tables;
  }

  /**
   * Gets information about columns in a table
   *
   * @example
   * const cols = await admin.getColumns('users');
   * console.log(cols);
   */
  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const database = this._db.getDatabase();
    if (!database) throw new Error('Database not connected');

    const columns = await database.all(`PRAGMA table_info(${tableName})`);
    return columns;
  }

  /**
   * Gets information about indexes in a table
   *
   * @example
   * const indexes = await admin.getIndexes('users');
   * console.log(indexes);
   */
  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const database = this._db.getDatabase();
    if (!database) throw new Error('Database not connected');

    const indexes = await database.all(`PRAGMA index_list(${tableName})`);
    return indexes;
  }

  /**
   * Gets database statistics
   *
   * @example
   * const stats = await admin.getDatabaseStats();
   * console.log(stats);
   */
  async getDatabaseStats(): Promise<{
    tableCount: number;
    totalRows: number;
    databaseSize: number;
    lastModified: Date;
  }> {
    const tables = await this.getTables();
    let totalRows = 0;

    for (const table of tables) {
      const count = await this._db.count(table.name);
      totalRows += count;
    }

    const dbPath = this._db.getDatabasePath();
    const stats = fs.statSync(dbPath);

    return {
      tableCount: tables.length,
      totalRows,
      databaseSize: stats.size,
      lastModified: stats.mtime
    };
  }

  /**
   * Gets table statistics
   *
   * @example
   * const tStats = await admin.getTableStats('users');
   * console.log(tStats);
   */
  async getTableStats(tableName: string): Promise<{
    rowCount: number;
    columnCount: number;
    indexCount: number;
    size: number;
  }> {
    const rowCount = await this._db.count(tableName);
    const columns = await this.getColumns(tableName);
    const indexes = await this.getIndexes(tableName);

    const dbPath = this._db.getDatabasePath();
    const stats = fs.statSync(dbPath);
    const size = Math.round((rowCount * columns.length * 100) + stats.size / 1000); // Rough estimate

    return {
      rowCount,
      columnCount: columns.length,
      indexCount: indexes.length,
      size
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Optimizes the database
   *
   * @example
   * await admin.optimize();
   */
  async optimize(): Promise<void> {
    const database = this._db.getDatabase();
    if (!database) throw new Error('Database not connected');

    await database.exec('VACUUM');
    await database.exec('ANALYZE');
  }

  /**
   * Checks database integrity
   *
   * @example
   * const ok = await admin.checkIntegrity();
   * console.log('integrity ok?', ok);
   */
  async checkIntegrity(): Promise<boolean> {
    const database = this._db.getDatabase();
    if (!database) throw new Error('Database not connected');

    const result = await database.get('PRAGMA integrity_check');
    return result.integrity_check === 'ok';
  }

  /**
   * Gets database configuration
   *
   * @example
   * const cfg = await admin.getConfig();
   * console.log(cfg);
   */
  async getConfig(): Promise<{
    version: string;
    encoding: string;
    pageSize: number;
    pageCount: number;
    busyTimeout: number;
  }> {
    const database = this._db.getDatabase();
    if (!database) throw new Error('Database not connected');

    const version = await database.get('SELECT sqlite_version() as version');
    const encoding = await database.get('PRAGMA encoding');
    const pageSize = await database.get('PRAGMA page_size');
    const pageCount = await database.get('PRAGMA page_count');
    const busyTimeout = await database.get('PRAGMA busy_timeout');

    return {
      version: version.version,
      encoding: encoding.encoding,
      pageSize: pageSize.page_size,
      pageCount: pageCount.page_count,
      busyTimeout: busyTimeout.busy_timeout
    };
  }
}