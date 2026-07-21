export const routes = [
  { id: 'discover', label: 'Discover', eyebrow: '01' },
  { id: 'paper', label: 'Paper', eyebrow: '02' },
  { id: 'report', label: 'Brief', eyebrow: '03' },
  { id: 'evidence', label: 'Evidence', eyebrow: '04' },
  { id: 'concepts', label: 'Concepts', eyebrow: '05' },
  { id: 'market', label: 'Market', eyebrow: '06' },
  { id: 'review', label: 'Review', eyebrow: '07' },
  { id: 'feedback', label: 'Feedback', eyebrow: '08' },
]

export const defaultRoute = 'discover'

export const workedExampleRoutes = {
  landing: '/',
  login: '/login',
  product: '/#/discover',
  models: '/layers/models',
  reader: '/reader/kimi-k3-open-frontier-intelligence',
}

export function parseRoute(hash = '') {
  const [candidate, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const route = routes.some((item) => item.id === candidate)
    ? candidate
    : defaultRoute
  return { route, params: new URLSearchParams(query) }
}

export function routeHref(route, params = {}) {
  const query = new URLSearchParams(params).toString()
  return `#/${route}${query ? `?${query}` : ''}`
}

export function parseAppLocation(pathname = '/', hash = '', search = '') {
  if (pathname === workedExampleRoutes.landing && !hash) {
    return { route: 'landing', params: new URLSearchParams(search) }
  }
  if (pathname === workedExampleRoutes.login) {
    return { route: 'login', params: new URLSearchParams(search) }
  }
  if (pathname === workedExampleRoutes.models) {
    return { route: 'models', params: new URLSearchParams(search) }
  }
  if (pathname === workedExampleRoutes.reader) {
    return { route: 'kimi-reader', params: new URLSearchParams(search) }
  }
  return parseRoute(hash)
}
