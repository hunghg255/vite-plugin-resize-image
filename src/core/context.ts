import { encodeMap, encodeMapBack, sharpEncodeMap } from './encodeMap';
import { createFilter } from '@rollup/pluginutils';
import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';
import { optimize } from 'svgo';
import type { ResolvedConfig } from 'vite';
import {
  exists,
  filterExtension,
  filterFile,
  generateImageID,
  hasImageFiles,
  isTurnImageType,
  parseId,
  readFilesRecursive,
  readImageFiles,
  transformFileName,
} from './utils';
import { basename, extname, join, resolve } from 'pathe';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { promises as fs } from 'fs';
import { defaultOptions, sharpOptions } from './compressOptions';
import type { PluginOptions, ResolvedOptions } from './types';
import devalue from './devalue';
import chalk from 'chalk';
import { compressSuccess, logger, pluginTitle } from './log';
import { loadWithRocketGradient } from './gradient';
import Cache from './cache';
import initSquoosh from './squoosh';
import initSharp from './sharp';
import initSvg from './svgo';
export const cssUrlRE =
  /(?<=^|[^\w\-\u0080-\uffff])url\((\s*('[^']+'|"[^"]+")\s*|[^'")]+)\)/;

const CurrentNodeVersion = parseInt(process.version.slice(1), 10);
const SquooshErrorVersion = 18;
const SquooshUseFlag = CurrentNodeVersion < SquooshErrorVersion;
let SquooshPool;
if (SquooshUseFlag) {
  import('@squoosh/lib')
    .then((module) => {
      SquooshPool = module.ImagePool;
      delete globalThis.navigator;
    })
    .catch(console.error);
}
// const extRE = /\.(png|jpeg|jpg|webp|wb2|avif)$/i;
const extSvgRE = /\.(png|jpeg|jpg|webp|wb2|avif|svg)$/i;

export interface Options {
  compress: any;
}

export default class Context {
  config: ResolvedOptions | any;

  mergeConfig: any;

  mergeOption: any;

  imageModulePath: string[] = [];

  chunks: any;

  cache: any;

  files: string[] = [];

  assetPath: string[] = [];

  filter = createFilter(extSvgRE, [
    /[\\/]node_modules[\\/]/,
    /[\\/]\.git[\\/]/,
  ]);

  /**
   * @param ResolvedConfig
   * configResolved hook vite
   * Parsing user parameters and vite parameters
   */

  handleResolveOptionHook(
    userConfig: ResolvedConfig & { options: PluginOptions },
  ) {
    const {
      base,
      command,
      root,
      build: { assetsDir, outDir },
      options,
      publicDir,
    } = userConfig;
    const cwd = process.cwd();
    const isBuild = command === 'build';
    const cacheDir = join(
      root,
      'node_modules',
      options.cacheDir! ?? '.cache',
      'vite-plugin-resize-image',
    );
    const isTurn = isTurnImageType(options.conversion);
    const outputPath = resolve(root, outDir);
    const chooseConfig = {
      base,
      command,
      root,
      cwd,
      outDir,
      assetsDir,
      options,
      isBuild,
      cacheDir,
      outputPath,
      isTurn,
      publicDir,
    };
    // squoosh & sharp merge config options
    this.mergeConfig = resolveOptions(defaultOptions, chooseConfig);
    this.config = chooseConfig;
  }

  /**
   * @param id
   * @returns
   * load hooks  id bundle
   * Parsing id returns custom content and then generates custom bundle
   */
  loadBundleHook(id) {
    const imageModuleFlag = this.filter(id);
    const exportValue = this.generateDefaultValue(imageModuleFlag, id);
    return exportValue;
  }

  /**
   * @param bundler
   * chunk file
   * Dynamically generate chunk file according to the content of user-defined module obtained before building
   */
  async generateBundleHook(bundler) {
    this.chunks = bundler;
    if (!(await exists(this.config.cacheDir))) {
      // TODO cache
      await mkdir(this.config.cacheDir, { recursive: true });
    }
    let imagePool;
    const { mode } = this.config.options;
    const useModeFlag = resolveNodeVersion();

    if (mode === 'squoosh' && !useModeFlag) {
      console.log(
        chalk.yellow(
          'Squoosh mode is not supported in node v18 or higher. prepare change use sharp...',
        ),
      );
    }
    let changeMode = useModeFlag ? mode : 'sharp';
    if (changeMode === 'squoosh' && SquooshUseFlag) {
      imagePool = new SquooshPool();
    }

    this.startGenerateLogger();
    let spinner = await loadWithRocketGradient('');

    if (this.imageModulePath.length > 0) {
      const generateImageBundle = this.imageModulePath.map(async (item) => {
        if (extname(item) !== '.svg') {
          if (changeMode === 'squoosh' && SquooshUseFlag) {
            const squooshBundle = await this.generateSquooshBundle(
              imagePool,
              item,
            );
            return squooshBundle;
          } else if (changeMode === 'sharp') {
            const sharpBundle = await this.generateSharpBundle(item);
            return sharpBundle;
          }
        }
        // transform svg
        const svgBundle = this.generateSvgBundle(item);
        return svgBundle;
      });
      const result = await Promise.all(generateImageBundle);
      if (changeMode === 'squoosh') {
        imagePool.close();
      }

      this.generateBundleFile(bundler, result);
      logger(pluginTitle('✨'), chalk.yellow('Successfully'));
    } else {
      console.log(
        chalk.yellow(
          'Not Found Image Module,  if you want to use style with image style, such as "background-image" you can use "beforeBundle: false" in plugin config',
        ),
      );
      if (changeMode === 'squoosh') {
        imagePool.close();
      }
    }

    spinner.text = chalk.yellow('Image conversion completed!');
    spinner.succeed();
  }

  /**
   * @param bundle
   * transform chunk replace  css  js
   */
  TransformChunksHook(bundle) {
    this.chunks = bundle;
    this.filterBundleFile(bundle);
    this.transformCodeHook(bundle);
  }

  setAssetsPath(pathStr) {
    this.assetPath.push(pathStr);
  }

  filterBundleFile(bundle) {
    Object.keys(bundle).forEach((key) => {
      const { outputPath } = this.config;
      // eslint-disable-next-line no-unused-expressions
      filterFile(resolve(outputPath!, key), extSvgRE) && this.files.push(key);
    });
  }

  async transformCodeHook(bundle) {
    // read publicDir path
    const files = await readImageFiles(this.config.publicDir);

    // Use regular expressions to filter out the file name of the picture file
    // const imageFileNames = files.filter((file) => file.match(extSvgRE));

    // const imageFilePaths = imageFileNames.map((fileName) =>
    //   path.join(this.config.publicDir, fileName),
    // );

    const allBundles = Object.values(bundle);

    const chunkBundle = allBundles.filter((item: any) => item.type === 'chunk');

    const assetBundle = allBundles.filter((item: any) => item.type === 'asset');
    const imageBundle = assetBundle.filter((item: any) =>
      item.fileName.match(extSvgRE),
    );
    const imageFileBundle = imageBundle
      .map((item: any) => item.fileName)
      .concat(files);

    const needTransformAssetsBundle = assetBundle.filter((item: any) =>
      filterExtension(item.fileName, 'css'),
    );
    // transform css modules
    await transformCode(
      this.config,
      needTransformAssetsBundle,
      imageFileBundle,
      'source',
    );
    // transform js modules
    await transformCode(this.config, chunkBundle, imageFileBundle, 'code');
  }

  generateDefaultValue(imageModuleFlag, id) {
    if (imageModuleFlag) {
      const parser = parseId(id);

      this.imageModulePath.push(parser.path);
      const generateSrc = getBundleImageSrc(parser.path, this.config.options);
      const base = basename(parser.path, extname(parser.path));

      const generatePath = join(
        `${this.config.base}${this.config.assetsDir}`,
        `${base}-${generateSrc}`,
      );
      return `export default ${devalue(generatePath)}`;
    }
  }

  // squoosh
  async generateSquooshBundle(imagePool, item) {
    const start = performance.now();
    const size = await fs.lstat(item);
    const oldSize = size.size;
    let newSize = oldSize;
    const ext = extname(item).slice(1) ?? '';
    const userRes = this.config.options.conversion.find((i) =>
      `${i.from}`.endsWith(ext),
    );
    // const itemConversion = this.config.isTurn && userRes?.from === ext;
    const type =
      this.config.isTurn && userRes?.to
        ? encodeMapBack.get(userRes?.to)
        : encodeMapBack.get(ext);

    const image = imagePool.ingestImage(item);
    const generateSrc = getBundleImageSrc(item, this.config.options);
    const baseDir = basename(item, extname(item));
    const imageName = `${baseDir}-${generateSrc}`;
    const { cacheDir, assetsDir } = this.config;
    const cachedFilename = join(cacheDir, imageName);
    const defaultSquooshOptions = {};
    Object.keys(defaultOptions).forEach(
      (key) => (defaultSquooshOptions[key] = { ...this.mergeConfig[key] }),
    );

    if (!(await this.isCache(cachedFilename))) {
      const currentType = {
        [type!]: defaultSquooshOptions[type!],
      };
      try {
        await image.encode(currentType);
      } catch (error) {
        console.log(error);
      }
    }

    let encodedWith;
    if (!(await this.isCache(cachedFilename))) {
      encodedWith = await image.encodedWith[type!];
    } else {
      encodedWith = {
        binary: await fs.readFile(cachedFilename),
        size: (await fs.lstat(cachedFilename)).size,
      };
    }

    newSize = encodedWith.size;
    // TODO add cache module

    if (this.config.options.cache && !(await exists(cachedFilename))) {
      await fs.writeFile(cachedFilename, encodedWith.binary);
    }
    const source = {
      fileName: join(assetsDir, imageName),
      name: imageName,
      source: encodedWith.binary,
      isAsset: true,
      type: 'asset',
    };
    const { base, outDir } = this.config;
    compressSuccess(
      join(base, outDir, source.fileName),
      newSize,
      oldSize,
      start,
    );
    return source;
  }

  async generateSharpBundle(item) {
    const { cacheDir } = this.config;
    const start = performance.now();
    const size = await fs.lstat(item);

    const oldSize = size.size;
    let newSize = oldSize;
    let sharpFileBuffer;

    const generateSrc = getBundleImageSrc(item, this.config.options);
    const base = basename(item, extname(item));
    const imageName = `${base}-${generateSrc}`;
    const cachedFilename = join(cacheDir, imageName);
    if (!(await this.isCache(cachedFilename))) {
      sharpFileBuffer = await loadImage(item, this.config.options);
    } else {
      sharpFileBuffer = await fs.readFile(cachedFilename);
    }
    if (this.config.options.cache && !(await exists(cachedFilename))) {
      await fs.writeFile(cachedFilename, sharpFileBuffer);
    }
    const source = await writeImageFile(
      sharpFileBuffer,
      this.config,
      imageName,
    );
    newSize = sharpFileBuffer.length;
    const { outDir } = this.config;

    compressSuccess(
      join(this.config.base, outDir, source.fileName),
      newSize,
      oldSize,
      start,
    );
    return source;
  }

  generateBundleFile(bundler, result) {
    result.forEach((asset) => {
      bundler[asset.fileName] = asset;
    });
  }

  startGenerateLogger() {
    console.log('\n');
    const info = chalk.gray('Process start with');
    const modeLog = chalk.magenta(`Mode ${this.config.options.mode}`);
    logger(pluginTitle('📦'), info, modeLog);
  }

  // close bundle
  async closeBundleHook() {
    if (!this.config.options.beforeBundle) {
      this.startGenerateLogger();
      await this.spinnerHooks(this.closeBundleFn);
      this.transformHtmlModule();
    }
    return true;
  }

  async transformHtmlModule() {
    const htmlBundlePath = `${this.config.outDir}/index.html`;
    const html = await fs.readFile(resolve(process.cwd(), htmlBundlePath));
    const htmlBuffer = Buffer.from(html);
    const htmlCodeString = htmlBuffer.toString();

    let newFile: string = '';
    this.config.options.conversion.forEach(async (item) => {
      const pattern = new RegExp(item.from, 'g');
      newFile =
        newFile.length > 0
          ? newFile.replace(pattern, item.to)
          : htmlCodeString.replace(pattern, item.to);
      await fs.writeFile(resolve(process.cwd(), htmlBundlePath), newFile);
    });
  }

  async isCache(cacheFilePath) {
    return this.config.options.cache && exists(cacheFilePath);
  }

  async spinnerHooks(fn) {
    if (!this.files.length && !hasImageFiles(this.config.publicDir)) {
      return false;
    }
    let spinner;
    spinner = await loadWithRocketGradient('');
    await fn.call(this);
    logger(pluginTitle('✨'), chalk.yellow('Successfully'));
    // spinner.text = chalk.yellow('Image conversion completed!');
    spinner.succeed();
  }

  async generateSvgBundle(item) {
    const svgCode = await fs.readFile(item, 'utf8');

    const result = optimize(svgCode, {
      // optional but recommended field
      // path, // all config fields are also available here
      multipass: true,
    });

    const generateSrc = getBundleImageSrc(item, this.config.options);
    const base = basename(item, extname(item));
    const { assetsDir, outDir } = this.config;
    const imageName = `${base}-${generateSrc}`;
    const start = performance.now();
    const size = await fs.lstat(item);

    const oldSize = size.size;
    let newSize = Buffer.byteLength(result.data);
    const svgResult = {
      fileName: join(assetsDir, imageName),
      name: imageName,
      source: result.data,
      isAsset: true,
      type: 'asset',
    };

    compressSuccess(
      join(this.config.base, outDir, svgResult.fileName),
      newSize,
      oldSize,
      start,
    );
    return svgResult;
  }

  async closeBundleFn() {
    const { isTurn, outputPath, publicDir } = this.config;
    const { mode, cache } = this.config.options;

    const defaultSquooshOptions = {};
    Object.keys(defaultOptions).forEach(
      (key) => (defaultSquooshOptions[key] = { ...this.mergeConfig[key] }),
    );
    if (cache) {
      this.cache = new Cache({ outputPath });
    }

    this.files.push(...readFilesRecursive(publicDir));

    const initOptions = {
      files: this.files,
      outputPath,
      inputPath: this.assetPath,
      options: this.config.options,
      isTurn,
      cache: this.cache,
      chunks: this.chunks,
      publicDir,
    };

    this.files.forEach(async (item: string) => {
      if (extname(item) === '.svg') {
        await initSvg({ ...initOptions }, item);
      }
    });

    if (mode === 'squoosh' && SquooshUseFlag) {
      await initSquoosh({ ...initOptions, defaultSquooshOptions });
    } else if (mode === 'sharp' || !SquooshUseFlag) {
      if (mode === 'squoosh') {
        logger(
          pluginTitle('✨'),
          chalk.yellow(
            'Since the current version of node does not support squoosh, it will automatically change mode to sharp.',
          ),
        );
      }

      await initSharp(initOptions);
    } else {
      throw new Error(
        '[vite-plugin-resize-image] Only squoosh or sharp can be selected for mode option',
      );
    }
  }
}
async function writeImageFile(buffer, options, imageName): Promise<any> {
  const { cacheDir, assetsDir } = options;

  const cachedFilename = join(cacheDir, imageName);
  if (options.cache && (await exists(cachedFilename))) {
  }
  return {
    fileName: join(assetsDir, imageName),
    name: imageName,
    source: buffer,
    isAsset: true,
    type: 'asset',
  };
}

async function convertToSharp(inputImg, options) {
  const currentType = options.conversion.find(
    (item) => item.from === extname(inputImg).slice(1),
  );
  let res;
  const ext = extname(inputImg).slice(1);
  if (currentType !== undefined) {
    const option = {
      ...sharpOptions[ext],
      ...options.compress[currentType.to],
    };

    res = await sharp(inputImg)
      [sharpEncodeMap.get(currentType.to)!](option)
      .toBuffer();
  } else {
    const option = {
      ...sharpOptions[ext],
      ...options.compress[ext],
    };
    res = await sharp(inputImg)[sharpEncodeMap.get(ext)!](option).toBuffer();
  }
  return res;
}
function getBundleImageSrc(filename: string, options: any) {
  const currentType =
    options.conversion.find(
      (item) => item.from === extname(filename).slice(1),
    ) ?? extname(filename).slice(1);
  const id = generateImageID(
    filename,
    currentType.to ?? extname(filename).slice(1),
  );
  return id;
}
export async function loadImage(url: string, options: any) {
  const image = convertToSharp(url, options);
  return image;
}

export function resolveOptions(
  options: any,
  configOption: any,
): ResolvedOptions {
  const transformType = transformEncodeType(configOption.options?.compress);
  const keys = Object.keys(transformType);
  const res = keys.map(
    (item) =>
      ({
        ...options[item],
        ...transformType[item],
      }) as ResolvedOptions,
  );
  const obj = {};
  keys.forEach((item, index) => {
    obj[item] = res[index];
  });
  return { ...options, ...obj } as ResolvedOptions;
}

export function transformEncodeType(options = {}) {
  const newCompressOptions: any = {};
  const transformKeys = Object.keys(options).map((item) =>
    encodeMapBack.get(item),
  );
  const transformOldKeys: any = Object.keys(options).map((item) => item);
  transformKeys.forEach((item: any, index: number) => {
    newCompressOptions[item] = options[transformOldKeys[index]];
  });
  return newCompressOptions;
}

// transform resolve code
export async function transformCode(
  options,
  currentChunk,
  changeBundle,
  sourceCode,
) {
  currentChunk.forEach(async (item: any) => {
    const finallyPath = join(options.outputPath, item.fileName);
    options.options.conversion.forEach(
      (type: { from: string | RegExp; to: string }) => {
        changeBundle.forEach(async (file) => {
          if (file.endsWith(type.from)) {
            const name = transformFileName(file);
            item[sourceCode] = item[sourceCode].replaceAll(
              `${name}${type.from}`,
              `${name}${encodeMap.get(type.to)}`,
            );
          }
        });
      },
    );
    await fs.writeFile(finallyPath, item[sourceCode]);
  });
}

export function resolveNodeVersion() {
  const currentVersion = process.versions.node;
  const requiredMajorVersion = parseInt(currentVersion.split('.')[0], 10);
  const minimumMajorVersion = 18;

  if (requiredMajorVersion < minimumMajorVersion) {
    return true;
  }
  return false;
}
