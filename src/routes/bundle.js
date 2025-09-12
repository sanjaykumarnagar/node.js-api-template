const express = require('express');
const path = require('path');
const archiver = require('archiver');

const router = express.Router();

router.get('/bundle.zip', (req, res) => {
  const projectRoot = path.join(process.cwd());
  const filename = 'app-bundle.zip';

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    res.status(500).end(`Archive error: ${err.message}`);
  });

  archive.pipe(res);

  // Include everything except typical heavy/generated folders
  archive.glob('**/*', {
    cwd: projectRoot,
    ignore: [
      'node_modules/**',
      '.git/**',
      'data/**',
      'package-lock.json',
    ],
    dot: true,
  });

  archive.finalize();
});

module.exports = router;