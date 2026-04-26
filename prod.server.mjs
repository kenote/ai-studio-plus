import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 3000
const DIST = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '..', 'client')
  : path.join(__dirname, 'dist', 'client')

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url, true)

  if (pathname === '/health') {
    res.setHeader('Content-Type', 'text/plain')
    res.end('OK')
    return
  }

  let filePath = path.join(DIST, pathname)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, pathname, 'index.html')
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'spa.html')
  }
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404
    res.end('Not Found')
    return
  }

  const ext = path.extname(filePath)
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  res.setHeader('Cache-Control', 'public, max-age=31536000')
  res.end(fs.readFileSync(filePath))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})