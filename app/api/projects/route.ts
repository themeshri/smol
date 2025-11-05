// app/api/projects/route.ts
// API endpoints for projects CRUD

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pool';

// GET /api/projects - List all projects
export async function GET() {
  const pool = getPool();

  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COUNT(DISTINCT ups.user_id) as participant_count,
        COUNT(DISTINCT t.id) as tweet_count
      FROM projects p
      LEFT JOIN user_project_scores ups ON p.id = ups.project_id
      LEFT JOIN tweets t ON p.id = t.project_id AND t.is_active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      projects: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  const pool = getPool();

  try {
    const body = await request.json();
    const { name, keywords, cooldown_hours } = body;

    // Validation
    if (!name || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name and keywords are required' },
        { status: 400 }
      );
    }

    if (![1, 6, 12, 24].includes(cooldown_hours)) {
      return NextResponse.json(
        { success: false, error: 'Cooldown must be 1, 6, 12, or 24 hours' },
        { status: 400 }
      );
    }

    // Create project
    const result = await pool.query(`
      INSERT INTO projects (name, keywords, cooldown_hours, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING *
    `, [name, keywords, cooldown_hours]);

    return NextResponse.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
