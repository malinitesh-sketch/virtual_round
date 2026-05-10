/**
 * Traveloop — Frontend Application Controller
 * Handles login, registration, and page-level interactions.
 * Connects to Flask backend at http://localhost:5000
 */
(() => {
  const API_BASE = 'http://localhost:5000';
  const TOKEN_KEY = 'authToken';

  const USER_KEY = 'traveloop_user';
  let registerProfilePic = null;

  // ===== UTILITY HELPERS =====
  function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

  function setUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  }

  function showMsg(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
    el.style.color = type === 'error' ? '#ef4444' : '#22c55e';
  }

  // ===== API CALL HELPER =====
  async function api(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
    return data;
  }

  // ===== LOGIN HANDLER =====
  function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const emailInput = form.querySelector('[data-login-email]') || document.getElementById('login-email');
    const passInput = form.querySelector('[data-login-password]') || document.getElementById('login-password');
    const errorBox = document.getElementById('login-error');
    const successBox = document.getElementById('login-success');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showMsg(errorBox, '', 'error');
      showMsg(successBox, '', 'success');

      const email = (emailInput?.value || '').trim();
      const password = passInput?.value || '';

      if (!email || !password) {
        showMsg(errorBox, 'Email and password are required.', 'error');
        return;
      }

      try {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        // backend returns { token, user: {...} }


        setToken(data.token);
        if (data.user) setUser(data.user);
        showMsg(successBox, '✅ Login successful! Redirecting...', 'success');

        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      } catch (err) {
        showMsg(errorBox, `❌ ${err.message}`, 'error');
      }
    });
  }

  // ===== REGISTER HANDLER =====
  function initRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;

    const errorBox = document.getElementById('reg-error');
    const successBox = document.getElementById('reg-success');
    const photoInput = document.getElementById('reg-photo-input');
    const photoPreview = document.getElementById('reg-photo');
    const photoButton = document.getElementById('reg-photo-button');

    function setProfilePreview(src) {
      if (!photoPreview) return;
      if (!src) {
        photoPreview.innerHTML = '<i class="fa-solid fa-camera" style="font-size:1.5rem;"></i>';
        photoPreview.style.backgroundImage = '';
        return;
      }
      photoPreview.innerHTML = '';
      photoPreview.style.backgroundImage = `url(${src})`;
      photoPreview.style.backgroundSize = 'cover';
      photoPreview.style.backgroundPosition = 'center';
    }

    if (photoPreview) {
      photoPreview.addEventListener('click', () => photoInput?.click());
    }
    if (photoButton) {
      photoButton.addEventListener('click', () => photoInput?.click());
    }

    if (photoInput) {
      photoInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          showMsg(errorBox, 'Please select a valid image file.', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          registerProfilePic = reader.result;
          setProfilePreview(registerProfilePic);
        };
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showMsg(errorBox, '', 'error');
      showMsg(successBox, '', 'success');

      const firstName = document.getElementById('reg-firstname')?.value?.trim() || '';
      const lastName = document.getElementById('reg-lastname')?.value?.trim() || '';
      const email = document.getElementById('reg-email')?.value?.trim() || '';
      const password = document.getElementById('reg-password')?.value || '';
      const phone = document.getElementById('reg-phone')?.value?.trim() || '';
      const city = document.getElementById('reg-city')?.value?.trim() || '';
      const country = document.getElementById('reg-country')?.value || '';

      if (!firstName || !email || !password) {
        showMsg(errorBox, 'First name, email, and password are required.', 'error');
        return;
      }

      const name = `${firstName} ${lastName}`.trim();
      const payload = { name, email, password, phone, city, country };
      if (registerProfilePic) payload.profilePic = registerProfilePic;

      try {
        const data = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        setToken(data.token);
        if (data.user) setUser(data.user);
        showMsg(successBox, '✅ Registration successful! Redirecting...', 'success');

        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      } catch (err) {
        showMsg(errorBox, `❌ ${err.message}`, 'error');
      }
    });
  }

  // ===== AUTH-PROTECTED PAGES =====
  function initAuthCheck() {
    // Only run on pages that are NOT login/register
    const isAuthPage = document.querySelector('.auth-page');
    if (isAuthPage) return;

    // Update sidebar user info if logged in
    const user = getUser();
    if (user) {
      const avatarEls = document.querySelectorAll('.sidebar-footer .avatar');
      const nameEls = document.querySelectorAll('.sidebar-footer .user-info strong');
      const initials = `${(user.firstName || user.name || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U';
      
      avatarEls.forEach(el => el.textContent = initials);
      nameEls.forEach(el => el.textContent = user.name || `${user.firstName} ${user.lastName}`);
    }
  }

  // ===== SIDEBAR MOBILE TOGGLE =====
  function initSidebar() {
    const toggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) && !toggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  }

  // ===== BACKEND CONNECTION TEST =====
  async function testConnection() {
    try {
      const data = await api('/api/test');
      console.log('✅ Backend connected:', data);
    } catch (err) {
      console.warn('⚠️ Backend not reachable. Running in offline/static mode.', err.message);
    }
  }

  // ===== INITIALIZATION =====
  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initRegister();
    initAuthCheck();
    initSidebar();
    testConnection();
  });

  // Expose for debugging
  window.TraveloopAuth = { getToken, getUser, clearToken, api };
})();
