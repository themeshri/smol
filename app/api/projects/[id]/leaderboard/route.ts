// app/api/projects/[id]/leaderboard/route.ts
// Leaderboard API for a specific project

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pool';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const pool = getPool();
  const { id: projectId } = await params;

  try {
    // Get leaderboard with user details
    const result = await pool.query(`
      SELECT
        ups.user_id,
        ups.total_score,
        ups.tweet_count,
        ups.last_points_earned,
        ups.last_earned_at,
        u.twitter_id,
        u.username,
        u.name,
        u.profile_picture,
        u.followers,
        u.is_verified,
        u.is_blue_verified,
        ROW_NUMBER() OVER (ORDER BY ups.total_score DESC) as rank
      FROM user_project_scores ups
      JOIN users u ON ups.user_id = u.id
      WHERE ups.project_id = $1
      ORDER BY ups.total_score DESC
      LIMIT 100
    `, [projectId]);

    // Get project info
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: projectResult.rows[0],
      leaderboard: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
