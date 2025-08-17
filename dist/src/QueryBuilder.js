"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereBuilder = exports.QueryBuilder = void 0;
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
class QueryBuilder {
    constructor(tableName) {
        this._selectColumns = ['*'];
        this._whereConditions = [];
        this._whereValues = [];
        this._orderByClause = '';
        this._groupByClause = '';
        this._havingClause = '';
        this._limitClause = '';
        this._offsetClause = '';
        this._distinct = false;
        this._joins = [];
        this._tableName = tableName;
    }
    /**
     * Sets the columns to select
     */
    select(columns) {
        this._selectColumns = columns;
        return this;
    }
    /**
     * Adds DISTINCT to the query
     */
    distinct() {
        this._distinct = true;
        return this;
    }
    /**
     * Adds a WHERE condition
     */
    where(column, operator, value) {
        this._whereConditions.push(`${column} ${operator} ?`);
        this._whereValues.push(value);
        return this;
    }
    /**
     * Adds a WHERE condition with custom operator
     */
    whereRaw(condition, values = []) {
        this._whereConditions.push(condition);
        this._whereValues.push(...values);
        return this;
    }
    /**
     * Adds a WHERE IN condition
     */
    whereIn(column, values) {
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
    whereNotIn(column, values) {
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
    whereNull(column) {
        this._whereConditions.push(`${column} IS NULL`);
        return this;
    }
    /**
     * Adds a WHERE NOT NULL condition
     */
    whereNotNull(column) {
        this._whereConditions.push(`${column} IS NOT NULL`);
        return this;
    }
    /**
     * Adds a WHERE BETWEEN condition
     */
    whereBetween(column, min, max) {
        this._whereConditions.push(`${column} BETWEEN ? AND ?`);
        this._whereValues.push(min, max);
        return this;
    }
    /**
     * Adds a WHERE LIKE condition
     */
    whereLike(column, pattern) {
        this._whereConditions.push(`${column} LIKE ?`);
        this._whereValues.push(pattern);
        return this;
    }
    /**
     * Adds a WHERE NOT LIKE condition
     */
    whereNotLike(column, pattern) {
        this._whereConditions.push(`${column} NOT LIKE ?`);
        this._whereValues.push(pattern);
        return this;
    }
    /**
     * Adds an OR WHERE condition
     */
    orWhere(column, operator, value) {
        if (this._whereConditions.length > 0) {
            const lastCondition = this._whereConditions.pop();
            this._whereConditions.push(`${lastCondition} OR ${column} ${operator} ?`);
        }
        else {
            this._whereConditions.push(`${column} ${operator} ?`);
        }
        this._whereValues.push(value);
        return this;
    }
    /**
     * Adds a JOIN clause
     */
    join(table, first, operator, second, type = 'INNER') {
        this._joins.push(`${type} JOIN ${table} ON ${first} ${operator} ${second}`);
        return this;
    }
    /**
     * Adds a LEFT JOIN clause
     */
    leftJoin(table, first, operator, second) {
        return this.join(table, first, operator, second, 'LEFT');
    }
    /**
     * Adds a RIGHT JOIN clause
     */
    rightJoin(table, first, operator, second) {
        return this.join(table, first, operator, second, 'RIGHT');
    }
    /**
     * Sets ORDER BY clause
     */
    orderBy(column, direction = 'ASC') {
        this._orderByClause = `ORDER BY ${column} ${direction}`;
        return this;
    }
    /**
     * Sets GROUP BY clause
     */
    groupBy(columns) {
        const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
        this._groupByClause = `GROUP BY ${columnList}`;
        return this;
    }
    /**
     * Sets HAVING clause
     */
    having(condition, values = []) {
        this._havingClause = `HAVING ${condition}`;
        this._whereValues.push(...values);
        return this;
    }
    /**
     * Sets LIMIT clause
     */
    limit(count) {
        this._limitClause = `LIMIT ${count}`;
        return this;
    }
    /**
     * Sets OFFSET clause
     */
    offset(count) {
        this._offsetClause = `OFFSET ${count}`;
        return this;
    }
    /**
     * Sets pagination (LIMIT and OFFSET)
     */
    paginate(page, perPage) {
        const offset = (page - 1) * perPage;
        return this.limit(perPage).offset(offset);
    }
    /**
     * Builds the final SQL query
     */
    toSQL() {
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
    toCountSQL() {
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
exports.QueryBuilder = QueryBuilder;
/**
 * Utility class for building complex WHERE conditions
 */
class WhereBuilder {
    constructor() {
        this._conditions = [];
        this._values = [];
    }
    /**
     * Adds a condition
     */
    and(column, operator, value) {
        this._conditions.push(`${column} ${operator} ?`);
        this._values.push(value);
        return this;
    }
    /**
     * Adds an OR condition
     */
    or(column, operator, value) {
        this._conditions.push('OR');
        this._conditions.push(`${column} ${operator} ?`);
        this._values.push(value);
        return this;
    }
    /**
     * Adds a raw condition
     */
    raw(condition, values = []) {
        this._conditions.push(condition);
        this._values.push(...values);
        return this;
    }
    /**
     * Builds the WHERE clause
     */
    build() {
        return {
            clause: this._conditions.join(' '),
            values: [...this._values]
        };
    }
}
exports.WhereBuilder = WhereBuilder;
