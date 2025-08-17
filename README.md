# sqlite-tool

A TypeScript helper library for working with SQLite databases.

---

## Quick start

A runnable example that creates a database file, creates a table with `TableBuilder`, inserts rows and queries them.

```ts
import { SQLiteTool } from 'sqlite-tool'; // or './dist' while developing

async function main() {
  const db = new SQLiteTool('data/example.sqlite', { logging: true });
  await db.connect();

  // Create table using the fluent TableBuilder
  await db.createTable('users', t => {
    t.id();
    t.string('name').notNull();
    t.string('email').unique();
    t.integer('age');
    t.date('created_at');
  });

  // Insert rows
  await db.insert('users', { name: 'Alice', email: 'alice@example.com', age: 28 });
  const res = await db.insert('users', { name: 'Bob', email: 'bob@example.com', age: 34 });
  console.log('Inserted id', res.lastID);

  // Basic find
  const adults = await db.find('users', { age: { operator: '>=', value: 18 } }, { orderBy: 'name' });
  console.log('Adults:', adults);

  // Paginated query
  const page = await db.findPaginated('users', {}, { page: 1, limit: 10 });
  console.log('Pagination:', page.pagination);

  await db.close();
}

main().catch(console.error);
```

---

## API reference and examples

### SQLiteTool

Constructor: `new SQLiteTool(dbPath: string, options?: SQLiteToolConfig)`

Primary responsibilities:

- Manage the connection life-cycle (`connect`, `close`).
- Provide CRUD (`insert`, `find`, `findOne`, `update`, `delete`, `count`).
- Schema helpers (`createTable`, `dropTable`, `tableExists`).
- Transaction helper `transaction(callback)`.
- Utility getters (`getDatabase`, `getDatabasePath`).

Important methods (short examples):

- connect / close

```ts
const db = new SQLiteTool('data/app.sqlite');
await db.connect();
// ... use db ...
await db.close();
```

- insert

```ts
const r = await db.insert('users', { name: 'Carmen', email: 'carmen@example.com' });
console.log('new id', r.lastID);
```

- find / findOne

```ts
const rows = await db.find('users', { age: 30 }, { columns: ['id','name'] });
const user = await db.findOne('users', { email: 'carmen@example.com' });
```

- update / delete

```ts
await db.update('users', { age: 31 }, { id: 5 });
await db.delete('users', { id: 6 });
```

- count

```ts
const total = await db.count('users', { age: { operator: '>=', value: 18 } });
```

- transactions

```ts
await db.transaction(async () => {
  await db.insert('users', { name: 'TxUser' });
  // If an error is thrown here, the transaction will rollback
});
```

- raw access

```ts
const raw = db.getDatabase();
```

### TableBuilder

`createTable(tableName, builder)` gives you a fluent `TableBuilder` instance.

Common column methods:

- `id()` — primary key integer autoincrement
- `string(name)`, `text(name)`, `integer(name)`, `real(name)`, `boolean(name)`, `blob(name)`, `date(name)`
- Modifiers: `primaryKey()`, `autoIncrement()`, `notNull()`, `unique()`, `default(value)`, `check(expr)`
- Foreign keys: `foreignKey('col').references('other.table').onDelete('CASCADE')`

Example: create posts table with a foreign key

```ts
await db.createTable('posts', t => {
  t.id();
  t.string('title').notNull();
  t.integer('author_id');
  t.foreignKey('author_id').references('users.id').onDelete('CASCADE');
});
```

### QueryBuilder + WhereBuilder

`QueryBuilder` is used internally by `SQLiteTool` but is useful standalone when you need complex queries.

Common chainable methods:

- `select(columns)`, `distinct()`
- `where(column, operator, value)`, `whereIn`, `whereBetween`, `whereNull`, `whereNotNull`, `whereLike`
- `join(table, first, operator, second, type)`, `leftJoin`, `rightJoin`
- `orderBy(column, dir)`, `groupBy`, `having`
- `limit(n)`, `offset(n)`, `paginate(page, perPage)`
- `toSQL()` returns `{ sql, values }`
- `toCountSQL()` for count queries

Example: join + pagination

```ts
const qb = new QueryBuilder('users')
  .select(['users.id','users.name','p.title'])
  .join('posts p', 'p.author_id', '=', 'users.id', 'LEFT')
  .where('users.age', '>=', 18)
  .orderBy('users.name', 'ASC')
  .paginate(1, 20);

const { sql, values } = qb.toSQL();
const stmt = await db.getDatabase()!.prepare(sql);
const rows = await stmt.all(...values);
await stmt.finalize();
```

### SQLiteAdmin (administration)

`SQLiteAdmin` is implemented as a subclass of `SQLiteTool` in `src/SQLiteAdmin.ts` (recommended). It exposes higher-level operations:

- `runMigrations(migrations: Migration[])` Runs an ordered list of migrations inside a transaction and records applied versions.
- `rollbackMigrations(count = 1)` Rolls back the latest `count` migrations.
- `backup(options: BackupOptions)` Produces a file copy backup (implementation included).
- `getTables()`, `getColumns(tableName)`, `getIndexes(tableName)` — schema introspection.
- `getDatabaseStats()` / `getTableStats(tableName)` — basic statistics (row counts, sizes).
- `optimize()` — runs `VACUUM` and `ANALYZE`.
- `checkIntegrity()` — runs `PRAGMA integrity_check`.
- `getConfig()` — returns PRAGMA-derived config values.

Migrations example:

```ts
const migrations = [
  {
    version: 1,
    name: 'create_users',
    up: async db => {
      await db.createTable('users', t => {
        t.id();
        t.string('name').notNull();
      });
    },
    down: async db => {
      await db.dropTable('users');
    }
  }
];

const admin = new SQLiteAdmin(db);
await admin.connect();
const results = await admin.runMigrations(migrations);
console.log(results);
```

Backup example (file copy):

```ts
await admin.backup({ destination: 'backups/example-backup.sqlite' });
```
