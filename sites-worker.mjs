const appRoutes = new Set([
  '/',
  '/login',
  '/layers/models',
  '/reader/kimi-k3-open-frontier-intelligence',
])

function assetRequest(request, pathname) {
  const url = new URL(request.url)
  url.pathname = pathname
  return new Request(url, request)
}

export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response('Glyph assets are unavailable.', { status: 503 })
    }

    const url = new URL(request.url)
    const requestedPath =
      url.pathname === '/og.png' ? '/public/og.png' : url.pathname
    const assetResponse = await env.ASSETS.fetch(
      assetRequest(request, requestedPath),
    )

    if (assetResponse.status !== 404) return assetResponse

    if (
      (request.method === 'GET' || request.method === 'HEAD') &&
      (appRoutes.has(url.pathname) || !url.pathname.includes('.'))
    ) {
      return env.ASSETS.fetch(assetRequest(request, '/index.html'))
    }

    return assetResponse
  },
}
