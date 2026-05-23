const fs = require('fs');

// 1. Update server.js
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add Audit Log Middleware
const auditMiddleware = `
// Audit Logging Middleware
const trackAuditLog = (req, res, next) => {
  const originalSend = res.json;
  res.json = function(data) {
    res.json = originalSend;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
      if (!req.path.includes('/chat') && !req.path.includes('/cascadeflow') && !req.path.includes('/audit-logs')) {
        const db = getDB();
        if (!db.systemAuditLogs) db.systemAuditLogs = [];
        let action = req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE';
        let moduleAffected = 'General';
        if (req.path.includes('/issues') || req.path.includes('/tasks')) moduleAffected = 'Complaints/Maintenance';
        else if (req.path.includes('/marks')) moduleAffected = 'Exams';
        else if (req.path.includes('/attendance')) moduleAffected = 'Attendance';
        else if (req.path.includes('/alerts')) moduleAffected = 'Alerts';
        
        db.systemAuditLogs.push({
          id: require('uuid').v4(),
          timestamp: new Date().toISOString(),
          user: req.body.username || req.body.reportedBy || req.body.student || 'System Admin',
          actionType: action,
          module: moduleAffected,
          ip: req.ip || 'Unknown'
        });
        saveDB(db);
      }
    }
    return originalSend.call(this, data);
  };
  next();
};

app.use(trackAuditLog);
`;
if (!serverJs.includes('trackAuditLog')) {
  serverJs = serverJs.replace('app.use(bodyParser.json({ limit: \'50mb\' }));', 'app.use(bodyParser.json({ limit: \'50mb\' }));\n' + auditMiddleware);
}

// Add API Routes
const newRoutes = `
// System Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const db = getDB();
  res.json(db.systemAuditLogs || []);
});

// Update Task Status (Feature 4)
app.post('/api/tasks/update-status', (req, res) => {
  try {
    const db = getDB();
    const { taskID } = req.body;
    const issue = db.issues.find(i => i.id === taskID);
    if (!issue) return res.status(404).json({ message: 'Task not found' });
    
    issue.status = 'Active';
    issue.updatedAt = new Date().toISOString();
    saveDB(db);
    
    io.emit('TASK_STATUS_UPDATED', issue);
    res.json({ message: 'Task updated successfully', task: issue });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Global Infrastructure Alerts (Feature 5)
app.get('/api/alerts', (req, res) => {
  res.json(getDB().alerts || []);
});
app.post('/api/alerts', (req, res) => {
  try {
    const db = getDB();
    if (!db.alerts) db.alerts = [];
    const newAlert = { id: Date.now(), problem: req.body.problem, action: req.body.action, active: true };
    db.alerts.push(newAlert);
    saveDB(db);
    io.emit('BROADCAST_ALERT', db.alerts.filter(a => a.active));
    res.status(201).json(newAlert);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: "Server Error"});
  }
});
app.delete('/api/alerts/:id', (req, res) => {
  try {
    const db = getDB();
    if (db.alerts) {
      db.alerts = db.alerts.filter(a => a.id != req.params.id);
      saveDB(db);
      io.emit('BROADCAST_ALERT', db.alerts.filter(a => a.active));
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({error: "Server Error"}); }
});

// Global Contact Info (Feature 6)
app.get('/api/contact-info', (req, res) => {
  try {
    res.json(getDB().contact_info || []);
  } catch (err) { res.status(500).json([]); }
});
app.post('/api/contact-info', (req, res) => {
  try {
    const db = getDB();
    if (!db.contact_info) db.contact_info = [];
    const newContact = { id: Date.now(), name: req.body.name, number: req.body.number, designation: req.body.designation };
    db.contact_info.push(newContact);
    saveDB(db);
    res.status(201).json(newContact);
  } catch (err) { res.status(500).json([]); }
});
app.delete('/api/contact-info/:id', (req, res) => {
  try {
    const db = getDB();
    if (db.contact_info) {
      db.contact_info = db.contact_info.filter(c => c.id != req.params.id);
      saveDB(db);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({error: "Server Error"}); }
});

// Chatbot RAG (Feature 1)
app.post('/api/chat', (req, res) => {
  try {
    const db = getDB();
    const { query } = req.body;
    if (!query) return res.json({ response: "Please ask a question." });

    const q = query.toLowerCase();
    let response = "I couldn't find specific data for your query. Try asking about attendance, marks, or pending issues.";

    if (q.includes('attendance')) {
      const students = db.attendance ? [...new Set(db.attendance.map(a => a.student))] : [];
      let foundStudent = students.find(s => q.includes(s.toLowerCase().split(' ')[0]));
      if (foundStudent) {
        const records = db.attendance.filter(a => a.student === foundStudent);
        const present = records.filter(a => a.status === 'present').length;
        const rate = records.length ? Math.round((present / records.length) * 100) : 0;
        response = \`\${foundStudent} has an attendance rate of \${rate}% based on \${records.length} records.\`;
      } else {
        response = "I couldn't identify the student in your query. Please include their name.";
      }
    } else if (q.includes('mark') || q.includes('score') || q.includes('exam')) {
      const students = db.marks ? [...new Set(db.marks.map(m => m.student))] : [];
      let foundStudent = students.find(s => q.includes(s.toLowerCase().split(' ')[0]));
      if (foundStudent) {
        const records = db.marks.filter(m => m.student === foundStudent);
        const scores = records.map(m => \`\${m.subject} (\${m.value})\`).join(', ');
        response = \`\${foundStudent}'s recorded marks are: \${scores}.\`;
      } else {
        response = "I couldn't identify the student. Please include their name.";
      }
    } else if (q.includes('issue') || q.includes('maintenance') || q.includes('problem')) {
      const pending = (db.issues || []).filter(i => i.status !== 'Completed' && i.status !== 'Verified' && i.status !== 'Resolved');
      if (q.includes('electrical') || q.includes('electricity') || q.includes('power')) {
        const elec = pending.filter(i => i.category === 'electricity');
        response = elec.length > 0 ? \`There are \${elec.length} pending electrical issues.\` : "No pending electrical issues.";
      } else if (q.includes('water') || q.includes('plumbing') || q.includes('washroom')) {
        const water = pending.filter(i => i.category === 'water' || i.category === 'washroom');
        response = water.length > 0 ? \`There are \${water.length} pending water/washroom issues.\` : "No pending water/plumbing issues.";
      } else {
        response = \`There are currently \${pending.length} pending maintenance issues.\`;
      }
    }
    res.json({ response });
  } catch (err) {
    res.json({ response: "An error occurred while processing your request." });
  }
});
`;
if (!serverJs.includes('/api/tasks/update-status')) {
  serverJs = serverJs.replace('// 10. Clear All Issues', newRoutes + '\n// 10. Clear All Issues');
}

fs.writeFileSync('server.js', serverJs);

// 2. Update index1.html
let indexHtml = fs.readFileSync('index1.html', 'utf8');

// Add Audit Logs Button & Feature 5, 6 Buttons
const adminButtons = `
  <button class="export-btn" onclick="openAuditLogsModal()" style="margin-right: 10px;">📋 Audit Logs</button>
  <button class="export-btn" onclick="openAlertsModal()" style="margin-right: 10px; background: var(--danger); border-color: var(--danger);">🚨 Infrastructure Alert</button>
  <button class="export-btn" onclick="openContactsModal()">📞 Update Contacts</button>
`;
if (!indexHtml.includes('openAuditLogsModal')) {
  indexHtml = indexHtml.replace('<h3>📈 Admin Monitoring Dashboard</h3>', '<h3>📈 Admin Monitoring Dashboard</h3><div style="margin-bottom: 15px;">' + adminButtons + '</div>');
}

// Export CSV mapping
if (!indexHtml.includes('exportMaintenanceCSV')) {
  indexHtml = indexHtml.replace('onclick="exportMaintenance()"', 'onclick="exportMaintenanceCSV()"');
}

// Add Modals at the end of body
const modals = `
<!-- Feature 2: Audit Logs Modal -->
<div id="audit-logs-modal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
  <div class="modal-content" style="background: var(--bg-card); padding: 20px; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; color: var(--text-primary);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">System Audit Logs</h2>
      <button onclick="document.getElementById('audit-logs-modal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-primary);">×</button>
    </div>
    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
      <input type="text" id="audit-search" placeholder="Search logs..." oninput="filterAuditLogs()" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border-glass);" />
      <select id="audit-filter-action" onchange="filterAuditLogs()" style="padding: 8px; border-radius: 6px;">
        <option value="">All Actions</option>
        <option value="CREATE">CREATE</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
      </select>
    </div>
    <table class="att-table">
      <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>IP</th></tr></thead>
      <tbody id="audit-logs-body"></tbody>
    </table>
  </div>
</div>

<!-- Feature 5: Infrastructure Alerts Modal -->
<div id="alerts-modal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
  <div class="modal-content" style="background: var(--bg-card); padding: 20px; border-radius: 12px; width: 90%; max-width: 600px; color: var(--text-primary);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Manage Alerts</h2>
      <button onclick="document.getElementById('alerts-modal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-primary);">×</button>
    </div>
    <ul id="alerts-list" style="list-style: none; padding: 0; margin-bottom: 20px;"></ul>
    <h3 style="margin-top: 20px;">Add New Alert</h3>
    <form id="alert-form" onsubmit="submitAlert(event)">
      <input type="text" id="alert-problem" placeholder="Problem (e.g. Campus Water Leak)" required style="width: 100%; margin-bottom: 10px; padding: 10px; border-radius: 6px;" />
      <input type="text" id="alert-action" placeholder="Required Action (e.g. Evacuate Block A)" required style="width: 100%; margin-bottom: 10px; padding: 10px; border-radius: 6px;" />
      <button type="submit" class="submit-btn" style="width: 100%; background: var(--danger);">Broadcast Alert</button>
    </form>
  </div>
</div>

<!-- Global Toast for Alerts -->
<div id="global-alert-toast" style="display: none; position: fixed; top: 0; left: 0; width: 100%; background: var(--danger); color: white; padding: 15px; text-align: center; font-weight: bold; z-index: 2000; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
  🚨 <span id="global-alert-text">Alert</span>
</div>

<!-- Feature 6: Contacts Modal -->
<div id="contacts-modal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
  <div class="modal-content" style="background: var(--bg-card); padding: 20px; border-radius: 12px; width: 90%; max-width: 600px; color: var(--text-primary);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Manage Global Contacts</h2>
      <button onclick="document.getElementById('contacts-modal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-primary);">×</button>
    </div>
    <ul id="contacts-list-manage" style="list-style: none; padding: 0; margin-bottom: 20px;"></ul>
    <h3 style="margin-top: 20px;">Add New Contact</h3>
    <form id="contact-form" onsubmit="submitContact(event)">
      <input type="text" id="contact-name" placeholder="Name" required style="width: 100%; margin-bottom: 10px; padding: 10px; border-radius: 6px;" />
      <input type="text" id="contact-number" placeholder="Number" required style="width: 100%; margin-bottom: 10px; padding: 10px; border-radius: 6px;" />
      <input type="text" id="contact-designation" placeholder="Designation" required style="width: 100%; margin-bottom: 10px; padding: 10px; border-radius: 6px;" />
      <button type="submit" class="submit-btn" style="width: 100%;">Add Contact</button>
    </form>
  </div>
</div>

<!-- Global Footer for Contacts -->
<div id="global-footer" style="display: none; position: fixed; bottom: 0; left: 0; width: 100%; background: var(--bg-glass); backdrop-filter: blur(10px); padding: 10px; text-align: center; border-top: 1px solid var(--border-glass); z-index: 900;">
  <div id="footer-contacts" style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;"></div>
</div>
`;
if (!indexHtml.includes('audit-logs-modal')) {
  indexHtml = indexHtml.replace('</body>', modals + '\n</body>');
}
fs.writeFileSync('index1.html', indexHtml);

// 3. Update script1.js
let scriptJs = fs.readFileSync('script1.js', 'utf8');

// Replace Chatbot logic
const newChat = `async function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if(!msg) return;
  
  const chatBody = document.getElementById('chat-body');
  chatBody.innerHTML += \`<div class="chat-msg user"><p>\${msg}</p></div>\`;
  input.value = '';
  
  try {
    const res = await fetch(\`\${API_BASE}/chat\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: msg, username: currentUsername })
    });
    const data = await res.json();
    chatBody.innerHTML += \`<div class="chat-msg bot"><p>\${data.response}</p></div>\`;
    chatBody.scrollTop = chatBody.scrollHeight;
  } catch (err) {
    chatBody.innerHTML += \`<div class="chat-msg bot"><p>I'm sorry, I'm unable to reach the server right now.</p></div>\`;
  }
}`;

let startIdx = scriptJs.indexOf('function sendChatMessage(e) {');
if (startIdx !== -1) {
  let endIdx = scriptJs.indexOf('}', scriptJs.indexOf('setTimeout', startIdx));
  if (endIdx !== -1) {
     endIdx = scriptJs.indexOf('}', endIdx + 1); // get the outer closing brace
     if (endIdx !== -1 && !scriptJs.includes("fetch(`${API_BASE}/chat`")) {
       scriptJs = scriptJs.substring(0, startIdx) + newChat + scriptJs.substring(endIdx + 1);
     }
  }
}

// Add features logic
const featuresJS = `
// Feature 2: Audit Logs
let auditLogsData = [];
async function openAuditLogsModal() {
  document.getElementById('audit-logs-modal').style.display = 'flex';
  try {
    const res = await fetch(\`\${API_BASE}/audit-logs\`);
    auditLogsData = await res.json();
    filterAuditLogs();
  } catch (e) { console.error(e); }
}
function filterAuditLogs() {
  const search = document.getElementById('audit-search').value.toLowerCase();
  const actionFilter = document.getElementById('audit-filter-action').value;
  const filtered = auditLogsData.filter(log => {
    return (log.user.toLowerCase().includes(search) || log.module.toLowerCase().includes(search)) &&
           (!actionFilter || log.actionType === actionFilter);
  });
  const tbody = document.getElementById('audit-logs-body');
  tbody.innerHTML = '';
  filtered.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = \`<td>\${new Date(log.timestamp).toLocaleString()}</td><td>\${log.user}</td><td><span class="badge \${log.actionType === 'DELETE' ? 'badge-danger' : 'badge-info'}">\${log.actionType}</span></td><td>\${log.module}</td><td>\${log.ip}</td>\`;
    tbody.appendChild(tr);
  });
}

// Feature 3: Export CSV
function exportMaintenanceCSV() {
  fetch(\`\${API_BASE}/issues\`).then(res => res.json()).then(issues => {
    if (issues.length === 0) return showToast('⚠️', 'No maintenance tasks to export.');
    const rows = [['ID', 'Location', 'Status', 'Issue', 'Date']];
    issues.forEach(task => {
      rows.push([
        task.id, task.locationId || 'Area', task.status, (task.title || task.description).replace(/,/g, ''), new Date(task.createdAt).toLocaleDateString()
      ]);
    });
    downloadCSV(rows, \`Maintenance_Tasks_\${new Date().toISOString().slice(0,10)}.csv\`);
  });
}

// Feature 4: Surgical Repair of Start Button
function handleStartTask(taskID) {
  fetch(\`\${API_BASE}/tasks/update-status\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskID })
  }).then(res => res.json()).then(data => {
    if (data.task) showToast('🚀', 'Task started successfully!');
  }).catch(e => console.error(e));
}

// Listen for Task Updates
if (socket) {
  socket.on('TASK_STATUS_UPDATED', (issue) => {
    const li = document.querySelector(\`li[data-issue-id="\${issue.id}"]\`);
    if (li) {
      const btn = li.querySelector('.maint-card-footer button');
      if (btn && issue.status === 'Active') {
        btn.outerHTML = \`<span style="font-size: 0.75rem; color: var(--warning); font-weight: 700;">Active</span>\`;
      }
      const badgeArea = li.querySelector('.status-badge-area');
      if (badgeArea) badgeArea.innerHTML = \`<span class="badge badge-warning">Active</span>\`;
    } else {
      if(typeof loadMaintenanceReports === 'function') loadMaintenanceReports();
    }
  });
  
  // Feature 5
  socket.on('BROADCAST_ALERT', (alerts) => {
    if (alerts && alerts.length > 0) {
      document.getElementById('global-alert-toast').style.display = 'block';
      document.getElementById('global-alert-text').innerText = \`\${alerts[0].problem} - Action: \${alerts[0].action}\`;
    } else {
      document.getElementById('global-alert-toast').style.display = 'none';
    }
    if (document.getElementById('alerts-modal').style.display === 'flex') {
       openAlertsModal(); // refresh list
    }
  });
}

// Feature 5: Alerts
function openAlertsModal() {
  document.getElementById('alerts-modal').style.display = 'flex';
  fetch(\`\${API_BASE}/alerts\`).then(r => r.json()).then(alerts => {
    const list = document.getElementById('alerts-list');
    list.innerHTML = alerts.map(a => \`<li style="padding: 10px; background: rgba(0,0,0,0.05); margin-bottom: 5px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
      <div><strong>\${a.problem}</strong><br><small>\${a.action}</small></div>
      <button onclick="deleteAlert('\${a.id}')" style="background: var(--danger); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
    </li>\`).join('');
  });
}
function deleteAlert(id) {
  fetch(\`\${API_BASE}/alerts/\${id}\`, { method: 'DELETE' }).then(() => openAlertsModal());
}
function submitAlert(e) {
  e.preventDefault();
  fetch(\`\${API_BASE}/alerts\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem: document.getElementById('alert-problem').value, action: document.getElementById('alert-action').value })
  }).then(() => {
    document.getElementById('alert-problem').value = '';
    document.getElementById('alert-action').value = '';
    showToast('🚨', 'Alert Broadcasted');
  });
}

// Feature 6: Contacts
function openContactsModal() {
  document.getElementById('contacts-modal').style.display = 'flex';
  fetch(\`\${API_BASE}/contact-info\`).then(r => r.json()).then(contacts => {
    const list = document.getElementById('contacts-list-manage');
    list.innerHTML = contacts.map(c => \`<li style="padding: 10px; background: rgba(0,0,0,0.05); margin-bottom: 5px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
      <div><strong>\${c.name}</strong> (\${c.designation})<br><small>\${c.number}</small></div>
      <button onclick="deleteContact('\${c.id}')" style="background: var(--danger); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
    </li>\`).join('');
  });
}
function deleteContact(id) {
  fetch(\`\${API_BASE}/contact-info/\${id}\`, { method: 'DELETE' }).then(() => { openContactsModal(); loadContacts(); });
}
function submitContact(e) {
  e.preventDefault();
  fetch(\`\${API_BASE}/contact-info\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: document.getElementById('contact-name').value, number: document.getElementById('contact-number').value, designation: document.getElementById('contact-designation').value })
  }).then(() => {
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-number').value = '';
    document.getElementById('contact-designation').value = '';
    loadContacts();
    openContactsModal();
    showToast('📞', 'Contact Added');
  });
}
function loadContacts() {
  fetch(\`\${API_BASE}/contact-info\`).then(res => res.json()).then(contacts => {
    const footer = document.getElementById('footer-contacts');
    if (contacts.length > 0) {
      document.getElementById('global-footer').style.display = 'block';
      footer.innerHTML = contacts.map(c => \`<span style="margin-right: 15px;"><strong>\${c.name}</strong> (\${c.designation}): \${c.number}</span>\`).join('');
    } else {
      document.getElementById('global-footer').style.display = 'none';
    }
  });
}
`;
if (!scriptJs.includes('openAuditLogsModal')) {
  scriptJs += '\n' + featuresJS;
}

// Update Start Button in rendering
// We need to change it to handleStartTask('${issue.id}')
scriptJs = scriptJs.replace(/onclick="updateIssueStatus\('\$\{issue\.id\}', 'Started'\)">🚀 Start<\/button>/g, 'onclick="handleStartTask(\'${issue.id}\')">🚀 Start</button>');

// Add data-issue-id to LI so that real-time update can find it
scriptJs = scriptJs.replace(/const li = document\.createElement\('li'\);\s*li\.className = 'panel-list-item maint-card';/g, "const li = document.createElement('li');\n      li.className = 'panel-list-item maint-card';\n      li.setAttribute('data-issue-id', issue.id);");

// Load contacts on login
if (!scriptJs.includes('loadContacts()')) {
  scriptJs = scriptJs.replace("showPage('dashboard');", "showPage('dashboard');\n    if(typeof loadContacts === 'function') loadContacts();\n    fetch(API_BASE+'/alerts').then(r=>r.json()).then(a=>{ if(a.length>0 && a.find(x=>x.active)){document.getElementById('global-alert-toast').style.display='block'; document.getElementById('global-alert-text').innerText=a[0].problem+' - Action: '+a[0].action;} });");
}

fs.writeFileSync('script1.js', scriptJs);

console.log("All updates applied successfully.");
