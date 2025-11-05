// app/api/scrape/trigger/route.ts
// Manual scrape trigger endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/pool';
import { scrapeAndScoreProject } from '@/lib/scraping/scrape-and-score';

export async function POST(request: NextRequest) {
  const pool = getPool();

  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json(
        { success: false, error: 'project_id is required' },
        { status: 400 }
      );
    }

    console.log(`\n🎯 Manual scrape triggered for project ${project_id}`);

    const result = await scrapeAndScoreProject(project_id, pool);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error: any) {
    console.error('Error triggering scrape:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
