import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/chat-provider.tsx',
      'src/management/management.tsx',
      'src/modals/chat-modal/chat-modal.tsx',
      'src/shared/custom-element.ts',
    ],
    format: ['esm', 'cjs'],
    dts: {
      entry: {
        index: 'src/index.ts',
        'public-types': 'src/types/public.ts',
      },
    },
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    target: 'esnext',
    bundle: true,
    loader: {
      '.png': 'dataurl',
      '.svg': 'dataurl',
      '.css': 'css',
    },
    injectStyle: true,
    external: ['react', 'react-dom'],
  },
  {
    entry: {
      cli: 'src/cli/index.ts',
    },
    format: ['cjs'],
    platform: 'node',
    target: 'node18',
    outDir: 'dist',
    clean: false,
    sourcemap: true,
    bundle: true,
    splitting: false,
    shims: false,
    minify: false,
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.js' : '.js',
      };
    },
    banner: {
      js: '#!/usr/bin/env node',
    },
    external: ['fs-extra', 'prompts', 'commander'],
  },
]);
