import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNormalizedMetrics, type NormalizedMetrics } from './contract';

export interface MetricsPaths {
  generatedPath: string;
}

const defaultPaths = (): MetricsPaths => ({
  generatedPath: resolve('src/data/generated/citations.json')
});

const readMetrics = (path: string): unknown =>
  JSON.parse(readFileSync(path, 'utf8'));

export const loadBuildMetrics = (paths = defaultPaths()): NormalizedMetrics => {
  try {
    return parseNormalizedMetrics(readMetrics(paths.generatedPath));
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    throw new Error(
      `Generated metrics artifact is unavailable or invalid: ${detail}`
    );
  }
};
