/**
 * Headless autoplay with greedy or random policies; writes JSON logs + batch summary.
 *
 * Usage:
 *   npm run autoplay
 *   npm run autoplay -- --runs 50 --policy greedy --out logs/autoplay
 *   npm run autoplay -- --runs 20 --policy random --seed 12345
 *
 * Each batch is written to <out>/<batchId>/ (run JSON files + summary.json).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AutoplayPolicyName } from '../src/game/autoplay/policy.ts';
import {
  configureHeadlessProfileStore,
  runAutoplayBatch,
} from '../src/game/autoplay/AutoplayRunner.ts';
import { metricsFromRecord } from '../src/game/autoplay/runMetrics.ts';

interface CliOptions {
  runs: number;
  outDir: string;
  policy: AutoplayPolicyName;
  baseSeed?: number;
  verifyReplay: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  let runs = 10;
  let outDir = 'logs/autoplay';
  let policy: AutoplayPolicyName = 'greedy';
  let baseSeed: number | undefined;
  let verifyReplay = true;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--runs' && argv[i + 1]) {
      runs = Math.max(1, parseInt(argv[++i], 10) || 10);
    } else if ((arg === '--out' || arg === '-o') && argv[i + 1]) {
      outDir = argv[++i];
    } else if (arg === '--seed' && argv[i + 1]) {
      baseSeed = parseInt(argv[++i], 10);
    } else if (arg === '--policy' && argv[i + 1]) {
      const p = argv[++i];
      if (p === 'greedy' || p === 'random') policy = p;
    } else if (arg === '--no-replay-verify') {
      verifyReplay = false;
    }
  }

  return { runs, outDir, policy, baseSeed, verifyReplay };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  configureHeadlessProfileStore();

  const batchId = new Date().toISOString().replace(/[:.]/g, '-');
  const batchDir = join(opts.outDir, batchId);
  await mkdir(batchDir, { recursive: true });

  console.log(`Autoplay (${opts.policy}): ${opts.runs} run(s) → ${batchDir}`);

  const { records, results, stuckRuns, replayFailures } = runAutoplayBatch({
    runs: opts.runs,
    policy: opts.policy,
    baseSeed: opts.baseSeed,
    verifyReplay: opts.verifyReplay,
  });

  const summaries: Record<string, unknown>[] = [];
  let wins = 0;
  const floorHist: Record<number, number> = {};

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const result = results[i];
    const fileName = `run-${record.id.slice(0, 8)}.json`;
    const filePath = join(batchDir, fileName);
    await writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');

    const summary = metricsFromRecord(record, result.metrics);
    summaries.push({ file: fileName, ...summary });

    if (record.victory) wins++;
    floorHist[record.floorReached] = (floorHist[record.floorReached] ?? 0) + 1;

    const replayTag =
      result.metrics.replayOk === false ? ' REPLAY_MISMATCH' : '';
    const stuckTag = result.stuck ? ` stuck:${result.stuckReason}` : '';
    console.log(
      `  ${fileName}  floor ${record.floorReached}  ${record.victory ? 'WIN' : 'LOSS'}  skills ${result.metrics.skillCount}  basic ${(result.metrics.basicSpamRatio * 100).toFixed(0)}%${stuckTag}${replayTag}`,
    );
  }

  const summaryPath = join(batchDir, 'summary.json');
  await writeFile(
    summaryPath,
    JSON.stringify(
      {
        batchId,
        createdAt: new Date().toISOString(),
        policy: opts.policy,
        runsRequested: opts.runs,
        runsSaved: records.length,
        wins,
        winRate: records.length ? wins / records.length : 0,
        stuckRuns,
        replayFailures,
        floorHistogram: floorHist,
        baseSeed: opts.baseSeed ?? 'auto',
        runs: summaries,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Summary: ${summaryPath}`);
  if (records.length === 0) {
    console.error('No runs completed.');
    process.exitCode = 1;
  } else {
    if (stuckRuns > 0) {
      console.warn(`Warning: ${stuckRuns} run(s) stopped early (partial logs saved).`);
    }
    if (replayFailures > 0) {
      console.warn(`Warning: ${replayFailures} run(s) failed replay verification.`);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
