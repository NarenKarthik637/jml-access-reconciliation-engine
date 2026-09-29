import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const RESULTS_DIR = path.join(process.cwd(), 'results');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary'; // 'baseline', 'prototype', 'summary'
    const format = searchParams.get('format') || 'json'; // 'json', 'csv'

    let filename = '';
    if (type === 'baseline') {
      filename = format === 'csv' ? 'baseline_results.csv' : 'baseline_results.json';
    } else if (type === 'prototype') {
      filename = format === 'csv' ? 'prototype_results.csv' : 'prototype_results.json';
    } else {
      filename = format === 'csv' ? 'experiment_summary.csv' : 'experiment_summary.json';
    }

    const filePath = path.join(RESULTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `File ${filename} not found. Please run the experiment suite first.` }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const contentType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
