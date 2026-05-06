const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = 9090;
const DB_FILE = path.join(__dirname, 'db.json');
const QR_DIR = path.join(__dirname, 'qrcodes');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use('/qrcodes', express.static(QR_DIR));

// Initial Database
const getDB = () => {
  if (!fs.existsSync(DB_FILE)) return { users: [], locations: [], assets: [], issues: [] };
  return JSON.parse(fs.readFileSync(DB_FILE));
};
const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Generate QR Codes for all locations
const generateQRs = async () => {
  const db = getDB();
  for (const loc of db.locations) {
    const qrPath = path.join(QR_DIR, `${loc.id}.png`);
    if (!fs.existsSync(qrPath)) {
      await QRCode.toFile(qrPath, JSON.stringify({ type: 'location', id: loc.id, name: loc.name }));
      console.log(`Generated QR for ${loc.name}`);
    }
  }
};
generateQRs();

// --- APIs ---

// 1. Report Issue (Real-time + Predictive Check)
app.post('/api/issues', (req, res) => {
  const db = getDB();
  const { title, description, category, locationId, reportedBy, image, severity = 'Warning' } = req.body;
  
  const loc = db.locations.find(l => l.id === locationId) || { x: 0, y: 0, importance: 1 };
  
  const newIssue = {
    id: uuidv4(),
    title,
    description,
    category: category || 'General',
    locationId,
    reportedBy,
    beforeImage: image || null,
    afterImage: null,
    status: 'Reported', // Reported -> Assigned -> In Progress -> Completed -> Verified
    priority: severity,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.issues.push(newIssue);
  
  // Predictive Maintenance Check
  const assetIssues = db.issues.filter(i => i.locationId === locationId && i.category === category).length;
  if (assetIssues >= 3) {
    newIssue.predictiveAlert = `High Risk: ${category} issues occurred ${assetIssues} times here recently.`;
  }

  saveDB(db);
  
  // Emit real-time update
  io.emit('newIssue', newIssue);
  
  res.status(201).json(newIssue);
});

// 2. Update Status (Lifecycle Tracking)
app.patch('/api/issues/:id/status', (req, res) => {
  const db = getDB();
  const { status, afterImage } = req.body;
  const issue = db.issues.find(i => i.id === req.params.id);
  
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  
  issue.status = status;
  if (afterImage) issue.afterImage = afterImage;
  issue.updatedAt = new Date().toISOString();
  
  saveDB(db);
  io.emit('issueUpdated', issue);
  res.json(issue);
});

// 3. Fetch History (For QR Scanning)
app.get('/api/locations/:id/history', (req, res) => {
  const db = getDB();
  const history = db.issues.filter(i => i.locationId === req.params.id);
  res.json(history);
});

// Basic Gets
app.get('/api/issues', (req, res) => res.json(getDB().issues));
app.get('/api/locations', (req, res) => res.json(getDB().locations));

// Real-time connections
io.on('connection', (socket) => {
  console.log('Client connected to Real-Time Engine');
});

server.listen(PORT, () => {
  console.log(`System Engineer Real-Time Server at http://localhost:${PORT}`);
});
