"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableBuilder = void 0;
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
class TableBuilder {
    constructor(tableName) {
        this._columns = [];
        this._constraints = [];
        this._currentColumn = null;
        this._tableName = tableName;
    }
    // ================ COLUMN TYPES ================
    /**
     * Creates an auto-incrementing primary key column
     */
    id(name = 'id') {
        this._currentColumn = {
            name,
            type: 'INTEGER',
            modifiers: ['PRIMARY KEY', 'AUTOINCREMENT']
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a TEXT column
     */
    string(name, length) {
        this._currentColumn = {
            name,
            type: length ? `TEXT(${length})` : 'TEXT',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a TEXT column (alias for string)
     */
    text(name) {
        return this.string(name);
    }
    /**
     * Creates an INTEGER column
     */
    integer(name) {
        this._currentColumn = {
            name,
            type: 'INTEGER',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a REAL column
     */
    real(name) {
        this._currentColumn = {
            name,
            type: 'REAL',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a BOOLEAN column (stored as INTEGER)
     */
    boolean(name) {
        this._currentColumn = {
            name,
            type: 'INTEGER',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a BLOB column
     */
    blob(name) {
        this._currentColumn = {
            name,
            type: 'BLOB',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a DATE column (stored as TEXT)
     */
    date(name) {
        this._currentColumn = {
            name,
            type: 'TEXT',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this.default('CURRENT_TIMESTAMP');
    }
    /**
     * Creates a TIMESTAMP column (stored as INTEGER)
     */
    timestamp(name) {
        this._currentColumn = {
            name,
            type: 'INTEGER',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a NUMERIC column
     */
    numeric(name) {
        this._currentColumn = {
            name,
            type: 'NUMERIC',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    /**
     * Creates a JSON column (stored as TEXT)
     */
    json(name) {
        this._currentColumn = {
            name,
            type: 'TEXT',
            modifiers: []
        };
        this._columns.push(this._currentColumn);
        return this;
    }
    // ================ COLUMN MODIFIERS ================
    /**
     * Makes the current column a primary key
     */
    primaryKey() {
        if (!this._currentColumn) {
            throw new Error('No column selected. Call a column type method first.');
        }
        this._currentColumn.modifiers.push('PRIMARY KEY');
        return this;
    }
    /**
     * Makes the current column auto-incrementing
     */
    autoIncrement() {
        if (!this._currentColumn) {
            throw new Error('No column selected. Call a column type method first.');
        }
        this._currentColumn.modifiers.push('AUTOINCREMENT');
        return this;
    }
    /**
     * Makes the current column NOT NULL
     */
    notNull() {
        if (!this._currentColumn) {
            throw new Error('No column selected. Call a column type method first.');
        }
        this._currentColumn.modifiers.push('NOT NULL');
        return this;
    }
    /**
     * Makes the current column UNIQUE
     */
    unique() {
        if (!this._currentColumn) {
            throw new Error('No column selected. Call a column type method first.');
        }
        this._currentColumn.modifiers.push('UNIQUE');
        return this;
    }
    /**
     * Sets a default value for the current column
     */
    default(value) {
        if (!this._currentColumn) {
            throw new Error('No column selected. Call a column type method first.');
        }
        this._currentColumn.modifiers.push(`DEFAULT ${this._escapeValue(value)}`);
        return this;
    }
    /**
     * Adds a CHECK constraint to the current column
     */
    check(expression) {
        if (!this._currentColumn) {
            throw new Error('No column selected. Call a column type method first.');
        }
        this._currentColumn.modifiers.push(`CHECK (${expression})`);
        return this;
    }
    /**
     * Sets the collation for the current column
     */
    collate(collation) {
        if (!this._currentColumn) {
            throw new Error('No column selected. Call a column type method first.');
        }
        this._currentColumn.modifiers.push(`COLLATE ${collation}`);
        return this;
    }
    // ================ TABLE CONSTRAINTS ================
    /**
     * Adds a foreign key constraint
     */
    foreignKey(columnName) {
        this._constraints.push(`FOREIGN KEY (${columnName})`);
        return this;
    }
    /**
     * Sets the reference table and column for a foreign key
     */
    references(tableColumn) {
        const [table, column] = tableColumn.split('.');
        const lastConstraint = this._constraints[this._constraints.length - 1];
        if (lastConstraint && lastConstraint.startsWith('FOREIGN KEY')) {
            this._constraints[this._constraints.length - 1] = `${lastConstraint} REFERENCES ${table}(${column})`;
        }
        return this;
    }
    /**
     * Sets ON DELETE action for foreign key
     */
    onDelete(action) {
        const lastConstraint = this._constraints[this._constraints.length - 1];
        if (lastConstraint && lastConstraint.includes('REFERENCES')) {
            this._constraints[this._constraints.length - 1] = `${lastConstraint} ON DELETE ${action}`;
        }
        return this;
    }
    /**
     * Sets ON UPDATE action for foreign key
     */
    onUpdate(action) {
        const lastConstraint = this._constraints[this._constraints.length - 1];
        if (lastConstraint && lastConstraint.includes('REFERENCES')) {
            this._constraints[this._constraints.length - 1] = `${lastConstraint} ON UPDATE ${action}`;
        }
        return this;
    }
    /**
     * Adds a composite primary key constraint
     */
    primary(columns) {
        const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
        this._constraints.push(`PRIMARY KEY (${columnList})`);
        return this;
    }
    /**
     * Adds a unique constraint
     */
    uniqueConstraint(columns) {
        const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
        this._constraints.push(`UNIQUE (${columnList})`);
        return this;
    }
    /**
     * Adds a check constraint
     */
    checkConstraint(expression) {
        this._constraints.push(`CHECK (${expression})`);
        return this;
    }
    // ================ BUILDING ================
    /**
     * Builds the final table definition
     */
    build() {
        const columns = this._columns.map(col => {
            let definition = `${col.name} ${col.type}`;
            if (col.modifiers.length > 0) {
                definition += ' ' + col.modifiers.join(' ');
            }
            return definition;
        });
        return {
            columns,
            constraints: [...this._constraints]
        };
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
}
exports.TableBuilder = TableBuilder;
