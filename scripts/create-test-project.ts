// scripts/create-test-project.ts
// Creates a test project with $uranus keyword for testing

import { getPool } from '../lib/pool';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createTestProject() {
  const pool = getPool();

  try {
    console.log('🚀 Creating test project...\n');

    // Create test project with $uranus keyword
    const result = await pool.query(`
      INSERT INTO projects (
        name,
        keywords,
        cooldown_hours,
        status
      ) VALUES (
        'Uranus Token Tracker',
        ARRAY['$uranus', 'uranus', '#uranus'],
        1,
        'active'
      )
      RETURNING *
    `);

    const project = result.rows[0];

    console.log('✅ Test project created:');
    console.log(`   ID: ${project.id}`);
    console.log(`   Name: ${project.name}`);
    console.log(`   Keywords: ${project.keywords.join(', ')}`);
    console.log(`   Cooldown: ${project.cooldown_hours} hour(s)`);
    console.log(`   Status: ${project.status}`);
    console.log(`   Created: ${project.created_at}\n`);

    console.log('🎉 Done! You can now test scraping with this project.\n');
  } catch (error) {
    console.error('❌ Error creating test project:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTestProject()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
