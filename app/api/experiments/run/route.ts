import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

const execAsync = promisify(exec);
const RESULTS_DIR = path.join(process.cwd(), 'results');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetHours = typeof body.targetHours === 'number' ? body.targetHours : 24.0;
    const seed = typeof body.seed === 'number' ? body.seed : 42;

    const command = `python3 python_engine/run_experiments.py --target-hours ${targetHours} --seed ${seed}`;
    const { stdout, stderr } = await execAsync(command);

    const summaryPath = path.join(RESULTS_DIR, 'experiment_summary.json');
    let summaryData = null;
    if (fs.existsSync(summaryPath)) {
      summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    }

    return NextResponse.json({
      success: true,
      targetHours,
      message: 'Evaluation experiment suite successfully executed.',
      summary: summaryData,
      stdout: stdout.trim(),
      stderr: stderr ? stderr.trim() : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
