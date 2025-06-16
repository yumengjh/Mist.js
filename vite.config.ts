import { defineConfig } from 'vite'
import { resolve } from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  esbuild: {
    minify: true,
    sourcemap:false
  },
  build: {
    target: 'esnext',
    sourcemap:false,
    minify: 'terser',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Mist',
      formats: ['es', 'umd', 'iife']
    },
    rollupOptions: {
      plugins: [
        {
          name: 'remove-comments',
          transform(code, id) {
            if (id.endsWith('reactivity.esm-bundler.js') || 
                id.endsWith('shared.esm-bundler.js')) {
              return code
                // 移除完整的版权头注释块
                .replace(/\/\*\*[\s\S]*?@license MIT[\s\S]*?\*\//g, '')
                // 移除 NO_SIDE_EFFECTS 注释
                .replace(/\/\*![\s\S]*?#__NO_SIDE_EFFECTS__[\s\S]*?\*\//g, '')
                // 移除空行
                .replace(/^\s*[\r\n]/gm, '')
                .replace(/mutableCollectionHandlers,/g, 'null,')
                .replace(/readonlyCollectionHandlers,/g, 'null,');
            }
            return code;
          }
        }
      ]
    }
  },
  server: {
    // open: '/demo/demo.html'
  },
  plugins: [
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false
    })
  ]
})
