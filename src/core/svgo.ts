import chalk from 'chalk';
import path from 'pathe';
import * as fs from 'fs/promises';
import { compressSuccess, logger } from './log';
import { optimize } from 'svgo';
import { performance } from 'perf_hooks';

export default async function initSvgo(config, filePath) {
  const { outputPath, cache, chunks, options, publicDir } = config;
  const fileRootPath = path.resolve(outputPath, filePath);

  try {
    await fs.access(fileRootPath, fs.constants.F_OK);
  } catch (error) {
    return;
  }

  if (options.cache && cache.get(chunks[filePath])) {
    await fs.writeFile(fileRootPath, cache.get(chunks[filePath]));
    logger(chalk.blue(filePath), chalk.green('✨ The file has been cached'));
    return;
  }

  const start = performance.now();
  const oldSize = (await fs.stat(fileRootPath)).size;

  const svgCode = await fs.readFile(fileRootPath, 'utf8');

  const result = optimize(svgCode, {
    multipass: true,
  });

  let newSize = Buffer.byteLength(result.data);
  const unixPath = path.normalize(fileRootPath);
  const relativePath = path.relative(process.cwd(), unixPath);
  compressSuccess(relativePath, newSize, oldSize, start);

  const svgBinaryData = Buffer.from(result.data, 'utf-8');

  if (filePath.startsWith(publicDir)) {
    const relativePathRace = path.relative(publicDir, fileRootPath);
    const finalPath = path.join(outputPath, relativePathRace);
    await fs.writeFile(finalPath, svgBinaryData);
  } else {
    await fs.writeFile(fileRootPath, svgBinaryData);
  }
}
