import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const RESULTS_DIR = path.join(process.cwd(), 'results');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetHoursParam = searchParams.get('targetHours');
    const targetHours = targetHoursParam ? parseFloat(targetHoursParam) : 24.0;

    const summaryPath = path.join(RESULTS_DIR, 'experiment_summary.json');
    const baselinePath = path.join(RESULTS_DIR, 'baseline_results.json');
    const prototypePath = path.join(RESULTS_DIR, 'prototype_results.json');

    if (!fs.existsSync(summaryPath) || !fs.existsSync(baselinePath) || !fs.existsSync(prototypePath)) {
      return NextResponse.json(
        { error: 'Experiment results have not been generated yet. Please run the experiment suite.' },
        { status: 404 }
      );
    }

    const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const prototypeData = JSON.parse(fs.readFileSync(prototypePath, 'utf-8'));
    const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    // Dynamic SLA recalculation if targetHours != 24.0
    const bItems = baselineData.items || [];
    const pItems = prototypeData.items || [];

    const evaluateSla = (items: any[], hours: number) => {
      const total = items.length;
      const within = items.filter(
        (it: any) => it.time_to_remediate_hours !== null && it.time_to_remediate_hours !== undefined && it.time_to_remediate_hours <= hours
      ).length;
      const rate = total > 0 ? Math.round((within / total) * 1000) / 10 : 0;
      return { total, within, rate };
    };

    const bSla = evaluateSla(bItems, targetHours);
    const pSla = evaluateSla(pItems, targetHours);
    const absDiff = Math.round((pSla.rate - bSla.rate) * 10) / 10;
    const relDiff = bSla.rate > 0 ? Math.round(((pSla.rate - bSla.rate) / bSla.rate) * 1000) / 10 : 0;

    return NextResponse.json({
      success: true,
      targetHours,
      summary: {
        ...summaryData,
        primary_metric: {
          ...summaryData.primary_metric,
          name: `Removal-within-target rate (${targetHours} hours)`,
          baseline_rate_pct: bSla.rate,
          prototype_rate_pct: pSla.rate,
          absolute_improvement_pts: absDiff,
          relative_improvement_pct: relDiff,
          hypothesis_confirmed: pSla.rate > bSla.rate
        }
      },
      baseline_summary: {
        ...baselineData.summary,
        items_removed_within_target: bSla.within,
        removal_within_target_rate_pct: bSla.rate
      },
      prototype_summary: {
        ...prototypeData.summary,
        items_removed_within_target: pSla.within,
        removal_within_target_rate_pct: pSla.rate
      },
      sample_discrepancies: {
        baseline: bItems.slice(0, 8),
        prototype: pItems.slice(0, 8)
      },
      comparison_matrix: summaryData.comparison_matrix || [],
      sla_sensitivity_curve: summaryData.sla_sensitivity_curve || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
