const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = 9090;
const DB_FILE = path.join(__dirname, 'db.json');
const QR_DIR = path.join(__dirname, 'qrcodes');

// cascadeflow Simulated Outage State
let outageMode = false;

// Middleware
app.use(compression()); // Enable Gzip compression
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use('/qrcodes', express.static(QR_DIR));

// Initial Database
const getDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return { 
      users: [], 
      locations: [], 
      assets: [], 
      issues: [], 
      marks: [], 
      attendance: [],
      aiAuditLogs: []
    };
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE));
  if (!db.aiAuditLogs) db.aiAuditLogs = [];
  return db;
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

// --- cascadeflow Routing Logic Helper ---
const routeWithCascadeflow = (description, hasImage) => {
  const text = description.toLowerCase();
  
  // 1. Quality-based/Security Escalation check
  const safetyKeywords = ['shock', 'wire', 'fire', 'smoke', 'short circuit', 'danger', 'collapse', 'structural', 'emergency', 'gas leak'];
  const hasSafetyCritical = safetyKeywords.some(keyword => text.includes(keyword));

  // Primary model routing decision based on complexity & media
  let primaryModel = "Llama 3 8B (Lightweight)";
  let whyChosen = "Simple category classification, routed to lightweight cheap model to optimize costs.";
  let latencyMs = Math.floor(Math.random() * 40) + 40; // 40-80ms
  let costUsd = 0.00001; 

  if (hasSafetyCritical) {
    primaryModel = "Gemini 1.5 Ultra (Expert Reasoning)";
    whyChosen = "Safety-critical anomaly detected in text. Escalated to Expert model for emergency protocol clearance.";
    latencyMs = Math.floor(Math.random() * 300) + 900; // 900-1200ms
    costUsd = 0.01500;
  } else if (hasImage) {
    primaryModel = "Gemini 1.5 Pro (Advanced Vision)";
    whyChosen = "Image attachment detected. Routed to high-fidelity Vision model to verify physical damage.";
    latencyMs = Math.floor(Math.random() * 200) + 450; // 450-650ms
    costUsd = 0.00250;
  } else if (text.split(' ').length > 20) {
    primaryModel = "Gemini 3 Flash (Standard Logic)";
    whyChosen = "High description length and word complexity. routed to balanced Flash model for low-latency reasoning.";
    latencyMs = Math.floor(Math.random() * 80) + 120; // 120-200ms
    costUsd = 0.00015;
  }

  // 2. Fallback Logic: if outageMode is enabled, the primary model "fails"
  if (outageMode) {
    const backupModel = hasImage ? "GPT-4o Vision (Fallback)" : "Claude 3.5 Sonnet (Fallback)";
    const fallbackLatency = latencyMs + (Math.floor(Math.random() * 150) + 100); // Add timeout overhead
    const fallbackCost = costUsd + 0.0050; // Backup cost overhead
    
    return {
      selectedModel: backupModel,
      routingReason: `CRITICAL OUTAGE: Primary model [${primaryModel}] timed out/failed. cascadeflow fallback route dynamically activated backup model [${backupModel}].`,
      latencyMs: fallbackLatency,
      costUsd: parseFloat(fallbackCost.toFixed(5)),
      status: "Fallback",
      primaryModel: primaryModel,
      escalated: true
    };
  }

  return {
    selectedModel: primaryModel,
    routingReason: whyChosen,
    latencyMs: latencyMs,
    costUsd: costUsd,
    status: hasSafetyCritical ? "Escalated" : "Success",
    primaryModel: primaryModel,
    escalated: hasSafetyCritical
  };
};

// --- Hindsight Memory Analyzer Helper ---
const analyzeHindsightMemory = (locationId, category, issues) => {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Filter unresolved issues at this location in the last 2 months
  const locIssues = issues.filter(i => 
    i.locationId === locationId && 
    new Date(i.createdAt) >= twoMonthsAgo
  );

  const totalLocHistory = issues.filter(i => i.locationId === locationId).length;
  
  // Categorize historical failures
  const catCounts = {
    classroom: locIssues.filter(i => i.category === 'classroom').length,
    laboratory: locIssues.filter(i => i.category === 'laboratory').length,
    washroom: locIssues.filter(i => i.category === 'washroom').length,
    water: locIssues.filter(i => i.category === 'water').length,
    electricity: locIssues.filter(i => i.category === 'electricity').length,
    cctv: locIssues.filter(i => i.category === 'cctv').length,
    playground: locIssues.filter(i => i.category === 'playground').length,
    attendance_infra: locIssues.filter(i => i.category === 'attendance_infra').length,
    computer_lab: locIssues.filter(i => i.category === 'computer_lab').length,
    bus: locIssues.filter(i => i.category === 'bus').length,
    fire_safety: locIssues.filter(i => i.category === 'fire_safety').length,
    furniture: locIssues.filter(i => i.category === 'furniture').length,
    other: locIssues.filter(i => i.category === 'other').length
  };

  const currentCategoryCount = catCounts[category] || 0;
  
  // Infrastructure Risk score calculation (0 - 100)
  // Base risk starts at 10, increases with unresolved issue counts
  let riskScore = 15;
  const unresolvedIssues = locIssues.filter(i => i.status !== 'Completed' && i.status !== 'Verified');
  
  unresolvedIssues.forEach(i => {
    if (i.priority === 'Critical') riskScore += 20;
    else if (i.priority === 'Warning') riskScore += 10;
    else riskScore += 5;
  });
  
  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  let riskLevel = "Stable";
  if (riskScore >= 75) riskLevel = "High Risk";
  else if (riskScore >= 40) riskLevel = "Medium Risk";
  else if (riskScore >= 20) riskLevel = "Low Risk";

  // Create memory-based insights
  let memoryInsight = "";
  if (currentCategoryCount >= 3) {
    memoryInsight = `Hindsight Memory: This zone is suffering from repeating issues. There have been ${currentCategoryCount} complaints about ${category} here recently.`;
  } else if (unresolvedIssues.length > 0) {
    memoryInsight = `Hindsight Memory: There are ${unresolvedIssues.length} unresolved maintenance issues active at this location.`;
  } else {
    memoryInsight = `Hindsight Memory: Location history is stable. No critical recurring trends detected.`;
  }

  // Generate smart recommendations based on recurring failure data
  let recommendation = "Perform routine maintenance and standard checks.";
  if (category === 'computer_lab' && catCounts.computer_lab >= 3) {
    recommendation = "URGENT IT OVERHAUL: Repeated IT infrastructure issues detected. Recommend full hardware diagnostics and network upgrade.";
  } else if (category === 'electricity' && catCounts.electricity >= 3) {
    recommendation = "SYSTEMIC BREAKER REPLACEMENT: Recurring electrical faults in this sector. Recommend complete load distribution audit and rewiring the main breaker board.";
  } else if (category === 'washroom' && catCounts.washroom >= 3) {
    recommendation = "SANITATION RECONSTRUCTION: Repeated complaints of washroom hygiene and plumbing. Recommend full demolition and deep cleaning/pipe replacement.";
  } else if (category === 'furniture' && catCounts.furniture >= 2) {
    recommendation = "FURNITURE REPLACEMENT: Recurring broken furniture reports. Recommend complete replacement of desks/chairs in this zone.";
  } else if (category === 'water' && catCounts.water >= 2) {
    recommendation = "PLUMBING RETROFIT: Repeated plumbing leaks or water shortages. Recommend line replacement to resolve material fatigue.";
  } else if (unresolvedIssues.length >= 4) {
    recommendation = "SITE AUDIT REQUIRED: High quantity of concurrent active maintenance issues. Suggest full-site facility survey and scheduling comprehensive cleanup.";
  }

  return {
    riskScore,
    riskLevel,
    memoryInsight,
    recommendation,
    totalHistoryCount: totalLocHistory,
    categoryHistoryCount: currentCategoryCount,
    catCounts
  };
};

// --- APIs ---

// 1. Report Issue (Real-time + cascadeflow Routing + Hindsight Memory)
app.post('/api/issues', (req, res) => {
  const db = getDB();
  const { title, description, category = 'General', locationId, reportedBy, image, severity } = req.body;
  
  if (!locationId) {
    return res.status(400).json({ message: "LocationId is required." });
  }

  const hasImage = !!image;
  
  // A. Execute cascadeflow Routing Engine
  const routingDecision = routeWithCascadeflow(description, hasImage);
  
  // Determine Priority (If escalated, priority is Critical; otherwise use determined priority or severity)
  let finalPriority = severity || 'Warning';
  if (routingDecision.escalated) {
    finalPriority = 'Critical';
  } else {
    // If not manually specified, classify using our lightweight severity keyword engine
    const textLower = description.toLowerCase();
    if (textLower.includes('spark') || textLower.includes('fire') || textLower.includes('flood') || textLower.includes('shock')) {
      finalPriority = 'Critical';
    } else if (textLower.includes('broken') || textLower.includes('leak') || textLower.includes('crack')) {
      finalPriority = 'Warning';
    } else {
      finalPriority = 'Low';
    }
  }

  // B. Execute Hindsight Memory Engine
  const hindsightData = analyzeHindsightMemory(locationId, category.toLowerCase(), db.issues || []);

  const newIssue = {
    id: uuidv4(),
    title: title || `${category.toUpperCase()} - ${description.substring(0, 22)}...`,
    description,
    category: category || 'General',
    locationId,
    reportedBy: reportedBy || 'User',
    beforeImage: image || null,
    afterImage: null,
    status: 'Reported', // Reported -> Assigned -> In Progress -> Completed -> Verified
    priority: finalPriority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // Persistent Hindsight Memory Fields
    hindsightRiskScore: hindsightData.riskScore,
    hindsightRiskLevel: hindsightData.riskLevel,
    hindsightInsight: hindsightData.memoryInsight,
    aiRecommendation: hindsightData.recommendation
  };

  if (!db.issues) db.issues = [];
  db.issues.push(newIssue);
  
  // C. Create Audit Log
  const newAuditLog = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    inputLength: description.length,
    category: category,
    hasImage: hasImage,
    selectedModel: routingDecision.selectedModel,
    routingReason: routingDecision.routingReason,
    latencyMs: routingDecision.latencyMs,
    costUsd: routingDecision.costUsd,
    status: routingDecision.status
  };

  db.aiAuditLogs.push(newAuditLog);
  saveDB(db);
  
  // D. Emit real-time Socket updates
  io.emit('newIssue', newIssue);
  io.emit('newAuditLog', newAuditLog);
  
  res.status(201).json({
    issue: newIssue,
    auditLog: newAuditLog
  });
});

// 2. Fetch Hindsight Memory Insights for all Locations
app.get('/api/hindsight/insights', (req, res) => {
  const db = getDB();
  const result = db.locations.map(loc => {
    const analysis = analyzeHindsightMemory(loc.id, 'electricity', db.issues || []); // Default category search
    return {
      locationId: loc.id,
      locationName: loc.name,
      x: loc.x,
      y: loc.y,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      totalIssues: analysis.totalHistoryCount,
      unresolvedCount: (db.issues || []).filter(i => i.locationId === loc.id && i.status !== 'Completed' && i.status !== 'Verified').length,
      categoryBreakdown: analysis.catCounts,
      topRecommendation: analysis.recommendation
    };
  });
  res.json(result);
});

// 3. Fetch History and Detailed Hindsight Memory for a single location
app.get('/api/hindsight/memory/:locationId', (req, res) => {
  const db = getDB();
  const locationId = req.params.locationId;
  const loc = db.locations.find(l => l.id === locationId);
  
  if (!loc) return res.status(404).json({ message: 'Location not found' });
  
  const history = db.issues.filter(i => i.locationId === locationId);
  const analysis = analyzeHindsightMemory(locationId, 'general', db.issues || []);

  res.json({
    location: loc,
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    recommendation: analysis.recommendation,
    insights: analysis.memoryInsight,
    categoryBreakdown: analysis.catCounts,
    history: history
  });
});

// 4. cascadeflow Audit Logs
app.get('/api/cascadeflow/audit-logs', (req, res) => {
  const db = getDB();
  res.json(db.aiAuditLogs || []);
});

// 5. Toggle cascadeflow simulated model outage
app.post('/api/cascadeflow/toggle-outage', (req, res) => {
  outageMode = req.body.enabled === true;
  console.log(`[cascadeflow] Model Outage Mode toggled to: ${outageMode}`);
  io.emit('outageModeChanged', { enabled: outageMode });
  res.json({ success: true, outageMode: outageMode });
});

// 6. Clear Audit Logs
app.post('/api/cascadeflow/clear-logs', (req, res) => {
  const db = getDB();
  db.aiAuditLogs = [];
  saveDB(db);
  io.emit('auditLogsCleared');
  res.json({ success: true, message: "AI Audit logs cleared." });
});

// 7. Get outage mode
app.get('/api/cascadeflow/outage-mode', (req, res) => {
  res.json({ outageMode: outageMode });
});

// 8. Update Status (Lifecycle Tracking)
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

// 9. Fetch History (For QR Scanning)
app.get('/api/locations/:id/history', (req, res) => {
  const db = getDB();
  const history = db.issues.filter(i => i.locationId === req.params.id);
  res.json(history);
});

// Basic Gets
app.get('/api/issues', (req, res) => res.json(getDB().issues));
app.get('/api/locations', (req, res) => res.json(getDB().locations));

// 10. Clear All Issues
app.delete('/api/issues', (req, res) => {
  const db = getDB();
  db.issues = [];
  db.aiAuditLogs = [];
  saveDB(db);
  io.emit('allIssuesCleared');
  res.json({ message: 'All issues and AI logs cleared' });
});

// 11. Submit Marks
app.post('/api/marks', (req, res) => {
  const db = getDB();
  if (!db.marks) db.marks = [];
  const newMark = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString() };
  db.marks.push(newMark);
  saveDB(db);
  io.emit('newMarkAdded', newMark);
  res.status(201).json(newMark);
});

// 12. Submit Attendance
app.post('/api/attendance', (req, res) => {
  const db = getDB();
  if (!db.attendance) db.attendance = [];
  const entries = req.body; // Expecting array of entries
  db.attendance = [...(db.attendance || []), ...entries.map(e => ({ ...e, id: uuidv4(), createdAt: new Date().toISOString() }))];
  saveDB(db);
  io.emit('attendanceUpdated');
  res.status(201).json({ message: 'Attendance recorded' });
});

// 13. Get Student Data
app.get('/api/students/:username/marks', (req, res) => {
  const db = getDB();
  const marks = (db.marks || []).filter(m => m.student === req.params.username);
  res.json(marks);
});

app.get('/api/students/:username/attendance', (req, res) => {
  const db = getDB();
  const attendance = (db.attendance || []).filter(a => a.student === req.params.username);
  res.json(attendance);
});

// Real-time connections
io.on('connection', (socket) => {
  console.log('Client connected to Real-Time AI Engine');
  socket.emit('outageModeChanged', { enabled: outageMode });
});

server.listen(PORT, () => {
  console.log(`System Engineer Real-Time AI Server at http://localhost:${PORT}`);
});
