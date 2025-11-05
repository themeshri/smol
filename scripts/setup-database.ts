// scripts/setup-database.ts
// Sets up the smol database and runs schema

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Setting up SMOL database...\n');

  // Connect to postgres database to create smol database
  const adminPool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: 'postgres',  // Connect to default postgres database
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    // Check if smol database exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'smol'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating smol database...');
      await adminPool.query('CREATE DATABASE smol');
      console.log('✅ Database created\n');
    } else {
      console.log('✅ Database already exists\n');
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    throw error;
  } finally {
    await adminPool.end();
  }

  // Connect to smol database to run schema
  const smolPool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: 'smol',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    console.log('📋 Running schema...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await smolPool.query(schema);
    console.log('✅ Schema applied successfully\n');

    // Verify tables created
    const tablesResult = await smolPool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Tables created:');
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✨ Database setup complete!\n');
  } catch (error) {
    console.error('❌ Error running schema:', error);
    throw error;
  } finally {
    await smolPool.end();
  }
}

// Run setup
setupDatabase()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
