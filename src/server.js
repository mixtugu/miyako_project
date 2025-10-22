// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distPath = path.join(__dirname, 'dist');

// 정적 파일 서빙
app.use(express.static(distPath));

// 헬스체크
app.get('/health', (_req, res) => res.status(200).send('OK'));

// SPA 라우팅(react-router-dom): dist 안의 실제 파일이 아니면 index.html 반환
app.get('*', (req, res) => {
  // 정적 파일로 존재하면 그대로 서빙
  const filePath = path.join(distPath, req.path);
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.sendFile(filePath, err => {
      if (err) res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  return res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});