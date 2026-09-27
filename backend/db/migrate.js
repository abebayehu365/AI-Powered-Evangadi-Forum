import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = ['001_ratings.sql', '002_reports.sql', '003_follows.sql'];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Running migration: ${file}...`);
    let sql = fs.readFileSync(filePath, 'utf-8');

    // Remove multi-line comments and single line comments
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
    sql = sql.replace(/--.*$/gm, '');

    // Split statements by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        console.log(`Executing:\n${stmt.substring(0, 60)}...`);
        await db.query(stmt);
      } catch (err) {
        if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
          console.log(`Note: column already exists, skipped.`);
        } else {
          console.error(`Error running statement in ${file}:`, err.message);
          throw err;
        }
      }
    }
    console.log(`Completed: ${file}`);
  }

  console.log('All migrations executed successfully!');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
