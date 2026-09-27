import 'dotenv/config';
import mysql from 'mysql2/promise';

async function migrate() {
  const host = process.env.DB_HOST || '91.204.209.58';
  const user = process.env.DB_USER || 'hiwotaxj_evangadiForum2026';
  const password = process.env.DB_PASS || 'KWZs]qWy00S!@vVB';
  const database = process.env.DB_NAME || 'hiwotaxj_Group1Evangadi';

  console.log(`Connecting to ${host}/${database} as ${user}...`);
  const conn = await mysql.createConnection({ host, user, password, database });

  // Create universal star ratings table (1-5 stars for questions AND answers)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      rating_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      item_type ENUM('question', 'answer') NOT NULL,
      item_id INT NOT NULL,
      score TINYINT NOT NULL COMMENT '1-5 star rating',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT chk_star_score CHECK (score BETWEEN 1 AND 5),
      UNIQUE KEY uniq_user_item_rating (user_id, item_type, item_id),
      INDEX idx_item_ratings (item_type, item_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('ratings table (star ratings) created/verified');

  await conn.end();
  console.log('Migration 005 completed successfully!');
}

migrate().catch(console.error);
