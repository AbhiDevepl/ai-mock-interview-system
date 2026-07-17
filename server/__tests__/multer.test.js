import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { upload } from '../middleware/multer.js';

const app = express();
app.post('/test-upload', upload.single('resume'), (req, res) => {
  res.status(200).json({ filename: req.file?.filename });
});

app.use((err, req, res, next) => {
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File exceeds the 5MB size limit." });
  }
  return res.status(500).json({ message: "Internal server error." });
});

describe('Multer File Upload and Restrictions', () => {
  afterAll(() => {
    const directory = 'public';
    if (fs.existsSync(directory)) {
      const files = fs.readdirSync(directory);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(directory, file));
        }
      }
    }
  });

  it('should accept valid PDF files', async () => {
    const buffer = Buffer.from('%PDF-1.4 dummy pdf content');
    const response = await request(app)
      .post('/test-upload')
      .attach('resume', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(200);
    expect(response.body.filename).toBeDefined();
    expect(response.body.filename).toMatch(/\.pdf$/i);
  });

  it('should reject non-PDF files', async () => {
    const buffer = Buffer.from('plain text content');
    const response = await request(app)
      .post('/test-upload')
      .attach('resume', buffer, { filename: 'resume.txt', contentType: 'text/plain' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Only PDF files are allowed');
  });

  it('should reject files exceeding the 5MB limit', async () => {
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024); // 5MB + 1KB
    const response = await request(app)
      .post('/test-upload')
      .attach('resume', largeBuffer, { filename: 'large.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('File exceeds the 5MB size limit.');
  });
});
