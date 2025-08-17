export interface SQLiteToolConfig {
    logging?: boolean;
    logger?: Logger;
    timeout?: number;
    verbose?: boolean;
    readonly?: boolean;
    fileMustExist?: boolean;
}
export interface Logger {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
}
export interface InsertResult {
    lastID: number;
    changes: number;
}
export interface UpdateResult {
    changes: number;
}
export interface DeleteResult {
    changes: number;
}
export interface CountResult {
    count: number;
}
export type Operator = '=' | '!=' | '<>' | '<' | '<=' | '>' | '>=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN' | 'NOT BETWEEN';
export interface QueryCondition {
    operator: Operator;
    value: any;
    secondValue?: any;
}
export interface QueryConditions {
    [key: string]: any | QueryCondition | any[];
}
export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: string | string[];
    direction?: 'ASC' | 'DESC';
    groupBy?: string | string[];
    having?: string;
    distinct?: boolean;
}
export interface FindOptions extends QueryOptions {
    columns?: string[];
}
export type ColumnType = 'INTEGER' | 'REAL' | 'TEXT' | 'BLOB' | 'NUMERIC' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'JSON';
export interface ColumnDefinition {
    type: ColumnType;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    required?: boolean;
    unique?: boolean;
    default?: any;
    check?: string;
    collate?: string;
    ref?: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
}
export interface TableSchema {
    [columnName: string]: ColumnDefinition;
}
export interface TableMetadata {
    _indexes?: IndexDefinition[];
    _constraints?: TableConstraint[];
}
export interface TableSchemaWithMetadata {
    schema: TableSchema;
    metadata: TableMetadata;
}
export interface IndexDefinition {
    fields: string[];
    unique?: boolean;
    name?: string;
}
export interface TableConstraint {
    type: 'PRIMARY KEY' | 'UNIQUE' | 'CHECK' | 'FOREIGN KEY';
    columns?: string[];
    expression?: string;
    references?: {
        table: string;
        column: string;
    };
    onDelete?: string;
    onUpdate?: string;
}
export interface TableOptions {
    withoutRowId?: boolean;
    strict?: boolean;
    temporary?: boolean;
}
export interface TransactionOptions {
    isolation?: 'DEFERRED' | 'IMMEDIATE' | 'EXCLUSIVE';
    timeout?: number;
}
export type TransactionCallback<T = any> = () => Promise<T>;
export interface ColumnBuilder {
    name: string;
    type: ColumnType;
    modifiers: string[];
}
export interface TableBuilderResult {
    columns: string[];
    constraints: string[];
}
export interface Migration {
    version: number;
    name: string;
    up: (db: any) => Promise<void>;
    down: (db: any) => Promise<void>;
}
export interface MigrationResult {
    version: number;
    applied: boolean;
    error?: string;
}
export interface BackupOptions {
    destination: string;
    progress?: (remainingPages: number, totalPages: number) => void;
    pagesPerStep?: number;
    sleepMs?: number;
}
export interface TableInfo {
    name: string;
    type: string;
    tbl_name: string;
    rootpage: number;
    sql: string;
}
export interface ColumnInfo {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
}
export interface IndexInfo {
    seq: number;
    name: string;
    unique: number;
    origin: string;
    partial: number;
}
export type PreparedValue = string | number | boolean | null | Date | Buffer;
export interface QueryResult<T = any> {
    data: T[];
    count: number;
    hasMore: boolean;
}
export interface PaginationOptions {
    page: number;
    limit: number;
    total?: number;
}
export interface PaginatedResult<T = any> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
