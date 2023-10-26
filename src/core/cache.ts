import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import pkg from '../../package.json';

const env = process.env.NODE_ENV || 'development';

const root = process.cwd();
export const cacheDirectory = path.join(
  root,
  'node_modules',
  '.cache',
  'vite-plugin-resize-image',
);
const cacheIdentifier = `vite-plugin-resize-image:${pkg.version} ${env}`;
const manifestKey = path.join(cacheDirectory, 'manifest.json');

export default class Cache {
  manifest: any;

  outputPath: string;

  constructor({ outputPath }) {
    this.outputPath = outputPath;
    this.manifest = getCacheManifest();
  }

  get(chunk) {
    const cacheKey = getCacheKey(chunk);
    if (!this.hasManifest(cacheKey)) {
      return null;
    }
    if (!cacheKey) return;

    const originStats = fs.statSync(path.join(this.outputPath, chunk.fileName));
    const cacheStats = this.getManifest(cacheKey);

    if (originStats.size === cacheStats.size) {
      return fs.readFileSync(cacheKey);
    }
    return null;
  }

  set(chunk, data) {
    const cacheKey = getCacheKey(chunk);

    if (!cacheKey) return;

    if (!existsSync(cacheDirectory)) {
      mkdirSync(cacheDirectory);
    }
    fs.writeFileSync(
      cacheKey,
      data || fs.readFileSync(path.join(this.outputPath, chunk.fileName)),
    );

    try {
      this.setManifest(
        cacheKey,
        fs.statSync(path.join(this.outputPath, chunk.fileName)),
      );
    } catch (error) {
      console.log('ERROR: setManifest', error);
    }
  }

  setPublish(finalPath, filePath, data) {
    const cacheKey = getCacheKey(finalPath);

    if (!cacheKey) return;

    if (!existsSync(cacheDirectory)) {
      mkdirSync(cacheDirectory);
    }
    fs.writeFileSync(cacheKey, data);

    try {
      this.setManifest(cacheKey, fs.statSync(filePath));
    } catch (error) {
      console.log('ERROR: setManifest', error);
    }
  }

  getPublish(finalPath, filePath) {
    const cacheKey = getCacheKey(finalPath);

    if (!this.hasManifest(cacheKey)) {
      return null;
    }

    if (!cacheKey) return;

    const originStats = fs.statSync(filePath);
    const cacheStats = this.getManifest(cacheKey);

    if (originStats.size === cacheStats.size) {
      return fs.readFileSync(cacheKey);
    }
    return null;
  }

  getManifest(key: string) {
    return this.manifest[key];
  }

  setManifest(key: string, value: object) {
    this.manifest[key] = value;
    fs.writeFileSync(manifestKey, JSON.stringify(this.manifest), 'utf-8');
  }

  hasManifest(key: string) {
    return Boolean(this.manifest[key]);
  }
}

function getCacheManifest(): object {
  if (!existsSync(manifestKey)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(manifestKey, 'utf-8')) || {};
}

function getCacheKey(chunk): string {
  if (typeof chunk === 'object') {
    const hash = digest(`${cacheIdentifier}\n${chunk.name}`);
    return path.join(cacheDirectory, `${hash}`);
  }

  const hash = digest(`${cacheIdentifier}\n${chunk}`);
  return path.join(cacheDirectory, `${hash}`);
}

function existsSync(existsPath: string): boolean {
  return fs.existsSync(existsPath);
}

function mkdirSync(mkdirPath: string): void {
  fs.mkdirSync(mkdirPath, { recursive: true });
}

function digest(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}
