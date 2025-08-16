import { ColumnType, ColumnBuilder, TableBuilderResult } from '../types';

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
export class TableBuilder {
  private _tableName: string;
  private _columns: ColumnBuilder[] = [];
  private _constraints: string[] = [];
  private _currentColumn: ColumnBuilder | null = null;

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  // ================ COLUMN TYPES ================

  /**
   * Creates an auto-incrementing primary key column
   */
  id(name: string = 'id'): this {
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
  string(name: string, length?: number): this {
    this._currentColumn = {
      name,
      type: length ? `TEXT(${length})` as ColumnType : 'TEXT',
      modifiers: []
    };
    this._columns.push(this._currentColumn);
    return this;
  }

  /**
   * Creates a TEXT column (alias for string)
   */
  text(name: string): this {
    return this.string(name);
  }

  /**
   * Creates an INTEGER column
   */
  integer(name: string): this {
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
  real(name: string): this {
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
  boolean(name: string): this {
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
  blob(name: string): this {
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
  date(name: string): this {
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
  timestamp(name: string): this {
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
  numeric(name: string): this {
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
  json(name: string): this {
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
  primaryKey(): this {
    if (!this._currentColumn) {
      throw new Error('No column selected. Call a column type method first.');
    }
    this._currentColumn.modifiers.push('PRIMARY KEY');
    return this;
  }

  /**
   * Makes the current column auto-incrementing
   */
  autoIncrement(): this {
    if (!this._currentColumn) {
      throw new Error('No column selected. Call a column type method first.');
    }
    this._currentColumn.modifiers.push('AUTOINCREMENT');
    return this;
  }

  /**
   * Makes the current column NOT NULL
   */
  notNull(): this {
    if (!this._currentColumn) {
      throw new Error('No column selected. Call a column type method first.');
    }
    this._currentColumn.modifiers.push('NOT NULL');
    return this;
  }

  /**
   * Makes the current column UNIQUE
   */
  unique(): this {
    if (!this._currentColumn) {
      throw new Error('No column selected. Call a column type method first.');
    }
    this._currentColumn.modifiers.push('UNIQUE');
    return this;
  }

  /**
   * Sets a default value for the current column
   */
  default(value: any): this {
    if (!this._currentColumn) {
      throw new Error('No column selected. Call a column type method first.');
    }
    this._currentColumn.modifiers.push(`DEFAULT ${this._escapeValue(value)}`);
    return this;
  }

  /**
   * Adds a CHECK constraint to the current column
   */
  check(expression: string): this {
    if (!this._currentColumn) {
      throw new Error('No column selected. Call a column type method first.');
    }
    this._currentColumn.modifiers.push(`CHECK (${expression})`);
    return this;
  }

  /**
   * Sets the collation for the current column
   */
  collate(collation: string): this {
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
  foreignKey(columnName: string): this {
    this._constraints.push(`FOREIGN KEY (${columnName})`);
    return this;
  }

  /**
   * Sets the reference table and column for a foreign key
   */
  references(tableColumn: string): this {
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
  onDelete(action: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION'): this {
    const lastConstraint = this._constraints[this._constraints.length - 1];
    if (lastConstraint && lastConstraint.includes('REFERENCES')) {
      this._constraints[this._constraints.length - 1] = `${lastConstraint} ON DELETE ${action}`;
    }
    return this;
  }

  /**
   * Sets ON UPDATE action for foreign key
   */
  onUpdate(action: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION'): this {
    const lastConstraint = this._constraints[this._constraints.length - 1];
    if (lastConstraint && lastConstraint.includes('REFERENCES')) {
      this._constraints[this._constraints.length - 1] = `${lastConstraint} ON UPDATE ${action}`;
    }
    return this;
  }

  /**
   * Adds a composite primary key constraint
   */
  primary(columns: string | string[]): this {
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    this._constraints.push(`PRIMARY KEY (${columnList})`);
    return this;
  }

  /**
   * Adds a unique constraint
   */
  uniqueConstraint(columns: string | string[]): this {
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    this._constraints.push(`UNIQUE (${columnList})`);
    return this;
  }

  /**
   * Adds a check constraint
   */
  checkConstraint(expression: string): this {
    this._constraints.push(`CHECK (${expression})`);
    return this;
  }

  // ================ BUILDING ================

  /**
   * Builds the final table definition
   */
  build(): TableBuilderResult {
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
  private _escapeValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string') {
      if (value === 'CURRENT_TIMESTAMP') return value;
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return value.toString();
  }
} 