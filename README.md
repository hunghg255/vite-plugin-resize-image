<p align="center">
<a href="https://www.npmjs.com/package/vite-plugin-resize-image" target="_blank" rel="noopener noreferrer">
<img src="https://api.iconify.design/bi:plugin.svg?color=%23a985ff" alt="logo" width='100'/></a>
</p>

<p align="center">
  A plugin resize image for <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer">Vitejs</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vite-plugin-resize-image" target="_blank" rel="noopener noreferrer"><img src="https://badge.fury.io/js/vite-plugin-resize-image.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/vite-plugin-resize-image" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/dt/vite-plugin-resize-image.svg?logo=npm" alt="NPM Downloads" /></a>
  <a href="https://bundlephobia.com/result?p=vite-plugin-resize-image" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/bundlephobia/minzip/vite-plugin-resize-image" alt="Minizip" /></a>
  <a href="https://github.com/hunghg255/vite-plugin-resize-image/graphs/contributors" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/all_contributors-1-orange.svg" alt="Contributors" /></a>
  <a href="https://github.com/hunghg255/vite-plugin-resize-image/blob/main/LICENSE" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/github/license/hunghg255/vite-plugin-resize-image" alt="License" /></a>
</p>

## ✨✨ Continuous iterative development in testing

```bash
[vite-plugin-resize-image] 📦 Process start with Mode sharp
✓ dist/images/ic-solar_gallery-add-bold.svg            2.9 KB     ➡️  1.29 KB    +58ms
✓ dist/assets/ic-solar_gallery-add-bold-0d3eb8b2.svg   2.9 KB     ➡️  1.29 KB    +59ms
✓ dist/images/a.webp                                   799.21 KB  ➡️  74.36 KB   +1012ms
✓ dist/assets/a-aa18c0a3.webp                          3.5 MB     ➡️  149.98 KB  +3176ms
[vite-plugin-resize-image] ✨ Successfully
```

## 🌈 Features

- 🍰 Support png jpeg webp avif svg tiff Format
- 🦾 High Performance based on squoosh
- ✨ Multiple picture formats can be configured
- 🪐 Compress the code at build time
- 😃 Caching Mechanism Tips: TODO
- 🌈 You can convert different picture types at build time

## Squoosh && Sharp && Svgo

Supports two compression modes

[Sharp](https://github.com/lovell/sharp) The typical use case for this high speed Node.js module is to convert large images in common formats to smaller, web-friendly JPEG, PNG, WebP, GIF and AVIF images of varying dimensions.

[Squoosh](https://github.com/GoogleChromeLabs/squoosh) is an image compression web app that reduces image sizes through numerous formats.
**Squoosh** with rust & wasm

[Svgo](https://github.com/svg/svgo) Support compression of pictures in svg format

## ✨Warning

Although squoosh has done a good job, there will be all kinds of problems in future node versions, so don't use squoosh mode for the time being.

Due to the loading problem of `squoosh`, vite-plugin-resize-image currently only supports versions below node 18.

Due to the rapid update of vite version and squoosh stop maintenance and other unstable factors

It is recommended that mode choose `sharp`.

## 📦 Installation

```bash
npm i vite-plugin-resize-image@latest -D
```

## support vite and rollup.

<details>
<summary>Basic</summary><br>

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ResizeImage from 'vite-plugin-resize-image/vite';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ResizeImage()],
});
```

<br></details>

<details>
<summary>Advanced</summary><br>

```ts
iimport { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ResizeImage from 'vite-plugin-resize-image/vite';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ResizeImage({
      // Default mode sharp. support squoosh and sharp
      mode: 'squoosh',
      beforeBundle: true,
      // Default configuration options for compressing different pictures
      compress: {
        jpg: {
          quality: 10,
        },
        jpeg: {
          quality: 10,
        },
        png: {
          quality: 10,
        },
        webp: {
          quality: 10,
        },
      },
      conversion: [
        { from: 'jpeg', to: 'webp' },
        { from: 'png', to: 'webp' },
        { from: 'JPG', to: 'jpeg' },
      ],
    }),
  ],
});

```

<br></details>

## 🌸 DefaultConfiguration

Squoosh DefaultConfiguration and sharp DefaultConfiguration

```typescript
export interface PluginOptions {
  /**
   * @description Picture compilation and conversion
   * @default []
   */
  conversion?: ConversionItemType[];
  /**
   * @description Whether to turn on caching
   * @default true
   */
  cache?: boolean;
  /**
   * @description Cache folder directory read
   * @default node_modules/.cache/vite-plugin-resize-image
   *
   */
  cacheDir?: string;
  /**
   * @description Compilation attribute
   * @default CompressTypeOptions
   */
  compress?: CompressTypeOptions;
  /**
   * @description mode
   * @default squoosh
   * @description squoosh or sharp
   */
  mode?: 'squoosh' | 'sharp';
  /**
   * @description Whether to compress before packing
   * @default false
   */
  beforeBundle?: boolean;
}
```
