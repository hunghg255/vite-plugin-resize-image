import chalk from 'chalk';
import { performance } from 'node:perf_hooks';

import { size } from './utils';
type colorTuple = string | number | any;
function colorResult(args, color): void {
  console.log(chalk[color](...args));
}
export const red = (args: colorTuple) => colorResult(args, 'red');
export const green = (res: colorTuple) => colorResult(res, 'green');
export const gray = (res: colorTuple) => colorResult(res, 'gray');
export const yellow = (res: colorTuple) => colorResult(res, 'yellow');
export const blue = (res: colorTuple) => colorResult(res, 'blue');
export const magenta = (res: colorTuple) => colorResult(res, 'blue');
export const black = (res: string | number) => colorResult(res, 'black');
export const cyan = (res: string | number) => colorResult(res, 'cyan');
export const bgGreen = (res: string | number) => colorResult(res, 'bgGreen');
export const bgRed = (res: string | number) => colorResult(res, 'bgRed');
export const bgYellow = (res: string | number) => colorResult(res, 'bgYellow');
export const bgGray = (res: string | number) => colorResult(res, 'bgGray');
export const bgBlue = (res: string | number) => colorResult(res, 'bgBlue');
export const bgMagenta = (res: string | number) =>
  colorResult(res, 'bgMagenta');
export const bgCyan = (res: string | number) => colorResult(res, 'bgCyan');

// eslint-disable-next-line max-params
export function compressSuccess(
  filePath,
  newSize,
  oldSize,
  start,
  isCache = false,
) {
  let path = filePath;
  if (path.charAt(0) === '/') {
    path = path.substring(1);
  }

  if (isCache) {
    console.log(
      chalk.green('✓'),
      chalk.blue(path),
      chalk.green('✨ Cache Hit'),
    );
    return;
  }
  console.log(
    chalk.green('✓'),
    chalk.blue(path),
    chalk.yellow(size(oldSize).toString().padEnd(10)),
    '➡️ ',
    chalk.green(size(newSize).toString().padEnd(10)),
    chalk.magenta(`+${Math.ceil(performance.now() - start)}ms`),
  );
}

export function pluginTitle(emoji) {
  return chalk.blue(`[vite-plugin-resize-image] ${emoji}`);
}

export function logger(...args) {
  console.log(...args);
}
