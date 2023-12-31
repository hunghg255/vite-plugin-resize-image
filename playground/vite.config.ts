import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ResizeImage from '../src/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ResizeImage({
      // Default mode sharp. support squoosh and sharp
      mode: 'sharp',
      cache: true,
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
        { from: 'jpg', to: 'webp' },
        { from: 'png', to: 'webp' },
      ],
    }),
  ],
});
