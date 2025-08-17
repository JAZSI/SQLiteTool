import { Operator } from '../types';
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
export declare class QueryBuilder {
    private _tableName;
    private _selectColumns;
    private _whereConditions;
    private _whereValues;
    private _orderByClause;
    private _groupByClause;
    private _havingClause;
    private _limitClause;
    private _offsetClause;
    private _distinct;
    private _joins;
    constructor(tableName: string);
    /**
     * Sets the columns to select
     */
    select(columns: string[]): this;
    /**
     * Adds DISTINCT to the query
     */
    distinct(): this;
    /**
     * Adds a WHERE condition
     */
    where(column: string, operator: Operator, value: any): this;
    /**
     * Adds a WHERE condition with custom operator
     */
    whereRaw(condition: string, values?: any[]): this;
    /**
     * Adds a WHERE IN condition
     */
    whereIn(column: string, values: any[]): this;
    /**
     * Adds a WHERE NOT IN condition
     */
    whereNotIn(column: string, values: any[]): this;
    /**
     * Adds a WHERE NULL condition
     */
    whereNull(column: string): this;
    /**
     * Adds a WHERE NOT NULL condition
     */
    whereNotNull(column: string): this;
    /**
     * Adds a WHERE BETWEEN condition
     */
    whereBetween(column: string, min: any, max: any): this;
    /**
     * Adds a WHERE LIKE condition
     */
    whereLike(column: string, pattern: string): this;
    /**
     * Adds a WHERE NOT LIKE condition
     */
    whereNotLike(column: string, pattern: string): this;
    /**
     * Adds an OR WHERE condition
     */
    orWhere(column: string, operator: Operator, value: any): this;
    /**
     * Adds a JOIN clause
     */
    join(table: string, first: string, operator: string, second: string, type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'): this;
    /**
     * Adds a LEFT JOIN clause
     */
    leftJoin(table: string, first: string, operator: string, second: string): this;
    /**
     * Adds a RIGHT JOIN clause
     */
    rightJoin(table: string, first: string, operator: string, second: string): this;
    /**
     * Sets ORDER BY clause
     */
    orderBy(column: string, direction?: 'ASC' | 'DESC'): this;
    /**
     * Sets GROUP BY clause
     */
    groupBy(columns: string | string[]): this;
    /**
     * Sets HAVING clause
     */
    having(condition: string, values?: any[]): this;
    /**
     * Sets LIMIT clause
     */
    limit(count: number): this;
    /**
     * Sets OFFSET clause
     */
    offset(count: number): this;
    /**
     * Sets pagination (LIMIT and OFFSET)
     */
    paginate(page: number, perPage: number): this;
    /**
     * Builds the final SQL query
     */
    toSQL(): {
        sql: string;
        values: any[];
    };
    /**
     * Builds a COUNT query
     */
    toCountSQL(): {
        sql: string;
        values: any[];
    };
}
/**
 * Utility class for building complex WHERE conditions
 */
export declare class WhereBuilder {
    private _conditions;
    private _values;
    /**
     * Adds a condition
     */
    and(column: string, operator: Operator, value: any): this;
    /**
     * Adds an OR condition
     */
    or(column: string, operator: Operator, value: any): this;
    /**
     * Adds a raw condition
     */
    raw(condition: string, values?: any[]): this;
    /**
     * Builds the WHERE clause
     */
    build(): {
        clause: string;
        values: any[];
    };
}
