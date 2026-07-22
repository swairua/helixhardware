import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.all('/api.php', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  const upstreamSetting = process.env.API_UPSTREAM_URL;

  if (!upstreamSetting) {
    res.status(502).json({ message: 'API service is unavailable. Please try again later.' });
    return;
  }

  let upstreamUrl;
  try {
    upstreamUrl = new URL(upstreamSetting);
  } catch {
    res.status(502).json({ message: 'API service is unavailable. Please try again later.' });
    return;
  }

  const requestUrl = new URL(req.originalUrl, 'http://app.local');
  for (const [key, value] of requestUrl.searchParams) {
    upstreamUrl.searchParams.append(key, value);
  }

  const headers = {};
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (req.headers.authorization) headers.authorization = req.headers.authorization;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: req.body.length > 0 ? req.body : undefined,
    });
    const contentType = upstreamResponse.headers.get('content-type');

    if (contentType) res.set('Content-Type', contentType);
    res.status(upstreamResponse.status).send(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch {
    res.status(502).json({ message: 'API service is unavailable. Please try again later.' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
