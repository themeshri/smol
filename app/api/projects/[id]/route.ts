// app/api/projects/[id]/route.ts
// API endpoints for individual project operations

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pool';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const pool = getPool();
  const { id } = await params;

  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COUNT(DISTINCT ups.user_id) as participant_count,
        COUNT(DISTINCT t.id) as active_tweet_count,
        SUM(ups.total_score) as total_points_distributed
      FROM projects p
      LEFT JOIN user_project_scores ups ON p.id = ups.project_id
      LEFT JOIN tweets t ON p.id = t.project_id AND t.is_active = true
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project (pause/resume, change cooldown)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const pool = getPool();
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, cooldown_hours, keywords, name } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (keywords !== undefined) {
      if (!Array.isArray(keywords) || keywords.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Keywords must be a non-empty array' },
          { status: 400 }
        );
      }
      updates.push(`keywords = $${paramCount++}`);
      values.push(keywords);
    }

    if (cooldown_hours !== undefined) {
      if (![1, 6, 12, 24].includes(cooldown_hours)) {
        return NextResponse.json(
          { success: false, error: 'Cooldown must be 1, 6, 12, or 24 hours' },
          { status: 400 }
        );
      }
      updates.push(`cooldown_hours = $${paramCount++}`);
      values.push(cooldown_hours);
    }

    if (status !== undefined) {
      if (!['active', 'paused'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Status must be active or paused' },
          { status: 400 }
        );
      }
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    values.push(id);
    const result = await pool.query(`
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
