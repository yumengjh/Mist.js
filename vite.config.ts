import { defineConfig } from 'vite'
import { resolve } from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  esbuild: {
    minify: true
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Mist',
      formats: ['es', 'umd', 'iife']
    },
    rollupOptions: {
      plugins: [
        {
          name: 'remove-collection-handlers',
          transform(code, id) {
            if (id.endsWith('reactivity.esm-bundler.js')) {
              return code
                .replace(`mutableCollectionHandlers,`, `null,`)
                .replace(`readonlyCollectionHandlers,`, `null,`)
            }
          }
        }
      ]
    }
  },
  // plugins: [
  //   viteCompression({
  //     verbose: true,
  //     disable: false,
  //     threshold: 10240,
  //     algorithm: 'gzip',
  //     ext: '.gz',
  //     deleteOriginFile: false
  //   })
  // ]
})
