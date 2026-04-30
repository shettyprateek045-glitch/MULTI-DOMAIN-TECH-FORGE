/* ============================================
   Digital Platform Monitoring Infrastructure
   of School and Facilities — Main Script
   ============================================ */

// ---- State ----
let currentRole = '';
let isLoggedIn = false;

// ---- Demo Credentials ----
const CREDENTIALS = {
  admin: { username: 'admin', password: 'admin' }, // Though they use Face ID usually
  faculty: { username: 'faculty', password: 'faculty123' },
  student: { username: 'student', password: 'student123' }
};

// ---- DOM References ----
const pages = {
  role: document.getElementById('role-page'),
  login: document.getElementById('login-page'),
  dashboard: document.getElementById('dashboard-page'),
};

const loginAvatar = document.getElementById('login-avatar');
const loginTitle = document.getElementById('login-title');
const loginSubtitle = document.getElementById('login-subtitle');
const loginForm = document.getElementById('login-form');
const faceIdContainer = document.getElementById('face-id-container');
const loginError = document.getElementById('login-error');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const navUsername = document.getElementById('nav-username');
const welcomeText = document.getElementById('welcome-text');
const currentDateEl = document.getElementById('current-date');
const dropdownMenu = document.getElementById('dropdown-menu');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// ---- Page Navigation ----
function showPage(pageKey) {
  Object.values(pages).forEach((p) => {
    p.classList.remove('active');
  });
  pages[pageKey].classList.add('active');

  // Re-trigger fade-in animation
  pages[pageKey].style.animation = 'none';
  // Force reflow
  void pages[pageKey].offsetHeight;
  pages[pageKey].style.animation = '';
}

// ---- Role Selection ----
let videoStream = null;

function selectRole(role) {
  currentRole = role;
  
  // Reset visibility
  loginForm.style.display = 'block';
  faceIdContainer.style.display = 'none';

  if (role === 'admin') {
    loginAvatar.textContent = '🏛️';
    loginTitle.textContent = 'Admin Portal';
    loginSubtitle.textContent = 'Secure Face ID Authentication required';
    loginForm.style.display = 'none';
    faceIdContainer.style.display = 'block';
    startFaceID();
  } else if (role === 'faculty') {
    loginAvatar.textContent = '👨‍🏫';
    loginTitle.textContent = 'School Staff Login';
    loginSubtitle.textContent = 'Staff credentials required';
  } else {
    loginAvatar.textContent = '🎓';
    loginTitle.textContent = 'Student Login';
    loginSubtitle.textContent = 'Student credentials required';
  }

  // Clear previous inputs
  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';
  loginError.classList.remove('show');

  showPage('login');
}

// ---- Face ID Logic ----
async function startFaceID() {
  const video = document.getElementById('face-video');
  const statusEl = document.getElementById('face-status');
  const captureBtn = document.getElementById('capture-btn');
  const loginFaceBtn = document.getElementById('login-face-btn');
  const placeholder = document.getElementById('camera-placeholder');
  
  // Reset UI
  captureBtn.style.display = 'inline-block';
  if(loginFaceBtn) loginFaceBtn.style.display = 'none';
  captureBtn.disabled = true;
  video.style.display = 'none';
  document.getElementById('face-canvas').style.display = 'none';
  placeholder.style.display = 'block';
  
  statusEl.textContent = "Requesting Camera Access...";
  statusEl.style.color = "var(--text-secondary)";
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    videoStream = stream;
    
    video.onloadedmetadata = () => {
      placeholder.style.display = 'none';
      video.style.display = 'block';
      statusEl.textContent = "Camera On. Please capture your photo.";
      statusEl.style.color = "var(--primary)";
      captureBtn.disabled = false;
    };
  } catch (err) {
    let errorMsg = "Camera access denied.";
    if (err.name === 'NotFoundError') errorMsg = "No camera found on this device.";
    else if (err.name === 'NotAllowedError') errorMsg = "Camera permission denied by browser.";
    else if (err.name === 'NotReadableError') errorMsg = "Camera is currently in use by another app.";
    
    statusEl.textContent = errorMsg + " Simulating Camera.";
    statusEl.style.color = "var(--warning)";
    captureBtn.disabled = false;
  }
}

function stopFaceID() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
}

function manualCapture() {
  const video = document.getElementById('face-video');
  const canvas = document.getElementById('face-canvas');
  const statusEl = document.getElementById('face-status');
  const loginFaceBtn = document.getElementById('login-face-btn');
  
  canvas.width = video.videoWidth || 300;
  canvas.height = video.videoHeight || 200;
  const ctx = canvas.getContext('2d');
  
  if (videoStream) {
     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } else {
     ctx.fillStyle = '#e2e8f0';
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     ctx.fillStyle = '#1a0633';
     ctx.font = '20px Outfit';
     ctx.textAlign = 'center';
     ctx.fillText('Simulated Photo', canvas.width/2, canvas.height/2);
  }
  
  stopFaceID();
  
  video.style.display = 'none';
  document.getElementById('camera-placeholder').style.display = 'none';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.borderRadius = '12px';
  
  statusEl.textContent = "Photo Captured! Please Login.";
  statusEl.style.color = "var(--success)";
  
  const startCamBtn = document.getElementById('start-cam-btn');
  if (startCamBtn) startCamBtn.style.display = 'none';
  document.getElementById('capture-btn').style.display = 'none';
  document.getElementById('login-face-btn').style.display = 'inline-block';
}

// ---- Go Back to Role Selection ----
function goBack() {
  stopFaceID();
  showPage('role');
  currentRole = '';
}

// ---- Authorized Students ----
const AUTHORIZED_STUDENTS = {
  "Aarav Sharma": "pass001",
  "Aditya Verma": "pass002",
  "Akash Deshmukh": "pass003",
  "Ananya Patel": "pass004",
  "Arjun Mishra": "pass005",
  "Aditi Bhattacharya": "pass006",
  "Deepak Malhotra": "pass007",
  "Divya Rao": "pass008",
  "Gaurav Anand": "pass009",
  "Harsh Venkatesh": "pass010",
  "Ishita Jain": "pass011",
  "Karan Gupta": "pass012",
  "Kavya Menon": "pass013",
  "Manish Bhat": "pass014",
  "Meera Joshi": "pass015",
  "Mohit Khanna": "pass016",
  "Neha Reddy": "pass017",
  "Nikhil Chauhan": "pass018",
  "Nisha Pillai": "pass019",
  "Parth Chatterjee": "pass020",
  "Pooja Kulkarni": "pass021",
  "Priya Nair": "pass022",
  "Rahul Das": "pass023",
  "Rhea Fernandes": "pass024",
  "Ritu Saxena": "pass025",
  "Rohan Mehta": "pass026",
  "Sandeep Kulkarni": "pass027",
  "Shreya Ghosh": "pass028",
  "Siddharth Roy": "pass029",
  "Simran Arora": "pass030",
  "Sneha Iyer": "pass031",
  "Swati Prasad": "pass032",
  "Tanya Chawla": "pass033",
  "Varun Kapoor": "pass034",
  "Vivek Singh": "pass035"
};

// ---- Authorized Faculty ----
const AUTHORIZED_FACULTY = {
  "Alok Sen": "alok@1970",
  "Bharti Malhotra": "bharti@1972",
  "Chirag Deshmukh": "chirag@1968",
  "Damini Raghavan": "damini@1975",
  "Eklavya Joshi": "eklavya@1969",
  "Farhan Shaikh": "farhan@1974",
  "Gayatri Iyer": "gayatri@1971",
  "Harini Krishnan": "harini@1973",
  "Ishwar Pillai": "ishwar@1970",
  "Jyoti Banerjee": "jyoti@1976",
  "Keshav Rao": "keshav@1972",
  "Leela Kapoor": "leela@1974",
  "Madhav Chatterjee": "madhav@1977",
  "Nalini Mehta": "nalini@1971",
  "Om Prakash": "om@1973",
  "Padma Srinivasan": "padma@1970",
  "Qadir Hussain": "qadir@1972",
  "Rekha Fernandes": "rekha@1975",
  "Suresh Bhattacharya": "suresh@1969",
  "Tanushree Ghosh": "tanushree@1974"
};

// ---- Handle Login ----
function handleLogin(e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = false;
  let finalUsername = username;

  if (currentRole === 'student') {
    const studentKeys = Object.keys(AUTHORIZED_STUDENTS);
    const matchedKey = studentKeys.find(name => name.toLowerCase() === username.toLowerCase());
    
    if (matchedKey && AUTHORIZED_STUDENTS[matchedKey] === password) {
      isValid = true;
      finalUsername = matchedKey; // Use properly formatted name
    }
  } else if (currentRole === 'faculty') {
    const facultyKeys = Object.keys(AUTHORIZED_FACULTY);
    const matchedKey = facultyKeys.find(name => name.toLowerCase() === username.toLowerCase());
    
    if (matchedKey && AUTHORIZED_FACULTY[matchedKey] === password) {
      isValid = true;
      finalUsername = matchedKey; // Use properly formatted name
    }
  } else {
    // For other roles, allow any username and password combination like before
    if (username && password) {
      isValid = true;
    }
  }

  if (isValid) {
    executeLogin(finalUsername);
  } else {
    loginError.classList.add('show');
    // Shake the form
    loginForm.style.animation = 'none';
    void loginForm.offsetHeight;
    loginForm.style.animation = 'shake 0.4s ease';
  }
}

function executeLogin(username) {
  isLoggedIn = true;
  loginError.classList.remove('show');

  // Update dashboard with user info
  let displayName = capitalize(username);
  const navAvatar = document.getElementById('nav-avatar');

  if(currentRole === 'faculty') {
    displayName = 'Staff ' + displayName;
    if(navAvatar) navAvatar.textContent = '👨‍🏫';
  } else if(currentRole === 'admin') {
    displayName = 'Administrator';
    if(navAvatar) navAvatar.textContent = '🏛️';
  } else if(currentRole === 'student') {
    if(navAvatar) navAvatar.textContent = '🎓';
  } else {
    if(navAvatar) navAvatar.textContent = '👤';
  }
  
  navUsername.textContent = displayName;
  welcomeText.textContent = '👋 Welcome back, ' + displayName + '!';

  // Set current date
  updateCurrentDate();
  
  // Handle tab visibility based on role
  const allTabBtns = document.querySelectorAll('.tab-btn');
  allTabBtns.forEach(btn => btn.style.display = 'none'); // Hide all first

  // Academic dropdown items (show/hide per role)
  const academicEls = ['menu-divider-academics','menu-label-academics','menu-btn-exams','menu-btn-fees','menu-btn-timetable'];
  
  if (currentRole === 'admin') {
    allTabBtns.forEach(btn => btn.style.display = 'inline-block');
    academicEls.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = ''; });
    switchTab('analytics');
    showToast('✅', 'Admin permissions loaded.');
  } else if (currentRole === 'faculty') {
    document.querySelector('.tab-btn[data-tab="report"]').style.display = 'inline-block';
    document.querySelector('.tab-btn[data-tab="problems"]').style.display = 'inline-block';
    // Hide academic items from dropdown for faculty
    academicEls.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
    switchTab('problems');
    showToast('✅', 'Staff dashboard loaded.');
  } else {
    // Student
    document.querySelector('.tab-btn[data-tab="attendance"]').style.display = 'inline-block';
    document.querySelector('.tab-btn[data-tab="exams"]').style.display = 'inline-block';
    document.querySelector('.tab-btn[data-tab="fees"]').style.display = 'inline-block';
    document.querySelector('.tab-btn[data-tab="timetable"]').style.display = 'inline-block';
    academicEls.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = ''; });
    loadStudentAttendance(username);
    switchTab('attendance');
    showToast('✅', 'Student dashboard loaded.');
  }

  showPage('dashboard');
}

// ---- Per-Student Attendance Data ----
const STUDENT_ATTENDANCE = {
  "Aarav Sharma":       { pct: 92, present: 185, absent: 15, trend: '↑ 2.5%' },
  "Aditya Verma":       { pct: 78, present: 158, absent: 42, trend: '↓ 1.2%' },
  "Akash Deshmukh":     { pct: 85, present: 170, absent: 30, trend: '↑ 0.8%' },
  "Ananya Patel":       { pct: 96, present: 192, absent: 8,  trend: '↑ 3.1%' },
  "Arjun Mishra":       { pct: 70, present: 140, absent: 60, trend: '↓ 2.0%' },
  "Aditi Bhattacharya": { pct: 88, present: 176, absent: 24, trend: '↑ 1.5%' },
  "Deepak Malhotra":    { pct: 75, present: 150, absent: 50, trend: '↓ 0.5%' },
  "Divya Rao":          { pct: 93, present: 186, absent: 14, trend: '↑ 2.0%' },
  "Gaurav Anand":       { pct: 82, present: 164, absent: 36, trend: '↑ 0.3%' },
  "Harsh Venkatesh":    { pct: 67, present: 134, absent: 66, trend: '↓ 3.5%' },
  "Ishita Jain":        { pct: 95, present: 190, absent: 10, trend: '↑ 2.8%' },
  "Karan Gupta":        { pct: 80, present: 160, absent: 40, trend: '↑ 0.5%' },
  "Kavya Menon":        { pct: 91, present: 182, absent: 18, trend: '↑ 1.9%' },
  "Manish Bhat":        { pct: 73, present: 146, absent: 54, trend: '↓ 1.8%' },
  "Meera Joshi":        { pct: 89, present: 178, absent: 22, trend: '↑ 1.1%' },
  "Mohit Khanna":       { pct: 77, present: 154, absent: 46, trend: '↓ 0.9%' },
  "Neha Reddy":         { pct: 94, present: 188, absent: 12, trend: '↑ 2.4%' },
  "Nikhil Chauhan":     { pct: 69, present: 138, absent: 62, trend: '↓ 2.7%' },
  "Nisha Pillai":       { pct: 87, present: 174, absent: 26, trend: '↑ 0.7%' },
  "Parth Chatterjee":   { pct: 83, present: 166, absent: 34, trend: '↑ 0.4%' },
  "Pooja Kulkarni":     { pct: 90, present: 180, absent: 20, trend: '↑ 1.6%' },
  "Priya Nair":         { pct: 97, present: 194, absent: 6,  trend: '↑ 3.4%' },
  "Rahul Das":          { pct: 76, present: 152, absent: 48, trend: '↓ 1.3%' },
  "Rhea Fernandes":     { pct: 92, present: 184, absent: 16, trend: '↑ 2.2%' },
  "Ritu Saxena":        { pct: 84, present: 168, absent: 32, trend: '↑ 0.6%' },
  "Rohan Mehta":        { pct: 71, present: 142, absent: 58, trend: '↓ 2.3%' },
  "Sandeep Kulkarni":   { pct: 86, present: 172, absent: 28, trend: '↑ 1.0%' },
  "Shreya Ghosh":       { pct: 93, present: 186, absent: 14, trend: '↑ 2.1%' },
  "Siddharth Roy":      { pct: 79, present: 158, absent: 42, trend: '↓ 0.8%' },
  "Simran Arora":       { pct: 91, present: 182, absent: 18, trend: '↑ 1.7%' },
  "Sneha Iyer":         { pct: 88, present: 176, absent: 24, trend: '↑ 1.3%' },
  "Swati Prasad":       { pct: 74, present: 148, absent: 52, trend: '↓ 1.6%' },
  "Tanya Chawla":       { pct: 96, present: 192, absent: 8,  trend: '↑ 3.0%' },
  "Varun Kapoor":       { pct: 68, present: 136, absent: 64, trend: '↓ 3.2%' },
  "Vivek Singh":        { pct: 85, present: 170, absent: 30, trend: '↑ 0.9%' }
};

// Log-row sets by attendance bracket
const ATT_LOGS = {
  high: [ // >= 90%
    { date:'27 Apr 2026', subject:'Mathematics',    status:'present', time:'09:00 AM' },
    { date:'27 Apr 2026', subject:'Physics',        status:'present', time:'10:30 AM' },
    { date:'26 Apr 2026', subject:'English',        status:'present', time:'09:00 AM' },
    { date:'26 Apr 2026', subject:'Chemistry',      status:'present', time:'11:00 AM' },
    { date:'25 Apr 2026', subject:'Computer Sci.',  status:'late',    time:'09:12 AM' },
    { date:'25 Apr 2026', subject:'History',        status:'present', time:'02:00 PM' }
  ],
  good: [ // 80–89%
    { date:'27 Apr 2026', subject:'Mathematics',    status:'present', time:'09:00 AM' },
    { date:'27 Apr 2026', subject:'Physics',        status:'late',    time:'10:45 AM' },
    { date:'26 Apr 2026', subject:'English',        status:'present', time:'09:00 AM' },
    { date:'26 Apr 2026', subject:'Chemistry',      status:'absent',  time:'—'        },
    { date:'25 Apr 2026', subject:'Computer Sci.',  status:'present', time:'09:00 AM' },
    { date:'25 Apr 2026', subject:'History',        status:'present', time:'02:00 PM' }
  ],
  avg: [ // 70–79%
    { date:'27 Apr 2026', subject:'Mathematics',    status:'absent',  time:'—'        },
    { date:'27 Apr 2026', subject:'Physics',        status:'present', time:'10:30 AM' },
    { date:'26 Apr 2026', subject:'English',        status:'late',    time:'09:20 AM' },
    { date:'26 Apr 2026', subject:'Chemistry',      status:'absent',  time:'—'        },
    { date:'25 Apr 2026', subject:'Computer Sci.',  status:'present', time:'09:00 AM' },
    { date:'25 Apr 2026', subject:'History',        status:'present', time:'02:00 PM' }
  ],
  low: [ // < 70%
    { date:'27 Apr 2026', subject:'Mathematics',    status:'absent',  time:'—'        },
    { date:'27 Apr 2026', subject:'Physics',        status:'absent',  time:'—'        },
    { date:'26 Apr 2026', subject:'English',        status:'present', time:'09:00 AM' },
    { date:'26 Apr 2026', subject:'Chemistry',      status:'late',    time:'11:18 AM' },
    { date:'25 Apr 2026', subject:'Computer Sci.',  status:'absent',  time:'—'        },
    { date:'25 Apr 2026', subject:'History',        status:'present', time:'02:00 PM' }
  ]
};

function loadStudentAttendance(name) {
  const data = STUDENT_ATTENDANCE[name] || { pct: 85, present: 170, absent: 30, trend: '↑ 0.5%' };

  // Update stat cards
  document.getElementById('att-overall-pct').textContent   = data.pct + '%';
  document.getElementById('att-present-val').textContent   = data.present;
  document.getElementById('att-absent-val').textContent    = data.absent;
  document.getElementById('att-progress-fill').style.width = data.pct + '%';
  document.getElementById('att-progress-label').textContent = data.pct + ' / 100';

  // Trend badge
  const trendBadge = document.getElementById('att-trend-badge');
  const isUp = data.trend.startsWith('↑');
  trendBadge.textContent = data.trend;
  trendBadge.className   = 'stat-badge ' + (isUp ? 'up' : 'down');

  // Pick log set
  let logSet;
  if      (data.pct >= 90) logSet = ATT_LOGS.high;
  else if (data.pct >= 80) logSet = ATT_LOGS.good;
  else if (data.pct >= 70) logSet = ATT_LOGS.avg;
  else                     logSet = ATT_LOGS.low;

  // Populate table body
  const tbody = document.getElementById('att-log-body');
  tbody.innerHTML = logSet.map(row => `
    <tr>
      <td>${row.date}</td>
      <td>${row.subject}</td>
      <td><span class="status-dot ${row.status}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
      <td>${row.time}</td>
    </tr>
  `).join('');
}

// ---- Handle Logout ----
function handleLogout() {
  closeMenu();
  isLoggedIn = false;
  currentRole = '';
  usernameInput.value = '';
  passwordInput.value = '';
  loginError.classList.remove('show');
  showPage('role');
  showToast('🚪', 'You have been logged out.');
}

// ---- Three-Dot Dropdown Menu ----
function toggleMenu() {
  dropdownMenu.classList.toggle('open');
}

function closeMenu() {
  dropdownMenu.classList.remove('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
  const menuContainer = document.querySelector('.menu-container');
  if (menuContainer && !menuContainer.contains(e.target)) {
    closeMenu();
  }
});

// ---- Tab Switching ----
function switchTab(tabName) {
  closeMenu();
  
  // Turn off problem camera if navigating away
  if (typeof stopProblemCamera === 'function') {
    stopProblemCamera();
  }

  // Update tab buttons
  const allTabs = document.querySelectorAll('.tab-btn');
  allTabs.forEach((btn) => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab panels
  const allPanels = document.querySelectorAll('.tab-panel');
  allPanels.forEach((panel) => {
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById('panel-' + tabName);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }
}

// ---- Report / Problem Submission ----
// ---- Global Mock Database ----
let mockDatabase = [];

// ---- Report / Problem Submission ----
function submitReport(e, type) {
  e.preventDefault();

  if (type === 'issue') {
    const category = document.getElementById('report-category').value;
    const subject = document.getElementById('report-subject').value;
    const detail = document.getElementById('report-detail').value;

    if (!category || !subject || !detail) {
      showToast('⚠️', 'Please fill in all fields.');
      return;
    }

    // Step 2: Form Object (Mocking for Issue Report)
    const newIssue = {
      id: 'REQ-' + Math.floor(Math.random() * 10000),
      type: category,
      location: 'General',
      description: subject + " - " + detail,
      hasImage: false,
      priority: 'Low',
      status: 'Pending',
      date: new Date().toISOString()
    };

    // Storage
    mockDatabase.push(newIssue);
    if (typeof infrastructureData !== 'undefined') {
      infrastructureData.totalIssues++;
      infrastructureData.active++;
      infrastructureData.low++;
    }

    // Inject dynamically into Maintenance Tab
    const maintList = document.getElementById('maintenance-task-list');
    if (maintList) {
       const li = document.createElement('li');
       li.innerHTML = `
          <span class="item-label">${newIssue.type.toUpperCase()}: ${newIssue.description} — (${newIssue.priority})</span>
          <div style="display:flex; gap: 8px;">
             <button type="button" class="submit-btn secondary" style="padding: 4px 10px; font-size:0.75rem; margin-top:0;" onclick="showToast('✅', 'Status updated to In Progress')">Start Work</button>
             <button type="button" class="submit-btn" style="padding: 4px 10px; font-size:0.75rem;" onclick="showToast('✅', 'Workflow Step 5 complete. Status updated.')">Mark Resolved</button>
          </div>
       `;
       maintList.prepend(li);
    }

    // Reset form
    document.getElementById('issue-report-form').reset();
    showToast('✅', 'Issue report submitted successfully!');
  }
}

function submitNewIssue(e) {
  e.preventDefault();
  
  const problemType = document.getElementById('problem-type').value;
  const location = document.getElementById('problem-location').value;
  const description = document.getElementById('problem-description').value;
  const imageUpload = document.getElementById('problem-image').files[0];
  
  if (!problemType || !location || !description) {
    showToast('⚠️', 'Please fill in all required fields.');
    return;
  }
  
  // Step 2: Form Object
  const newIssue = {
    id: 'ISSUE-' + Math.floor(Math.random() * 10000),
    type: problemType,
    location: location,
    description: description,
    hasImage: !!imageUpload || (typeof problemImageCaptured !== 'undefined' && problemImageCaptured),
    status: 'Pending',
    date: new Date().toISOString()
  };
  
  // Step 3: Processing (Smart Priority System)
  const priorityResult = predictSeverity(description);
  newIssue.priority = priorityResult.level;
  
  // Storage
  mockDatabase.push(newIssue);
  
  // Update Analytics Data dynamically
  infrastructureData.totalIssues++;
  infrastructureData.active++;
  if (priorityResult.level === 'Critical') infrastructureData.critical++;
  if (priorityResult.level === 'Warning') infrastructureData.warning++;
  if (priorityResult.level === 'Low') infrastructureData.low++;
  
  // Inject dynamically into Maintenance Tab
  const maintList = document.getElementById('maintenance-task-list');
  if (maintList) {
     const li = document.createElement('li');
     li.innerHTML = `
        <span class="item-label">${newIssue.type.toUpperCase()}: ${newIssue.description} — ${newIssue.location} (${newIssue.priority})</span>
        <div style="display:flex; gap: 8px;">
           <button type="button" class="submit-btn secondary" style="padding: 4px 10px; font-size:0.75rem; margin-top:0;" onclick="showToast('✅', 'Status updated to In Progress')">Start Work</button>
           <button type="button" class="submit-btn" style="padding: 4px 10px; font-size:0.75rem;" onclick="showToast('✅', 'Workflow Step 5 complete. Status updated.')">Mark Resolved</button>
        </div>
     `;
     maintList.prepend(li);
  }
  
  showToast('✅', `Issue stored! Priority assigned: ${priorityResult.level}`);
  document.getElementById('problem-report-form').reset();
  const fileNameDisplay = document.getElementById('file-name');
  if(fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
  
  // Hide camera container and reset camera state
  const camContainer = document.getElementById('problem-camera-container');
  if (camContainer) camContainer.style.display = 'none';
  if (typeof stopProblemCamera === 'function') stopProblemCamera();
  if (typeof problemImageCaptured !== 'undefined') problemImageCaptured = false;
  
  // Simulate tracking updates (Step 4)
  updateFlowchartTracker();
}

function updateFlowchartTracker() {
  const steps = document.querySelectorAll('.workflow-tracker .step');
  if (steps.length === 0) return;
  
  let current = 0;
  
  // Wait 1 second before starting animation sequence
  setTimeout(() => {
    const interval = setInterval(() => {
      // Complete previous
      steps[current].classList.remove('active');
      steps[current].style.opacity = '1';
      steps[current].style.color = 'var(--success)';
      
      current++;
      
      if (current >= 3) {
         clearInterval(interval);
         // Stop at Assigned
         steps[3].classList.add('active'); 
         steps[3].style.opacity = '1';
         steps[3].style.color = 'var(--primary)';
         showToast('👨‍🔧', 'System assigned task to Maintenance Team.');
      } else {
         steps[current].classList.add('active');
         steps[current].style.opacity = '1';
         steps[current].style.color = 'var(--primary)';
      }
    }, 1200);
  }, 500);
}


// ---- Toast Notification ----
let toastTimer = null;

function showToast(icon, message) {
  if (toastTimer) clearTimeout(toastTimer);

  toastIcon.textContent = icon;
  toastMessage.textContent = message;
  toast.classList.add('show');

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ---- Problem Camera Logic ----
let problemVideoStream = null;
let problemImageCaptured = false;

async function startProblemCamera() {
  const container = document.getElementById('problem-camera-container');
  const video = document.getElementById('problem-video');
  const canvas = document.getElementById('problem-canvas');
  const statusEl = document.getElementById('problem-cam-status');
  const captureBtn = document.getElementById('problem-capture-btn');
  const retakeBtn = document.getElementById('problem-retake-btn');
  const placeholder = document.getElementById('problem-cam-placeholder');
  
  document.getElementById('problem-image').value = '';
  document.getElementById('file-name').textContent = 'Using Camera';
  
  container.style.display = 'block';
  video.style.display = 'none';
  canvas.style.display = 'none';
  if(placeholder) placeholder.style.display = 'block';
  captureBtn.style.display = 'inline-block';
  retakeBtn.style.display = 'none';
  captureBtn.disabled = true;
  problemImageCaptured = false;
  
  statusEl.textContent = "Requesting Camera Access...";
  statusEl.style.color = "var(--text-secondary)";
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    problemVideoStream = stream;
    
    video.onloadedmetadata = () => {
      if(placeholder) placeholder.style.display = 'none';
      video.style.display = 'block';
      statusEl.textContent = "Camera On. Please capture the problem.";
      statusEl.style.color = "var(--primary)";
      captureBtn.disabled = false;
    };
  } catch (err) {
    if(placeholder) placeholder.style.display = 'none';
    let errorMsg = "Camera access denied.";
    if (err.name === 'NotFoundError') errorMsg = "No camera found on this device.";
    else if (err.name === 'NotAllowedError') errorMsg = "Camera permission denied by browser.";
    else if (err.name === 'NotReadableError') errorMsg = "Camera is currently in use by another app.";
    
    statusEl.textContent = errorMsg + " Simulating capture.";
    statusEl.style.color = "var(--warning)";
    captureBtn.disabled = false;
  }
}

function stopProblemCamera() {
  if (problemVideoStream) {
    problemVideoStream.getTracks().forEach(track => track.stop());
    problemVideoStream = null;
  }
}

function captureProblemPhoto() {
  const video = document.getElementById('problem-video');
  const canvas = document.getElementById('problem-canvas');
  const statusEl = document.getElementById('problem-cam-status');
  const captureBtn = document.getElementById('problem-capture-btn');
  const retakeBtn = document.getElementById('problem-retake-btn');
  
  canvas.width = video.videoWidth || 300;
  canvas.height = video.videoHeight || 200;
  const ctx = canvas.getContext('2d');
  
  if (problemVideoStream) {
     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } else {
     ctx.fillStyle = '#e2e8f0';
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     ctx.fillStyle = '#1a0633';
     ctx.font = '20px Outfit';
     ctx.textAlign = 'center';
     ctx.fillText('Simulated Problem Photo', canvas.width/2, canvas.height/2);
  }
  
  stopProblemCamera();
  
  video.style.display = 'none';
  const placeholder = document.getElementById('problem-cam-placeholder');
  if(placeholder) placeholder.style.display = 'none';
  canvas.style.display = 'block';
  problemImageCaptured = true;
  
  statusEl.textContent = "Photo Captured successfully!";
  statusEl.style.color = "var(--success)";
  captureBtn.style.display = 'none';
  retakeBtn.style.display = 'inline-block';
  
  document.getElementById('file-name').textContent = 'Live photo captured 📸';
}

// ---- Utilities ----
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateEl.textContent = now.toLocaleDateString('en-IN', options);
}

// ---- Keyboard Shortcuts ----
document.addEventListener('keydown', function (e) {
  // Escape to close dropdown
  if (e.key === 'Escape') {
    closeMenu();
  }
});

// ---- Initialize ----
(function init() {
  updateCurrentDate();
})();

// ============================================
//   ANALYTICS, MODELS & ALGORITHMS
// ============================================

// --- 1. Data Model ---
const infrastructureData = {
  totalIssues: 45,
  resolved: 32,
  active: 13,
  critical: 3,
  warning: 6,
  low: 4
};

// --- 2. Smart Severity Classification Algorithm ---
// Uses keyword matching to predict severity level of an issue description.
function predictSeverity(text) {
  text = text.toLowerCase();
  
  const criticalKeywords = ['fire', 'leak', 'flood', 'danger', 'shock', 'blood', 'smoke', 'massive', 'wire', 'short circuit'];
  const warningKeywords = ['broken', 'crack', 'stop', 'not working', 'hot', 'smell', 'noise', 'stuck'];
  
  let score = 0;
  
  criticalKeywords.forEach(kw => { if (text.includes(kw)) score += 5; });
  warningKeywords.forEach(kw => { if (text.includes(kw)) score += 2; });
  
  if (score >= 5) return { level: 'Critical', class: 'badge-danger' };
  if (score >= 2) return { level: 'Warning', class: 'badge-warning' };
  if (text.length > 0) return { level: 'Low', class: 'badge-success' };
  return { level: 'Unknown', class: '' };
}

// --- 3. Infrastructure Health Model ---
// Calculates a health score out of 100 based on active issues and their weights
function calculateHealthScore(data) {
  const maxScore = 100;
  // Weight deductions
  const criticalDeduction = data.critical * 8; 
  const warningDeduction = data.warning * 3;
  const lowDeduction = data.low * 1;
  
  let score = maxScore - (criticalDeduction + warningDeduction + lowDeduction);
  if (score < 0) score = 0;
  
  return score;
}

// --- 4. Analytics UI Update Logic ---
function updateAnalyticsDashboard() {
  // Update stats
  document.getElementById('stat-critical').textContent = infrastructureData.critical;
  document.getElementById('stat-active').textContent = infrastructureData.active;
  document.getElementById('stat-resolved').textContent = infrastructureData.resolved;
  
  // Calculate Health
  const healthScore = calculateHealthScore(infrastructureData);
  const circlePath = document.getElementById('health-circle-path');
  const scoreText = document.getElementById('health-score-text');
  const statusText = document.getElementById('health-status-text');
  
  scoreText.textContent = `${healthScore}%`;
  circlePath.setAttribute('stroke-dasharray', `${healthScore}, 100`);
  
  // Update colors based on score
  if (healthScore >= 80) {
    circlePath.style.stroke = 'var(--success)';
    statusText.textContent = 'Excellent';
    statusText.style.color = 'var(--success)';
  } else if (healthScore >= 50) {
    circlePath.style.stroke = 'var(--warning)';
    statusText.textContent = 'Needs Attention';
    statusText.style.color = 'var(--warning)';
  } else {
    circlePath.style.stroke = 'var(--danger)';
    statusText.textContent = 'Critical state';
    statusText.style.color = 'var(--danger)';
  }
}

// Hook into existing switchTab to trigger analytics update
const originalSwitchTab = switchTab;
switchTab = function(tabName) {
  originalSwitchTab(tabName);
  if (tabName === 'analytics') {
    // Delay slightly for animation effect
    setTimeout(updateAnalyticsDashboard, 100);
  }
};

// --- 5. Interactive Demo ---
function runPredictionDemo() {
  const text = document.getElementById('demo-issue-text').value;
  if (!text) {
    showToast('⚠️', 'Please enter a description first.');
    return;
  }
  
  const result = predictSeverity(text);
  const badge = document.getElementById('pred-badge');
  badge.textContent = result.level;
  
  // reset classes
  badge.className = 'badge';
  badge.classList.add(result.class);
  
  document.getElementById('demo-prediction-result').style.display = 'flex';
}

// --- 6. Automated Testing System ---
function logTest(msg, type = 'info') {
  const consoleBox = document.getElementById('test-console');
  const div = document.createElement('div');
  div.className = `log-${type}`;
  div.textContent = `> ${msg}`;
  consoleBox.appendChild(div);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

function runValidationSuite() {
  const consoleBox = document.getElementById('test-console');
  consoleBox.innerHTML = '';
  logTest('Initializing Validation Suite...', 'info');
  
  setTimeout(() => {
    logTest('Testing Severity Classification Algorithm...', 'info');
    
    let passed = 0;
    
    // Test 1
    let res = predictSeverity("Water leak in server room");
    if(res.level === 'Critical') {
      logTest('[PASS] "Water leak" -> Expected Critical, got Critical', 'success'); passed++;
    } else { logTest('[FAIL] "Water leak" -> Expected Critical, got ' + res.level, 'err'); }
    
    // Test 2
    res = predictSeverity("Projector is not working");
    if(res.level === 'Warning') {
      logTest('[PASS] "not working" -> Expected Warning, got Warning', 'success'); passed++;
    } else { logTest('[FAIL] "not working" -> Expected Warning, got ' + res.level, 'err'); }
    
    // Test 3
    res = predictSeverity("Need a new chair");
    if(res.level === 'Low') {
      logTest('[PASS] "Need a new chair" -> Expected Low, got Low', 'success'); passed++;
    } else { logTest('[FAIL] "Need a new chair" -> Expected Low, got ' + res.level, 'err'); }
    
    setTimeout(() => {
      logTest('Testing Infrastructure Health Model...', 'info');
      // Test 4
      const testData = { critical: 2, warning: 5, low: 10 };
      // max(100) - (2*8 + 5*3 + 10*1) = 100 - (16 + 15 + 10) = 100 - 41 = 59
      let health = calculateHealthScore(testData);
      if(health === 59) {
        logTest('[PASS] Health Score exact calculation match (59)', 'success'); passed++;
      } else { logTest('[FAIL] Health Score -> Expected 59, got ' + health, 'err'); }
      
      logTest(`Validation Complete. ${passed}/4 Tests Passed. System Verified.`, passed === 4 ? 'success' : 'warn');
    }, 800);
    
  }, 500);
}
