import { promises as proFs } from 'fs';
import * as fs from 'node:fs';
import path from 'node:path';
import { extname } from 'pathe';
import sharp from 'sharp';
import { sharpOptions } from './compressOptions';
import { encodeMap, sharpEncodeMap } from './encodeMap';
import { compressSuccess } from './log';
import { filterDirPath, filterImageModule } from './utils';

async function processImageFile(filePath: string, config: any) {
  const { outputPath, cache, chunks, options, isTurn, publicDir, longest } =
    config;
  if (extname(filePath) === '.svg') return;

  const start = performance.now();

  const fileRootPath = path.resolve(outputPath, filePath);
  try {
    await proFs.access(fileRootPath, fs.constants.F_OK);
  } catch (error) {
    return;
  }

  const ext = path.extname(fileRootPath).slice(1) ?? '';
  const res = options.conversion.find((item) => `${item.from}`.includes(ext));
  const itemConversion = isTurn && res?.from === ext;
  const type = itemConversion ? res?.to : sharpEncodeMap.get(ext);
  const current: any = encodeMap.get(type);
  const filepath = `${fileRootPath.replace(
    ext,
    itemConversion ? current : ext,
  )}`;

  const relativePathRace = path.relative(publicDir, filepath);
  const finalPath = path.join(outputPath, relativePathRace);
  const deletePath = path.join(outputPath, path.relative(publicDir, filePath));
  const f1 = path.join(outputPath, filePath.replace(publicDir, ''));

  const shortPath = finalPath.replace(process.cwd(), '');

  if (options.cache && chunks[filePath] && cache.get(chunks[filePath])) {
    await proFs.writeFile(finalPath, cache.get(chunks[filePath]));

    if (itemConversion && !filterDirPath(filepath, publicDir)) {
      await proFs.unlink(fileRootPath);
    }
    if (filterDirPath(filepath, publicDir)) {
      await proFs.unlink(deletePath);
    }
    compressSuccess(`${shortPath.padEnd(longest + 2)}`, 0, 0, 0, true);
    return;
  } else if (
    options.cache &&
    filterDirPath(filepath, publicDir) &&
    cache.getPublish(finalPath, f1)
  ) {
    await proFs.writeFile(finalPath, cache.getPublish(finalPath, f1));

    if (itemConversion && !filterDirPath(filepath, publicDir)) {
      await proFs.unlink(fileRootPath);
    }
    if (filterDirPath(filepath, publicDir)) {
      await proFs.unlink(deletePath);
    }
    compressSuccess(`${shortPath.padEnd(longest + 2)}`, 0, 0, 0, true);
    return;
  }

  const oldSize = (await proFs.stat(fileRootPath)).size;
  let newSize = oldSize;

  const currentType = options.conversion.find(
    (item) => item.from === extname(fileRootPath).slice(1),
  );
  let resultBuffer;
  let data;

  if (currentType !== undefined) {
    const option = {
      ...sharpOptions[ext],
      ...options.compress[currentType.to],
    };

    resultBuffer = await sharp(fileRootPath)
      [sharpEncodeMap.get(currentType.to)!](option)
      .toBuffer();
  } else {
    const option = { ...sharpOptions[ext], ...options.compress[ext] };

    resultBuffer = await sharp(fileRootPath)
      [sharpEncodeMap.get(ext)!](option)
      .toBuffer();
  }

  if (filterDirPath(filepath, publicDir)) {
    await proFs.writeFile(finalPath, resultBuffer);
    data = await proFs.stat(finalPath);
  } else {
    await proFs.writeFile(filepath, resultBuffer);
    data = await proFs.stat(filepath);
  }

  newSize = data.size;

  if (newSize < oldSize) {
    if (options.cache && filterDirPath(filepath, publicDir)) {
      cache.setPublish(finalPath, f1, await proFs.readFile(f1));
    } else if (
      options.cache &&
      chunks[filePath] &&
      !cache.get(chunks[filePath])
    ) {
      try {
        cache.set(chunks[filePath], await proFs.readFile(filepath));
      } catch (error) {
        console.log('ERROR Read file cache', error);
      }
    }
    if (itemConversion && !filterDirPath(filepath, publicDir)) {
      await proFs.unlink(fileRootPath);
    }
    if (filterDirPath(filepath, publicDir)) {
      await proFs.unlink(deletePath);
    }
    compressSuccess(
      `${shortPath.padEnd(longest + 2)}`,
      newSize,
      oldSize,
      start,
    );
  }
}

async function initSharp(config) {
  const files = config.files.filter(filterImageModule);

  const images = files
    .filter(filterImageModule)
    .map((filePath: string) => processImageFile(filePath, config));
  await Promise.all(images);
}
export default initSharp;
