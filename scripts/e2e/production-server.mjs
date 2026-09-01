import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const distRoot = resolve(root, 'dist');
const host = '127.0.0.1';
const port = 4321;
const buildEntrypoint = resolve(root, 'scripts', 'build.mjs');

const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

const runProductionBuild = async () => {
  await access(buildEntrypoint);

  await new Promise((resolveBuild, rejectBuild) => {
    const build = spawn(process.execPath, [buildEntrypoint], {
      cwd: root,
      env: process.env,
      stdio: 'inherit'
    });
    build.once('error', rejectBuild);
    build.once('exit', (code, signal) => {
      if (code === 0) {
        resolveBuild();
        return;
      }
      rejectBuild(
        new Error(
          `production build failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }.`
        )
      );
    });
  });

  await access(distRoot);
};

const resolveArtifact = (pathname) => {
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const requestedArtifact =
    decodedPathname === '/'
      ? '/index.html'
      : decodedPathname.endsWith('/')
        ? `${decodedPathname}index.html`
        : decodedPathname;

  const artifactPath = resolve(distRoot, `.${requestedArtifact}`);
  const relativePath = relative(distRoot, artifactPath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return artifactPath;
};

const sendPlainResponse = (response, statusCode, message) => {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.end(message);
};

const serveArtifact = async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    sendPlainResponse(response, 405, 'Method not allowed');
    return;
  }

  const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
  const artifactPath = resolveArtifact(requestUrl.pathname);
  if (!artifactPath) {
    sendPlainResponse(response, 404, 'Not found');
    return;
  }

  try {
    const artifact = await stat(artifactPath);
    if (!artifact.isFile()) {
      sendPlainResponse(response, 404, 'Not found');
      return;
    }
  } catch {
    sendPlainResponse(response, 404, 'Not found');
    return;
  }

  response.statusCode = 200;
  response.setHeader(
    'Content-Type',
    mimeTypes[extname(artifactPath).toLowerCase()] ?? 'application/octet-stream'
  );
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const stream = createReadStream(artifactPath);
  stream.once('error', (error) => {
    console.error(
      'Production browser server failed while reading an artifact.',
      error
    );
    if (!response.headersSent) {
      sendPlainResponse(response, 500, 'Internal server error');
      return;
    }
    response.destroy(error);
  });
  stream.pipe(response);
};

await runProductionBuild();

const server = createServer((request, response) => {
  void serveArtifact(request, response).catch((error) => {
    console.error('Production browser server request failed.', error);
    if (!response.headersSent) {
      sendPlainResponse(response, 500, 'Internal server error');
      return;
    }
    response.destroy(error);
  });
});

server.once('error', (error) => {
  console.error('Production browser server failed to listen.', error);
  process.exitCode = 1;
  process.exit();
});

let closing = false;
const closeServer = (signal) => {
  if (closing) return;
  closing = true;
  server.close((error) => {
    if (error) {
      console.error(
        `Production browser server failed during ${signal} cleanup.`,
        error
      );
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => closeServer('SIGTERM'));
process.on('SIGINT', () => closeServer('SIGINT'));

server.listen(port, host, () => {
  console.log(
    `Production browser server listening at http://${host}:${port}/404.html`
  );
});
