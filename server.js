import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getServerApiUrl } from './src/utils/getApiUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 API URL: ${process.env.VITE_EXTERNAL_API_URL || '/api.php (relative to current host)'}`);
});
