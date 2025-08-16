import { QueryConditions, QueryOptions, Operator, QueryCondition } from '../types';

/**
 * Fluent interface for building SQL queries
 * 
 * @example
 * const query = new QueryBuilder('users')
 *   .select(['id', 'name', 'email'])
 *   .where('age', '>', 18)
 *   .whereIn('status', ['active', 'pending'])
 *   .orderBy('name', 'ASC')
 *   .limit(10);
 * 
 * const sql = query.toSQL();
 */
export class QueryBuilder {
  private _tableName: string;
  private _selectColumns: string[] = ['*'];
  private _whereConditions: string[] = [];
  private _whereValues: any[] = [];
  private _orderByClause: string = '';
  private _groupByClause: string = '';
  private _havingClause: string = '';
  private _limitClause: string = '';
  private _offsetClause: string = '';
  private _distinct: boolean = false;
  private _joins: string[] = [];

  constructor(tableName: string) {
    this._tableName = tableName;
  }

  /**
   * Sets the columns to select
   */
  select(columns: string[]): this {
    this._selectColumns = columns;
    return this;
  }

  /**
   * Adds DISTINCT to the query
   */
  distinct(): this {
    this._distinct = true;
    return this;
  }

  /**
   * Adds a WHERE condition
   */
  where(column: string, operator: Operator, value: any): this {
    this._whereConditions.push(`${column} ${operator} ?`);
    this._whereValues.push(value);
    return this;
  }

  /**
   * Adds a WHERE condition with custom operator
   */
  whereRaw(condition: string, values: any[] = []): this {
    this._whereConditions.push(condition);
    this._whereValues.push(...values);
    return this;
  }

  /**
   * Adds a WHERE IN condition
   */
  whereIn(column: string, values: any[]): this {
    if (values.length === 0) {
      this._whereConditions.push('1 = 0'); // Always false
      return this;
    }
    const placeholders = values.map(() => '?').join(', ');
    this._whereConditions.push(`${column} IN (${placeholders})`);
    this._whereValues.push(...values);
    return this;
  }

  /**
   * Adds a WHERE NOT IN condition
   */
  whereNotIn(column: string, values: any[]): this {
    if (values.length === 0) {
      return this;
    }
    const placeholders = values.map(() => '?').join(', ');
    this._whereConditions.push(`${column} NOT IN (${placeholders})`);
    this._whereValues.push(...values);
    return this;
  }

  /**
   * Adds a WHERE NULL condition
   */
  whereNull(column: string): this {
    this._whereConditions.push(`${column} IS NULL`);
    return this;
  }

  /**
   * Adds a WHERE NOT NULL condition
   */
  whereNotNull(column: string): this {
    this._whereConditions.push(`${column} IS NOT NULL`);
    return this;
  }

  /**
   * Adds a WHERE BETWEEN condition
   */
  whereBetween(column: string, min: any, max: any): this {
    this._whereConditions.push(`${column} BETWEEN ? AND ?`);
    this._whereValues.push(min, max);
    return this;
  }

  /**
   * Adds a WHERE LIKE condition
   */
  whereLike(column: string, pattern: string): this {
    this._whereConditions.push(`${column} LIKE ?`);
    this._whereValues.push(pattern);
    return this;
  }

  /**
   * Adds a WHERE NOT LIKE condition
   */
  whereNotLike(column: string, pattern: string): this {
    this._whereConditions.push(`${column} NOT LIKE ?`);
    this._whereValues.push(pattern);
    return this;
  }

  /**
   * Adds an OR WHERE condition
   */
  orWhere(column: string, operator: Operator, value: any): this {
    if (this._whereConditions.length > 0) {
      const lastCondition = this._whereConditions.pop();
      this._whereConditions.push(`${lastCondition} OR ${column} ${operator} ?`);
    } else {
      this._whereConditions.push(`${column} ${operator} ?`);
    }
    this._whereValues.push(value);
    return this;
  }

  /**
   * Adds a JOIN clause
   */
  join(table: string, first: string, operator: string, second: string, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'): this {
    this._joins.push(`${type} JOIN ${table} ON ${first} ${operator} ${second}`);
    return this;
  }

  /**
   * Adds a LEFT JOIN clause
   */
  leftJoin(table: string, first: string, operator: string, second: string): this {
    return this.join(table, first, operator, second, 'LEFT');
  }

  /**
   * Adds a RIGHT JOIN clause
   */
  rightJoin(table: string, first: string, operator: string, second: string): this {
    return this.join(table, first, operator, second, 'RIGHT');
  }

  /**
   * Sets ORDER BY clause
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderByClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  /**
   * Sets GROUP BY clause
   */
  groupBy(columns: string | string[]): this {
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    this._groupByClause = `GROUP BY ${columnList}`;
    return this;
  }

  /**
   * Sets HAVING clause
   */
  having(condition: string, values: any[] = []): this {
    this._havingClause = `HAVING ${condition}`;
    this._whereValues.push(...values);
    return this;
  }

  /**
   * Sets LIMIT clause
   */
  limit(count: number): this {
    this._limitClause = `LIMIT ${count}`;
    return this;
  }

  /**
   * Sets OFFSET clause
   */
  offset(count: number): this {
    this._offsetClause = `OFFSET ${count}`;
    return this;
  }

  /**
   * Sets pagination (LIMIT and OFFSET)
   */
  paginate(page: number, perPage: number): this {
    const offset = (page - 1) * perPage;
    return this.limit(perPage).offset(offset);
  }

  /**
   * Builds the final SQL query
   */
  toSQL(): { sql: string; values: any[] } {
    let sql = 'SELECT ';
    
    if (this._distinct) {
      sql += 'DISTINCT ';
    }
    
    sql += this._selectColumns.join(', ');
    sql += ` FROM ${this._tableName}`;

    if (this._joins.length > 0) {
      sql += ' ' + this._joins.join(' ');
    }

    if (this._whereConditions.length > 0) {
      sql += ' WHERE ' + this._whereConditions.join(' AND ');
    }

    if (this._groupByClause) {
      sql += ' ' + this._groupByClause;
    }

    if (this._havingClause) {
      sql += ' ' + this._havingClause;
    }

    if (this._orderByClause) {
      sql += ' ' + this._orderByClause;
    }

    if (this._limitClause) {
      sql += ' ' + this._limitClause;
    }

    if (this._offsetClause) {
      sql += ' ' + this._offsetClause;
    }

    return {
      sql,
      values: [...this._whereValues]
    };
  }

  /**
   * Builds a COUNT query
   */
  toCountSQL(): { sql: string; values: any[] } {
    let sql = 'SELECT COUNT(*) as count FROM ' + this._tableName;

    if (this._joins.length > 0) {
      sql += ' ' + this._joins.join(' ');
    }

    if (this._whereConditions.length > 0) {
      sql += ' WHERE ' + this._whereConditions.join(' AND ');
    }

    if (this._groupByClause) {
      sql += ' ' + this._groupByClause;
    }

    if (this._havingClause) {
      sql += ' ' + this._havingClause;
    }

    return {
      sql,
      values: [...this._whereValues]
    };
  }
}

/**
 * Utility class for building complex WHERE conditions
 */
export class WhereBuilder {
  private _conditions: string[] = [];
  private _values: any[] = [];

  /**
   * Adds a condition
   */
  and(column: string, operator: Operator, value: any): this {
    this._conditions.push(`${column} ${operator} ?`);
    this._values.push(value);
    return this;
  }

  /**
   * Adds an OR condition
   */
  or(column: string, operator: Operator, value: any): this {
    this._conditions.push('OR');
    this._conditions.push(`${column} ${operator} ?`);
    this._values.push(value);
    return this;
  }

  /**
   * Adds a raw condition
   */
  raw(condition: string, values: any[] = []): this {
    this._conditions.push(condition);
    this._values.push(...values);
    return this;
  }

  /**
   * Builds the WHERE clause
   */
  build(): { clause: string; values: any[] } {
    return {
      clause: this._conditions.join(' '),
      values: [...this._values]
    };
  }
} 