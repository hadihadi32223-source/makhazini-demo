import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProductionMode = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
process.env.NODE_ENV = isProductionMode ? 'production' : 'development';

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'development') {
  process.env.AUTH_SECRET = 'development-only-auth-secret-change-before-production-64-characters-long';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON request body'));
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res) {
  const parsed = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const apiName = parsed.pathname.replace(/^\/api\//, '').replace(/\.js$/, '');
  const apiFile = path.join(__dirname, 'api', `${apiName}.js`);
  if (!fs.existsSync(apiFile)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: `API route not found: ${parsed.pathname}` }));
    return;
  }

  try {
    req.query = Object.fromEntries(parsed.searchParams.entries());
    req.body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '') ? await readBody(req) : {};

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (payload) => {
      if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
    };

    const moduleUrl = `${pathToFileURL(apiFile).href}?t=${Date.now()}`;
    const module = await import(moduleUrl);
    await module.default(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}

function sendStatic(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const distDir = path.join(__dirname, 'dist');
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(distDir, safePath);

  if (url.pathname === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Build not found. Run npm run build first, or use npm run dev.');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };
  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

const vite = !isProductionMode
  ? await import('vite').then(({ createServer }) => createServer({ server: { middlewareMode: true }, appType: 'spa' }))
  : null;

const server = http.createServer(async (req, res) => {
  if ((req.url || '').startsWith('/api/')) {
    await handleApi(req, res);
    return;
  }
  if (vite) {
    vite.middlewares(req, res);
    return;
  }
  sendStatic(req, res);
});

const port = Number(process.env.PORT || 5173);
server.listen(port, () => {
  console.log(`WMS running at http://localhost:${port}`);
});
