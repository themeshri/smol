// Script to seed the database with test data for development
import { Pool } from 'pg';
import { getPool } from '../lib/pool';

async function seedTestData() {
  const pool = getPool();

  try {
    console.log('🌱 Seeding test data...\n');

    // Create test projects
    const projects = [
      {
        name: 'Crypto Whales Tracker',
        keywords: ['$BTC', '$ETH', 'crypto', 'blockchain'],
        cooldown_hours: 6,
      },
      {
        name: 'DeFi Projects Monitor',
        keywords: ['DeFi', 'yield farming', 'liquidity pool'],
        cooldown_hours: 12,
      },
      {
        name: 'NFT Collections Watch',
        keywords: ['NFT', 'BAYC', 'opensea', 'pfp'],
        cooldown_hours: 24,
      },
    ];

    console.log('📋 Creating test projects...');
    for (const project of projects) {
      const result = await pool.query(`
        INSERT INTO projects (name, keywords, cooldown_hours, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT DO NOTHING
        RETURNING id, name
      `, [project.name, project.keywords, project.cooldown_hours]);

      if (result.rows.length > 0) {
        console.log(`  ✅ Created: ${result.rows[0].name} (${result.rows[0].id})`);
      }
    }

    console.log('\n✨ Test data seeded successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Visit http://localhost:3002/projects');
    console.log('  2. Click "Scrape Now" on any project');
    console.log('  3. Mock tweets will be generated automatically!');
    console.log('\n💡 Tip: Set USE_MOCK_DATA=false in .env.local to use real Apify\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seedTestData();
