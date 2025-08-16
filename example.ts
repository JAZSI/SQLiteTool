import { SQLiteTool, TableBuilder, QueryBuilder, SQLiteAdmin } from './index';

/**
 * Comprehensive example demonstrating the advanced TypeScript SQLiteTool
 */
async function example() {
  // Initialize the database
  const db = new SQLiteTool('./example.sqlite', {
    logging: true,
    verbose: true
  });

  try {
    // Connect to the database
    await db.connect();
    console.log('Connected to database');

    // ==================== TABLE CREATION EXAMPLES ====================

    // Example 1: Create table using TableBuilder
    await db.createTable('users', builder => {
      builder
        .id()
        .string('username', 50).notNull().unique()
        .string('email', 100).notNull().unique()
        .string('password_hash', 255).notNull()
        .integer('age')
        .boolean('is_active').default(true)
        .date('created_at')
        .date('updated_at');
    });

    // Example 2: Create table with foreign key
    await db.createTable('posts', builder => {
      builder
        .id()
        .string('title', 200).notNull()
        .text('content')
        .integer('user_id').notNull()
        .boolean('is_published').default(false)
        .date('created_at')
        .foreignKey('user_id')
        .references('users.id')
        .onDelete('CASCADE');
    });

    // ==================== DATA INSERTION EXAMPLES ====================

    // Insert single record
    const userResult = await db.insert('users', {
      username: 'john_doe',
      email: 'john@example.com',
      password_hash: 'hashed_password_here',
      age: 30,
      is_active: true
    });
    console.log('Inserted user with ID:', userResult.lastID);

    // Insert multiple records
    const users = [
      { username: 'jane_smith', email: 'jane@example.com', password_hash: 'hash1', age: 25 },
      { username: 'bob_wilson', email: 'bob@example.com', password_hash: 'hash2', age: 35 },
      { username: 'alice_brown', email: 'alice@example.com', password_hash: 'hash3', age: 28 }
    ];

    for (const user of users) {
      await db.insert('users', user);
    }

    // Insert posts
    await db.insert('posts', {
      title: 'My First Post',
      content: 'This is the content of my first post.',
      user_id: userResult.lastID,
      is_published: true
    });

    // ==================== QUERY EXAMPLES ====================

    // Find all users
    const allUsers = await db.find('users', {});
    console.log('All users:', allUsers);

    // Find users with conditions
    const activeUsers = await db.find('users', { is_active: true });
    console.log('Active users:', activeUsers);

    // Find users with complex conditions
    const adultUsers = await db.find('users', {
      age: { operator: '>=', value: 18 },
      is_active: true
    });
    console.log('Adult active users:', adultUsers);

    // Find with pagination
    const paginatedUsers = await db.findPaginated('users', {}, {
      page: 1,
      limit: 10
    });
    console.log('Paginated users:', paginatedUsers);

    // Find with options
    const recentUsers = await db.find('users', {}, {
      columns: ['id', 'username', 'email'],
      orderBy: 'created_at',
      direction: 'DESC',
      limit: 5
    });
    console.log('Recent users:', recentUsers);

    // Find one record
    const user = await db.findOne('users', { username: 'john_doe' });
    console.log('Found user:', user);

    // Count records
    const userCount = await db.count('users', { is_active: true });
    console.log('Active user count:', userCount);

    // ==================== UPDATE EXAMPLES ====================

    // Update single record
    await db.update('users', 
      { age: 31, updated_at: new Date().toISOString() },
      { username: 'john_doe' }
    );

    // Update multiple records
    await db.update('users', 
      { is_active: false },
      { age: { operator: '<', value: 18 } }
    );

    // ==================== DELETE EXAMPLES ====================

    // Delete single record
    await db.delete('users', { username: 'inactive_user' });

    // Delete multiple records
    await db.delete('users', { is_active: false });

    // ==================== TRANSACTION EXAMPLES ====================

    await db.transaction(async () => {
      // Create a new user
      const newUser = await db.insert('users', {
        username: 'transaction_user',
        email: 'transaction@example.com',
        password_hash: 'hash',
        age: 25
      });

      // Create a post for this user
      await db.insert('posts', {
        title: 'Transaction Post',
        content: 'This post was created in a transaction.',
        user_id: newUser.lastID,
        is_published: true
      });

      console.log('Transaction completed successfully');
    });

    // ==================== ADVANCED FEATURES EXAMPLES ====================

    const admin = new SQLiteAdmin(db);

    // Get database statistics
    const stats = await admin.getDatabaseStats();
    console.log('Database stats:', stats);

    // Get table information
    const tables = await admin.getTables();
    console.log('Tables:', tables);

    // Get column information
    const columns = await admin.getColumns('users');
    console.log('User table columns:', columns);

    // Check database integrity
    const isIntegrityOk = await admin.checkIntegrity();
    console.log('Database integrity:', isIntegrityOk);

    // Get database configuration
    const config = await admin.getConfig();
    console.log('Database config:', config);

    // Optimize database
    await admin.optimize();
    console.log('Database optimized');

    // ==================== QUERY BUILDER EXAMPLES ====================

    // Using QueryBuilder directly
    const query = new QueryBuilder('users')
      .select(['id', 'username', 'email'])
      .where('age', '>=', 18)
      .whereIn('is_active', [true])
      .orderBy('username', 'ASC')
      .limit(10);

    const { sql, values } = query.toSQL();
    console.log('Generated SQL:', sql);
    console.log('SQL values:', values);

    // ==================== COMPLEX QUERIES ====================

    const postsWithUsers = await db.find('posts', {});
    console.log('Posts:', postsWithUsers);

    // Group by example
    const ageGroups = await db.find('users', {}, {
      columns: ['age', 'COUNT(*) as count'],
      groupBy: 'age',
      having: 'COUNT(*) > 1'
    });
    console.log('Age groups:', ageGroups);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await db.close();
    console.log('Database connection closed');
  }
}

// Run the example
if (require.main === module) {
  example().catch(console.error);
}

export { example }; 