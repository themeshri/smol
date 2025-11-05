// app/api/users/[id]/route.ts
// User details and score history API

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
  const { id: userId } = await params;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: 'project_id is required' },
      { status: 400 }
    );
  }

  try {
    // Get user info
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Get user's score for this project
    const scoreResult = await pool.query(`
      SELECT * FROM user_project_scores
      WHERE user_id = $1 AND project_id = $2
    `, [userId, projectId]);

    const userScore = scoreResult.rows[0] || {
      total_score: 0,
      tweet_count: 0,
      last_points_earned: 0,
      last_earned_at: null,
    };

    // Get score history with tweet details
    const historyResult = await pool.query(`
      SELECT
        sh.*,
        t.text as tweet_text,
        t.url as tweet_url,
        t.posted_at
      FROM score_history sh
      JOIN tweets t ON sh.tweet_id = t.id
      WHERE sh.user_id = $1 AND sh.project_id = $2
      ORDER BY sh.earned_at DESC
      LIMIT 50
    `, [userId, projectId]);

    // Get user's active tweets for this project
    const tweetsResult = await pool.query(`
      SELECT
        t.*,
        (t.current_likes - t.previous_likes) as likes_growth,
        (t.current_retweets - t.previous_retweets) as retweets_growth,
        (t.current_replies - t.previous_replies) as replies_growth
      FROM tweets t
      WHERE t.user_id = $1 AND t.project_id = $2 AND t.is_active = true
      ORDER BY t.posted_at DESC
      LIMIT 20
    `, [userId, projectId]);

    // Get project info
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    return NextResponse.json({
      success: true,
      user,
      project: projectResult.rows[0],
      score: userScore,
      history: historyResult.rows,
      tweets: tweetsResult.rows,
    });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
