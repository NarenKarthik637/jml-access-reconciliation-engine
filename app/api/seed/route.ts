import { NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync('python3 python_engine/cli.py seed && python3 python_engine/cli.py reconcile');
    return NextResponse.json({
      success: true,
      message: 'Synthetic database successfully reset and seeded via Python CLI.',
      stdout: stdout.trim(),
      stderr: stderr ? stderr.trim() : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
