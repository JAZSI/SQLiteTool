import { TableBuilderResult } from '../types';
/**
 * Fluent interface for building SQLite table schemas
 *
 * @example
 * const builder = new TableBuilder('users');
 * builder
 *   .id()
 *   .string('name').notNull()
 *   .integer('age')
 *   .boolean('active').default(true)
 *   .date('created_at');
 *
 * const { columns, constraints } = builder.build();
 */
export declare class TableBuilder {
    private _tableName;
    private _columns;
    private _constraints;
    private _currentColumn;
    constructor(tableName: string);
    /**
     * Creates an auto-incrementing primary key column
     */
    id(name?: string): this;
    /**
     * Creates a TEXT column
     */
    string(name: string, length?: number): this;
    /**
     * Creates a TEXT column (alias for string)
     */
    text(name: string): this;
    /**
     * Creates an INTEGER column
     */
    integer(name: string): this;
    /**
     * Creates a REAL column
     */
    real(name: string): this;
    /**
     * Creates a BOOLEAN column (stored as INTEGER)
     */
    boolean(name: string): this;
    /**
     * Creates a BLOB column
     */
    blob(name: string): this;
    /**
     * Creates a DATE column (stored as TEXT)
     */
    date(name: string): this;
    /**
     * Creates a TIMESTAMP column (stored as INTEGER)
     */
    timestamp(name: string): this;
    /**
     * Creates a NUMERIC column
     */
    numeric(name: string): this;
    /**
     * Creates a JSON column (stored as TEXT)
     */
    json(name: string): this;
    /**
     * Makes the current column a primary key
     */
    primaryKey(): this;
    /**
     * Makes the current column auto-incrementing
     */
    autoIncrement(): this;
    /**
     * Makes the current column NOT NULL
     */
    notNull(): this;
    /**
     * Makes the current column UNIQUE
     */
    unique(): this;
    /**
     * Sets a default value for the current column
     */
    default(value: any): this;
    /**
     * Adds a CHECK constraint to the current column
     */
    check(expression: string): this;
    /**
     * Sets the collation for the current column
     */
    collate(collation: string): this;
    /**
     * Adds a foreign key constraint
     */
    foreignKey(columnName: string): this;
    /**
     * Sets the reference table and column for a foreign key
     */
    references(tableColumn: string): this;
    /**
     * Sets ON DELETE action for foreign key
     */
    onDelete(action: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION'): this;
    /**
     * Sets ON UPDATE action for foreign key
     */
    onUpdate(action: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION'): this;
    /**
     * Adds a composite primary key constraint
     */
    primary(columns: string | string[]): this;
    /**
     * Adds a unique constraint
     */
    uniqueConstraint(columns: string | string[]): this;
    /**
     * Adds a check constraint
     */
    checkConstraint(expression: string): this;
    /**
     * Builds the final table definition
     */
    build(): TableBuilderResult;
    /**
     * Escapes a value for SQL
     */
    private _escapeValue;
}
