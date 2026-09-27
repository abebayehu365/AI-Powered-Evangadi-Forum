import 'dotenv/config';
import mysql from 'mysql2/promise';

async function migrate() {
  const host = process.env.DB_HOST || '91.204.209.58';
  const user = process.env.DB_USER || 'hiwotaxj_evangadiForum2026';
  const password = process.env.DB_PASS || 'KWZs]qWy00S!@vVB';
  const database = process.env.DB_NAME || 'hiwotaxj_Group1Evangadi';

  console.log(`Connecting to ${host}/${database} as ${user}...`);
  const conn = await mysql.createConnection({ host, user, password, database });

  const addColumnIfNotExists = async (table, columnDef) => {
    try {
      await conn.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
      console.log(`Added column to ${table}: ${columnDef.split(' ')[0]}`);
    } catch (err) {
      if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
        console.log(`Column already exists: ${columnDef.split(' ')[0]}`);
      } else {
        console.error(`Error adding column ${columnDef.split(' ')[0]}:`, err.message);
      }
    }
  };

  await addColumnIfNotExists('users', 'is_premium TINYINT NOT NULL DEFAULT 0');
  await addColumnIfNotExists('users', 'premium_since TIMESTAMP NULL');
  await addColumnIfNotExists('users', 'security_pin VARCHAR(255) NULL');
  await addColumnIfNotExists('users', 'security_pin_enabled TINYINT NOT NULL DEFAULT 0');
  await addColumnIfNotExists('users', "role VARCHAR(20) NOT NULL DEFAULT 'user'");

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
  console.log('payments table verified/created');

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
  console.log('likes table verified/created');

  // Make sure at least one user is admin for testing/management (or make user with email live@gmail.com or hiwotfikru@gmail.com admin)
  await conn.query(`UPDATE users SET role = 'admin' WHERE user_id = 1 OR email LIKE '%admin%' OR email = 'hiwotfikru@gmail.com' LIMIT 2`);
  console.log('Admin user assigned');

  await conn.end();
  console.log('Migration completed successfully!');
}

migrate().catch(console.error);
