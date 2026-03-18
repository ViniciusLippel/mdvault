const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const VAULT_DIR = path.join(__dirname, 'vault');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure vault directory exists
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

function buildTree(dirPath, relativePath = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const items = [];

  const dirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter(e => e.isFile() && e.name.endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of dirs) {
    const rel = relativePath ? `${relativePath}/${dir.name}` : dir.name;
    items.push({
      type: 'folder',
      name: dir.name,
      path: rel,
      children: buildTree(path.join(dirPath, dir.name), rel),
    });
  }

  for (const file of files) {
    const rel = relativePath ? `${relativePath}/${file.name}` : file.name;
    items.push({
      type: 'file',
      name: file.name.replace(/\.md$/, ''),
      path: rel,
    });
  }

  return items;
}

// GET /api/tree — returns file tree
app.get('/api/tree', (req, res) => {
  try {
    res.json(buildTree(VAULT_DIR));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/file?path=... — read a file
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  const abs = path.join(VAULT_DIR, filePath);
  if (!abs.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });

  try {
    const content = fs.readFileSync(abs, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(404).json({ error: 'file not found' });
  }
});

// PUT /api/file — write a file
app.put('/api/file', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  const abs = path.join(VAULT_DIR, filePath);
  if (!abs.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });

  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content !== undefined ? content : '', 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/file — create a new file
app.post('/api/file', (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  const abs = path.join(VAULT_DIR, filePath.endsWith('.md') ? filePath : filePath + '.md');
  if (!abs.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });

  try {
    if (fs.existsSync(abs)) return res.status(409).json({ error: 'file already exists' });
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const name = path.basename(abs, '.md');
    fs.writeFileSync(abs, `# ${name}\n\n`, 'utf8');
    res.json({ ok: true, path: path.relative(VAULT_DIR, abs) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/file — delete a file
app.delete('/api/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  const abs = path.join(VAULT_DIR, filePath);
  if (!abs.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });

  try {
    fs.rmSync(abs, { recursive: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/folder — create a new folder
app.post('/api/folder', (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'path required' });

  const abs = path.join(VAULT_DIR, folderPath);
  if (!abs.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });

  try {
    if (fs.existsSync(abs)) return res.status(409).json({ error: 'folder already exists' });
    fs.mkdirSync(abs, { recursive: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rename — rename/move a file or folder
app.post('/api/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ error: 'oldPath and newPath required' });

  const absOld = path.join(VAULT_DIR, oldPath);
  const absNew = path.join(VAULT_DIR, newPath);
  if (!absOld.startsWith(VAULT_DIR) || !absNew.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });

  try {
    fs.renameSync(absOld, absNew);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`mdvault running at http://localhost:${PORT}`);
});
