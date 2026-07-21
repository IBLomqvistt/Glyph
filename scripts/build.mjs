import { cp, copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const files = [
  'index.html',
  'styles.css',
  'app.js',
  'src/demo-content.mjs',
  'src/kimi-reader.mjs',
  'src/models-catalog.mjs',
  'src/routes.mjs',
]

for (const file of files) {
  const destination = join('dist', file)
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(file, destination)
}

for (const directory of [
  'assets',
  'public',
  'fixtures',
  'packages/ingestion/src',
  'packages/recommendation/src',
]) {
  await cp(directory, join('dist', directory), { recursive: true })
}

await mkdir('dist/server', { recursive: true })
await copyFile('sites-worker.mjs', 'dist/server/index.js')

console.log(
  `Built ${files.length} static files, the Sites worker, and worked-example assets into dist/`,
)
