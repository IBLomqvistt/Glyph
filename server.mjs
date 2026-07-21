import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const port = Number(process.env.PORT || 4173)
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

const server = createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || '/').split('?')[0])
  const assetPath =
    requestPath === '/favicon.ico'
      ? '/assets/kimi-k3/kimi-favicon.ico'
      : requestPath
  const normalizedPath = normalize(assetPath).replace(/^(\.\.[/\\])+/, '')
  let filePath = join(
    root,
    normalizedPath === '/' ? 'index.html' : normalizedPath,
  )

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }

  if (!existsSync(filePath)) {
    const publicFilePath = join(root, 'public', normalizedPath)
    if (publicFilePath.startsWith(root) && existsSync(publicFilePath)) {
      filePath = publicFilePath
    }
  }

  if (!existsSync(filePath)) {
    const isAppRoute =
      requestPath === '/login' ||
      requestPath === '/layers/models' ||
      requestPath === '/reader/kimi-k3-open-frontier-intelligence'
    if (isAppRoute) filePath = join(root, 'index.html')
    else {
      response
        .writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        .end('Not found')
      return
    }
  }

  response.writeHead(200, {
    'cache-control': 'no-store',
    'content-type':
      contentTypes[extname(filePath)] || 'application/octet-stream',
  })
  createReadStream(filePath).pipe(response)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Glyph is ready at http://127.0.0.1:${port}`)
  console.log(`Serving ${root}`)
})
