import path from 'pathe';
import * as fs from 'fs/promises';
import { compressSuccess } from './log';
import { optimize } from 'svgo';
import { performance } from 'perf_hooks';
import { extname } from 'path';

export default async function initSvgo(config, filePath) {
  const { outputPath, cache, chunks, options, publicDir } = config;
  const fileRootPath = path.resolve(outputPath, filePath);

  if (extname(filePath) !== '.svg') return;

  try {
    await fs.access(fileRootPath, fs.constants.F_OK);
  } catch (error) {
    return;
  }

  const relativePathRace = path.relative(publicDir, fileRootPath);
  const finalPath = path.join(outputPath, relativePathRace);

  if (options.cache && chunks[filePath] && cache.get(chunks[filePath])) {
    await fs.writeFile(finalPath, cache.get(chunks[filePath]));

    compressSuccess(finalPath.replace(process.cwd(), ''), 0, 0, 0, true);
    return;
  }

  if (
    options.cache &&
    filePath.startsWith(publicDir) &&
    cache.getPublish(finalPath, filePath)
  ) {
    await fs.writeFile(finalPath, cache.getPublish(finalPath, filePath));

    compressSuccess(finalPath.replace(process.cwd(), ''), 0, 0, 0, true);
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

  const svgBinaryData = Buffer.from(result.data, 'utf-8');

  if (filePath.startsWith(publicDir)) {
    cache.setPublish(finalPath, finalPath, svgBinaryData);

    await fs.writeFile(finalPath, svgBinaryData);
  } else {
    if (options.cache && chunks[filePath] && !cache.get(chunks[filePath])) {
      try {
        cache.set(chunks[filePath], svgBinaryData);
      } catch (error) {
        console.log('ERROR Read file cache', error);
      }
    }

    await fs.writeFile(fileRootPath, svgBinaryData);
  }

  compressSuccess(relativePath, newSize, oldSize, start);
}
