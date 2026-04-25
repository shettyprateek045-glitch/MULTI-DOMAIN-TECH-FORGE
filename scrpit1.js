/* ============================================
   Digital Platform Monitoring Infrastructure
   of School and Facilities — Main Script
   ============================================ */

// ---- State ----
let currentRole = '';
let isLoggedIn = false;

// ---- Demo Credentials ----
const CREDENTIALS = {
  faculty: { username: 'faculty', password: 'faculty123' },
  student: { username: 'student', password: 'student123' },
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
function selectRole(role) {
  currentRole = role;

  if (role === 'faculty') {
    loginAvatar.textContent = '👨‍🏫';
    loginTitle.textContent = 'Faculty Login';
    loginSubtitle.textContent = 'Staff & teacher credentials required';
  } else {
    loginAvatar.textContent = '🎓';
    loginTitle.textContent = 'Student Login';
    loginSubtitle.textContent = 'Student ID and password required';
  }

  // Clear previous inputs
  usernameInput.value = '';
  passwordInput.value = '';
  loginError.classList.remove('show');

  showPage('login');
}

// ---- Go Back to Role Selection ----
function goBack() {
  showPage('role');
  currentRole = '';
}

// ---- Handle Login ----
function handleLogin(e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const creds = CREDENTIALS[currentRole];

  if (username === creds.username && password === creds.password) {
    isLoggedIn = true;
    loginError.classList.remove('show');

    // Update dashboard with user info
    const displayName = currentRole === 'faculty' ? 'Prof. ' + capitalize(username) : capitalize(username);
    navUsername.textContent = displayName;
    welcomeText.textContent = '👋 Welcome back, ' + displayName + '!';

    // Set current date
    updateCurrentDate();

    // Animate progress bars after a short delay
    showPage('dashboard');
    switchTab('attendance');

    showToast('✅', 'Login successful! Welcome to DPMISF.');
  } else {
    loginError.classList.add('show');
    // Shake the form
    loginForm.style.animation = 'none';
    void loginForm.offsetHeight;
    loginForm.style.animation = 'shake 0.4s ease';
  }
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

    // Reset form
    document.getElementById('issue-report-form').reset();
    showToast('✅', 'Issue report submitted successfully!');
  } else if (type === 'problem') {
    const problemType = document.getElementById('problem-type').value;
    const location = document.getElementById('problem-location').value;
    const description = document.getElementById('problem-description').value;

    if (!problemType || !location || !description) {
      showToast('⚠️', 'Please fill in all fields.');
      return;
    }

    // Reset form
    document.getElementById('problem-report-form').reset();
    showToast('✅', 'Problem report submitted! Maintenance team notified.');
  }
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
