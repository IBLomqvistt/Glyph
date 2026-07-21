import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const debugOrigin = 'http://127.0.0.1:9222'
const appOrigin = 'http://127.0.0.1:4173'
const screenshotDirectory = 'artifacts/screenshots'

class CdpClient {
  #id = 0
  #pending = new Map()
  #listeners = new Map()

  constructor(url) {
    this.socket = new WebSocket(url)
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const pending = this.#pending.get(message.id)
        if (!pending) return
        this.#pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result)
        return
      }
      const listeners = this.#listeners.get(message.method) ?? []
      listeners.forEach((listener) => listener(message.params))
      this.#listeners.delete(message.method)
    })
  }

  async call(method, params = {}) {
    await this.ready
    const id = ++this.#id
    const result = new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject })
    })
    this.socket.send(JSON.stringify({ id, method, params }))
    return result
  }

  once(method) {
    return new Promise((resolve) => {
      this.#listeners.set(method, [resolve])
    })
  }

  close() {
    this.socket.close()
  }
}

async function evaluate(client, expression) {
  const result = await client.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text)
  }
  return result.result.value
}

async function navigate(client, path) {
  const loaded = client.once('Page.loadEventFired')
  await client.call('Page.navigate', { url: `${appOrigin}${path}` })
  await loaded
  await new Promise((resolve) => setTimeout(resolve, 250))
}

async function setViewport(client, width, height) {
  await client.call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  })
}

async function capture(client, filename, selector) {
  let clip
  if (selector) {
    clip = await evaluate(
      client,
      `(() => {
        const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect()
        return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height, scale: 1 }
      })()`,
    )
  } else {
    const metrics = await client.call('Page.getLayoutMetrics')
    clip = {
      x: 0,
      y: 0,
      width: metrics.cssContentSize.width,
      height: metrics.cssContentSize.height,
      scale: 1,
    }
  }
  const screenshot = await client.call('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip,
  })
  await writeFile(
    `${screenshotDirectory}/${filename}`,
    Buffer.from(screenshot.data, 'base64'),
  )
}

await mkdir(screenshotDirectory, { recursive: true })
const page = await fetch(`${debugOrigin}/json/new?about:blank`, {
  method: 'PUT',
}).then((response) => response.json())
const client = new CdpClient(page.webSocketDebuggerUrl)
await client.ready
await client.call('Page.enable')
await client.call('Runtime.enable')
await client.call('Log.enable')

const browserErrors = []
client.socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') {
    browserErrors.push(message.params.exceptionDetails.text)
  }
  if (
    message.method === 'Log.entryAdded' &&
    ['error', 'warning'].includes(message.params.entry.level)
  ) {
    browserErrors.push(message.params.entry.text)
  }
})

await setViewport(client, 1600, 1100)
await navigate(client, '/layers/models')
assert.equal(await evaluate(client, 'document.title'), 'Models · Glyph')
assert.match(
  await evaluate(client, 'document.body.innerText'),
  /Kimi K3: Open Frontier Intelligence/,
)
assert.equal(
  await evaluate(
    client,
    'document.querySelector(".model-card")?.dataset.paperId',
  ),
  'kimi-k3-open-frontier-intelligence',
)
assert.equal(
  await evaluate(
    client,
    'document.querySelector(".relevance-score strong")?.textContent',
  ),
  '87.6',
)
assert.deepEqual(
  await evaluate(
    client,
    `(() => {
      const link = document.querySelector('.external-link')
      return { href: link.href, target: link.target }
    })()`,
  ),
  { href: 'https://www.kimi.com/blog/kimi-k3', target: '_blank' },
)
assert.equal(
  await evaluate(
    client,
    '/processing|running|queued|parsing/i.test(document.querySelector("main").innerText)',
  ),
  false,
)
await capture(client, 'models-category.png')
await capture(client, 'kimi-detail-panel.png', '.details-panel')
await evaluate(client, 'document.querySelector("[data-kimi-bookmark]").click()')
assert.equal(
  await evaluate(
    client,
    'document.querySelector("[data-kimi-bookmark]").getAttribute("aria-pressed")',
  ),
  'true',
)

const cardNavigation = client.once('Page.loadEventFired')
await evaluate(client, 'document.querySelector(".model-card-body").click()')
await cardNavigation
assert.equal(
  await evaluate(client, 'location.pathname'),
  '/reader/kimi-k3-open-frontier-intelligence',
)
await evaluate(
  client,
  'document.querySelector("[data-kimi-claim=claim-model-scale]").click()',
)
await evaluate(
  client,
  'document.querySelector("[data-kimi-claim=claim-stable-latent-moe]").click()',
)
assert.equal(
  await evaluate(
    client,
    'document.querySelector(".pdf-toolbar strong").textContent',
  ),
  'Page 4 · An Open 3T-Class Model',
)
assert.match(
  await evaluate(
    client,
    'document.querySelector(".pdf-evidence-card").innerText',
  ),
  /16 out of 896 experts/,
)
assert.ok(
  (await evaluate(
    client,
    'document.querySelectorAll(".pdf-highlight").length',
  )) > 0,
)
await capture(client, 'reader-evidence-highlight.png', '.pdf-evidence-card')

await evaluate(
  client,
  'document.querySelector("[data-kimi-reader-view=report]").click()',
)
assert.equal(await evaluate(client, 'location.search'), '?view=report')
assert.match(
  await evaluate(
    client,
    'document.querySelector("#kimi-reader-workspace").innerText',
  ),
  /supplied provisional launch analysis/i,
)
await evaluate(
  client,
  `new Promise((resolve, reject) => {
    const started = Date.now()
    const timer = setInterval(() => {
      const title = document.querySelector('.report-frame')?.contentDocument?.title
      if (title) {
        clearInterval(timer)
        resolve(title)
      } else if (Date.now() - started > 5000) {
        clearInterval(timer)
        reject(new Error('Embedded report did not load'))
      }
    }, 50)
  })`,
)
assert.equal(
  await evaluate(
    client,
    'document.querySelector(".report-frame").contentDocument.title',
  ),
  'Glyph №1: Kimi K3 launch analysis',
)
await capture(client, 'reader-full-report.png', '#kimi-reader-workspace')

await setViewport(client, 390, 844)
await navigate(client, '/layers/models')
assert.equal(
  await evaluate(client, 'document.documentElement.scrollWidth <= innerWidth'),
  true,
)
assert.match(
  await evaluate(client, 'document.querySelector("main").innerText'),
  /very high relevance/i,
)

assert.deepEqual(browserErrors, [])
client.close()

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      routes: ['/layers/models', '/reader/kimi-k3-open-frontier-intelligence'],
      interaction:
        'claim-stable-latent-moe -> page 4 highlight -> embedded launch analysis',
      screenshots: [
        `${screenshotDirectory}/models-category.png`,
        `${screenshotDirectory}/kimi-detail-panel.png`,
        `${screenshotDirectory}/reader-evidence-highlight.png`,
        `${screenshotDirectory}/reader-full-report.png`,
      ],
    },
    null,
    2,
  ),
)
