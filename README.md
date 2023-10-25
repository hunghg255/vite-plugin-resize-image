# 📦 vite-plugin-resize-image

[![NPM version](https://img.shields.io/npm/v/vite-plugin-resize-image?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-resize-image)

### ✨✨ Continuous iterative development in testing

```bash
✨ : vite-plugin-resize-image
✔ : Process start with mode squoosh
✅ : [test1.png] [12.39 MB] -> [102.54 KB]
✔ : Process start with mode squoosh
✅ : [test2.png] [16.38 MB] -> [76.79 KB]
```

#### 🌈 Features

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

Due to the loading problem of `squoosh`, unplugin-imagmin currently only supports versions below node 18.

Due to the rapid update of vite version and squoosh stop maintenance and other unstable factors

It is recommended that mode choose `sharp`.

## 📦 Installation

```bash
npm i vite-plugin-resize-image@latest -D
```

#### support vite and rollup.

<details>
<summary>Basic</summary><br>

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ResizeImage from 'vite-plugin-resize-image/vite';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), ResizeImage()],
});
```

<br></details>

<details>
<summary>Advanced</summary><br>

```ts
iimport { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ResizeImage from 'vite-plugin-resize-image/vite';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
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
   * @default node_modules/vite-plugin-resize-image/cache
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
