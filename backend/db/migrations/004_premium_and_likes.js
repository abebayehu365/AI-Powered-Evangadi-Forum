import 'dotenv/config';
import mysql from 'mysql2/promise';

async function migrate() {
  const { DB_HOST: host, DB_USER: user, DB_NAME: database } = process.env;
  const password = process.env.DB_PASS || process.env.DB_PASSWORD;
  if (!host || !user || !password || !database) {
    throw new Error('DB_HOST, DB_USER, DB_PASS, and DB_NAME are required');
  }

  const conn = await mysql.createConnection({ host, user, password, database });

  try {
    const addColumnIfNotExists = async (table, columnDef) => {
      try {
        await conn.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
      } catch (err) {
        if (err.errno !== 1060 && err.code !== 'ER_DUP_FIELDNAME') {
          throw err;
        }
      }
    };

    await addColumnIfNotExists('users', 'username VARCHAR(50) NULL UNIQUE');
    await addColumnIfNotExists('users', 'is_premium TINYINT NOT NULL DEFAULT 0');
    await addColumnIfNotExists('users', 'premium_since TIMESTAMP NULL');
    await addColumnIfNotExists('users', 'security_pin VARCHAR(255) NULL');
    await addColumnIfNotExists('users', 'security_pin_enabled TINYINT NOT NULL DEFAULT 0');
    await addColumnIfNotExists('users', "role VARCHAR(20) NOT NULL DEFAULT 'user'");
    await addColumnIfNotExists('users', 'avatar_url VARCHAR(512) NULL');
    await addColumnIfNotExists('users', 'bio TEXT NULL');

    // Payments table for Telebirr
    await conn.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
        currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
        provider VARCHAR(30) NOT NULL DEFAULT 'telebirr',
        phone_number VARCHAR(30) NOT NULL,
        transaction_id VARCHAR(64) NOT NULL UNIQUE,
        status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Likes table for question/answer like & unlike (upvote / downvote)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS likes (
        like_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_type ENUM('question', 'answer') NOT NULL,
        item_id INT NOT NULL,
        vote TINYINT NOT NULL COMMENT '1 = like, -1 = unlike',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_item_like (user_id, item_type, item_id),
        INDEX idx_item_likes (item_type, item_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Migration 004 completed successfully.');
  } finally {
    await conn.end();
  }
}

migrate().catch(error => {
  console.error('Migration 004 failed:', error.message);
  process.exitCode = 1;
});
