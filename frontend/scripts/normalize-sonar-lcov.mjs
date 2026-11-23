import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const inputPath = resolve('coverage/portfolio-frontend/lcov.info');
const outputPath = resolve('coverage/portfolio-frontend/lcov-sonar.info');
const report = await readFile(inputPath, 'utf8');
let sourceCount = 0;
let normalizedCount = 0;

const normalized = report.replace(/^SF:(.+)$/gm, (_, sourcePath) => {
  sourceCount += 1;
  const repositoryPath = sourcePath.startsWith('src/') ? `frontend/${sourcePath}` : sourcePath;
  if (!resolve('..', repositoryPath).startsWith(resolve('..', 'frontend/src'))) {
    throw new Error(`Unexpected LCOV source path: ${sourcePath}`);
  }
  normalizedCount += 1;
  return `SF:${repositoryPath}`;
});

if (sourceCount === 0 || normalizedCount !== sourceCount) {
  throw new Error(`Expected frontend source entries in ${inputPath}; found ${sourceCount}.`);
}

await writeFile(outputPath, normalized);
console.log(`Prepared ${normalizedCount} Sonar LCOV source paths at ${outputPath}`);
