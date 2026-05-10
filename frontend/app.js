/**
 * Traveloop — Frontend Application Controller
 * Handles login, registration, sidebar, logout, and page-level data loading.
 * Works with api-client.js for all backend communication.
 * Backend: Flask at http://localhost:5000
 */
(() => {
  let registerProfilePic = null;

  // ===== UTILITY HELPERS =====
  function showMsg(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
    el.style.color = type === 'error' ? '#ef4444' : '#22c55e';
  }

  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + ' min ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + ' hours ago';
    const days = Math.floor(hrs / 24);
    return days + ' days ago';
  }

  function formatCurrency(val) {
    return '$' + Number(val).toLocaleString('en-US');
  }

  // ===== LOGIN HANDLER =====
  function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
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
        const data = await loginUser(email, password);
        showMsg(successBox, 'Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      } catch (err) {
        showMsg(errorBox, err.message, 'error');
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
      photoPreview.style.backgroundImage = 'url(' + src + ')';
      photoPreview.style.backgroundSize = 'cover';
      photoPreview.style.backgroundPosition = 'center';
    }

    if (photoPreview) photoPreview.addEventListener('click', () => photoInput?.click());
    if (photoButton) photoButton.addEventListener('click', () => photoInput?.click());

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

      const name = (firstName + ' ' + lastName).trim();
      const payload = { name, email, password, phone, city, country };
      if (registerProfilePic) payload.profilePic = registerProfilePic;

      try {
        const data = await registerUser(payload);
        showMsg(successBox, 'Registration successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      } catch (err) {
        showMsg(errorBox, err.message, 'error');
      }
    });
  }

  // ===== SIDEBAR USER + LOGOUT =====
  function initSidebarUser() {
    const user = getStoredUser();
    if (user) {
      const avatarEls = document.querySelectorAll('.sidebar-footer .avatar');
      const nameEls = document.querySelectorAll('.sidebar-footer .user-info strong');
      const initials = getInitials(user.name).toUpperCase();

      avatarEls.forEach(el => {
        if (user.photo) {
          el.style.backgroundImage = 'url(' + user.photo + ')';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.textContent = '';
        } else {
          el.textContent = initials;
          el.style.backgroundImage = '';
        }
      });
      nameEls.forEach(el => el.textContent = user.name || 'Traveler');

      // Update welcome message if present
      const welcomeH2 = document.querySelector('.topbar h2');
      if (welcomeH2 && welcomeH2.textContent.includes('Welcome back')) {
        const firstName = user.name ? user.name.split(' ')[0] : 'Traveler';
        welcomeH2.innerHTML = 'Welcome back, ' + firstName + '! <span style="font-size:1.2rem;">&#10024;</span>';
      }
    }

    // Logout handler
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
      });
    });
  }

  // ===== SIDEBAR MOBILE TOGGLE =====
  function initSidebar() {
    const toggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) && !toggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  }

  // ===== PAGE: DASHBOARD (index.html) =====
  async function initDashboard() {
    if (!document.getElementById('dash-hero')) return;

    try {
      const trips = await fetchTrips();
      const container = document.getElementById('dash-prev-trips');
      if (!container || !Array.isArray(trips)) return;

      const completed = trips.filter(t => t.status === 'completed');
      if (completed.length > 0) {
        container.innerHTML = '';
        const icons = ['fa-mountain-sun', 'fa-umbrella-beach', 'fa-building', 'fa-plane'];
        const gradients = [
          'linear-gradient(135deg,var(--clr-cta),#fb923c)',
          'linear-gradient(135deg,var(--neon-cyan),var(--neon-violet))',
          'linear-gradient(135deg,#22c55e,var(--neon-cyan))',
          'linear-gradient(135deg,var(--clr-primary),var(--clr-secondary))'
        ];
        completed.forEach((trip, i) => {
          const card = document.createElement('div');
          card.className = 'glass-card';
          card.style.cssText = 'display:flex;gap:1rem;align-items:center;';
          card.innerHTML = '<div style="width:60px;height:60px;border-radius:12px;background:' + gradients[i % gradients.length] + ';display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;"><i class="fa-solid ' + icons[i % icons.length] + '"></i></div>' +
            '<div style="flex:1;"><h4 style="font-size:.95rem;">' + trip.title + '</h4><p style="font-size:.8rem;color:var(--text-muted);">' + trip.destination + ' &middot; ' + trip.startDate + '</p></div>' +
            '<span class="badge badge-green">Completed</span>';
          container.appendChild(card);
        });
      }
    } catch (e) {
      console.log('Dashboard: Using static data (backend offline)');
    }
  }

  // ===== PAGE: TRIP LISTING =====
  async function initTripListing() {
    const ongoingSection = document.getElementById('trip-ongoing-1');
    if (!ongoingSection) return;

    try {
      const trips = await fetchTrips();
      if (!Array.isArray(trips)) return;

      // Tag ongoing trips
      const ongoing = trips.filter(t => t.status === 'ongoing');
      const upcoming = trips.filter(t => t.status === 'upcoming');
      const completed = trips.filter(t => t.status === 'completed');

      console.log('[OK] Trips loaded from API:', trips.length, 'total');
    } catch (e) {
      console.log('Trip listing: Using static data');
    }
  }

  // ===== PAGE: COMMUNITY =====
  async function initCommunity() {
    const feed = document.getElementById('community-feed');
    if (!feed) return;

    try {
      const posts = await fetchCommunityPosts();
      if (!Array.isArray(posts) || posts.length === 0) return;

      feed.innerHTML = '';
      const avatarColors = [
        'linear-gradient(135deg,var(--neon-cyan),var(--neon-violet))',
        'linear-gradient(135deg,var(--clr-cta),#fb923c)',
        'linear-gradient(135deg,#22c55e,var(--neon-cyan))',
        'linear-gradient(135deg,var(--neon-violet),var(--neon-purple))'
      ];
      const badgeClasses = { 'Travel Tip': 'badge-cyan', 'Review': 'badge-orange', 'Question': 'badge-violet', 'Post': 'badge-green' };

      posts.forEach((post, i) => {
        const initials = getInitials(post.author);
        const badge = badgeClasses[post.type] || 'badge-cyan';
        const card = document.createElement('div');
        card.className = 'glass-card post-card fade-in';
        card.style.animationDelay = (i * 0.15) + 's';
        card.innerHTML =
          '<div class="post-header">' +
            '<div class="post-avatar" style="background:' + avatarColors[i % avatarColors.length] + ';">' + initials + '</div>' +
            '<div><strong>' + post.author + '</strong><div class="post-meta">' + timeAgo(post.createdAt) + ' &middot; <span class="badge ' + badge + '" style="font-size:.7rem;">' + post.type + '</span></div></div>' +
          '</div>' +
          '<p style="font-size:.9rem;line-height:1.7;">' + post.content + '</p>' +
          '<div class="post-actions">' +
            '<button><i class="fa-solid fa-heart"></i> ' + post.likes + '</button>' +
            '<button><i class="fa-solid fa-comment"></i> ' + post.comments + '</button>' +
            '<button><i class="fa-solid fa-share"></i> Share</button>' +
            '<button><i class="fa-solid fa-bookmark"></i> Save</button>' +
          '</div>';
        feed.appendChild(card);
      });
    } catch (e) {
      console.log('Community: Using static data');
    }
  }

  // ===== PAGE: INVOICE =====
  async function initInvoice() {
    const headerCard = document.getElementById('invoice-header-card');
    if (!headerCard) return;

    try {
      const invoices = await fetchInvoices();
      if (!Array.isArray(invoices) || invoices.length === 0) return;
      const inv = invoices[0];

      // Update header
      const titleEl = headerCard.querySelector('h3');
      if (titleEl) titleEl.textContent = inv.tripTitle;

      // Update status badge
      const statusBadge = headerCard.querySelector('.badge');
      if (statusBadge && inv.status === 'paid') {
        statusBadge.className = 'badge badge-green';
        statusBadge.innerHTML = '<i class="fa-solid fa-check-circle"></i> Paid';
      }

      // Mark as Paid button
      const markPaidBtn = document.getElementById('inv-mark-paid');
      if (markPaidBtn) {
        markPaidBtn.addEventListener('click', async () => {
          try {
            await markInvoicePaid(inv.id);
            markPaidBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Paid';
            markPaidBtn.disabled = true;
            markPaidBtn.style.opacity = '0.6';
            if (statusBadge) {
              statusBadge.className = 'badge badge-green';
              statusBadge.innerHTML = '<i class="fa-solid fa-check-circle"></i> Paid';
            }
          } catch (e) {
            alert('Failed to mark as paid: ' + e.message);
          }
        });
      }

      console.log('[OK] Invoice loaded from API:', inv.id);
    } catch (e) {
      console.log('Invoice: Using static data');
    }
  }

  // ===== PAGE: ACTIVITY SEARCH =====
  async function initActivitySearch() {
    const resultsGrid = document.getElementById('activity-results');
    if (!resultsGrid) return;

    try {
      const activities = await fetchActivities();
      if (!Array.isArray(activities) || activities.length === 0) return;

      // Update results count
      const countBadge = document.querySelector('.section-header .badge');
      if (countBadge) countBadge.textContent = activities.length + ' found';

      const icons = {
        'Adventure': 'fa-parachute-box', 'Water Sport': 'fa-water', 'Cultural': 'fa-palette',
        'Nature': 'fa-person-hiking', 'Culinary': 'fa-utensils', 'default': 'fa-star'
      };
      const gradients = {
        'Adventure': 'linear-gradient(135deg,#ef4444,var(--clr-cta))',
        'Water Sport': 'linear-gradient(135deg,var(--neon-cyan),#22c55e)',
        'Cultural': 'linear-gradient(135deg,var(--neon-violet),var(--neon-purple))',
        'Nature': 'linear-gradient(135deg,var(--clr-primary),var(--clr-secondary))',
        'Culinary': 'linear-gradient(135deg,#f97316,#eab308)',
        'default': 'linear-gradient(135deg,#22c55e,var(--neon-cyan))'
      };
      const badgeMap = {
        'Adventure': 'badge-orange', 'Water Sport': 'badge-cyan', 'Cultural': 'badge-violet',
        'Nature': 'badge-green', 'Culinary': 'badge-orange', 'default': 'badge-cyan'
      };

      resultsGrid.innerHTML = '';
      activities.forEach((act) => {
        const icon = icons[act.type] || icons['default'];
        const grad = gradients[act.type] || gradients['default'];
        const badge = badgeMap[act.type] || badgeMap['default'];
        const card = document.createElement('div');
        card.className = 'dest-card';
        card.innerHTML =
          '<div class="card-img" style="background:' + grad + ';"><i class="fa-solid ' + icon + '"></i></div>' +
          '<div class="card-body"><h4>' + act.name + '</h4><p>' + (act.location || '') + '</p><span class="badge ' + badge + '">' + act.type + '</span></div>' +
          '<div class="card-footer"><span>$' + act.price + '/person</span><a href="itinerary-view.html" class="btn btn-outline btn-sm">View</a></div>';
        resultsGrid.appendChild(card);
      });
    } catch (e) {
      console.log('Activities: Using static data');
    }
  }

  // ===== PAGE: CREATE TRIP =====
  function initCreateTrip() {
    const form = document.getElementById('create-trip-form');
    if (!form) return;

    const continueBtn = document.getElementById('trip-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', async (e) => {
        const place = document.getElementById('trip-place')?.value?.trim();
        const startDate = document.getElementById('trip-start')?.value;
        const endDate = document.getElementById('trip-end')?.value;

        if (!place || !startDate || !endDate) return; // Let default link behavior work

        e.preventDefault();
        try {
          const data = await createTrip({
            title: place + ' Trip',
            destination: place,
            startDate: startDate,
            endDate: endDate,
            budget: 0,
            cities: 1,
          });
          console.log('[OK] Trip created:', data);
          window.location.href = 'build-itinerary.html';
        } catch (err) {
          alert('Failed to create trip: ' + err.message);
        }
      });
    }
  }

  // ===== PAGE: PROFILE =====
  async function initProfile() {
    const profileHeader = document.getElementById('profile-header');
    if (!profileHeader) return;

    try {
      const user = await fetchUserProfile();
      if (!user) return;

      // Store locally too
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      const avatar = document.getElementById('profile-avatar');
      if (user.photo && avatar) {
        avatar.style.backgroundImage = 'url(' + user.photo + ')';
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
      } else if (avatar) {
        avatar.textContent = getInitials(user.name).toUpperCase();
      }

      const nameH3 = profileHeader.querySelector('h3');
      if (nameH3) nameH3.textContent = user.name || '';

      const infoP = profileHeader.querySelector('p');
      if (infoP) infoP.textContent = (user.email || '') + ' · ' + (user.city || '') + ', ' + (user.country || '');

      // Fill form fields
      const fullName = user.name || '';
      const [firstName = '', lastName = ''] = fullName.split(' ');
      const fields = {
        'profile-fname': user.firstName || firstName,
        'profile-lname': user.lastName || lastName,
        'profile-email': user.email || '',
        'profile-phone': user.phone || '',
        'profile-city': user.city || '',
        'profile-country': user.country || ''
      };
      Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });

      // Edit/Save profile button
      const editBtn = document.getElementById('profile-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', async () => {
          const updatedData = {
            name: (document.getElementById('profile-fname')?.value || '') + ' ' + (document.getElementById('profile-lname')?.value || ''),
            firstName: document.getElementById('profile-fname')?.value || '',
            lastName: document.getElementById('profile-lname')?.value || '',
            email: document.getElementById('profile-email')?.value || '',
            phone: document.getElementById('profile-phone')?.value || '',
            city: document.getElementById('profile-city')?.value || '',
            country: document.getElementById('profile-country')?.value || '',
          };
          try {
            const updated = await updateUserProfile(updatedData);
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            alert('Profile updated successfully!');
          } catch (err) {
            alert('Failed to update profile: ' + err.message);
          }
        });
      }
    } catch (e) {
      // Fall back to localStorage
      console.log('Profile: Using localStorage data');
      const userData = localStorage.getItem(USER_KEY);
      if (!userData) return;
      const user = JSON.parse(userData);
      const fullName = user.name || '';
      const [firstName = '', lastName = ''] = fullName.split(' ');
      const el = (id) => document.getElementById(id);
      if (el('profile-fname')) el('profile-fname').value = firstName;
      if (el('profile-lname')) el('profile-lname').value = lastName;
      if (el('profile-email')) el('profile-email').value = user.email || '';
      if (el('profile-phone')) el('profile-phone').value = user.phone || '';
      if (el('profile-city')) el('profile-city').value = user.city || '';
      if (el('profile-country')) el('profile-country').value = user.country || '';
    }
  }

  // ===== PAGE: PACKING CHECKLIST =====
  async function initPackingChecklist() {
    const checklistContainer = document.getElementById('checklist-categories');
    if (!checklistContainer) return;

    try {
      const checklists = await fetchChecklists();
      if (!Array.isArray(checklists) || checklists.length === 0) return;
      console.log('[OK] Checklists loaded from API:', checklists.length);
    } catch (e) {
      console.log('Checklists: Using static data');
    }
  }

  // ===== PAGE: TRIP NOTES =====
  async function initTripNotes() {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;

    try {
      const notes = await fetchNotes();
      if (!Array.isArray(notes) || notes.length === 0) return;
      console.log('[OK] Notes loaded from API:', notes.length);
    } catch (e) {
      console.log('Notes: Using static data');
    }
  }

  // ===== PAGE: ADMIN =====
  async function initAdmin() {
    const adminPage = document.getElementById('admin-stats');
    if (!adminPage) return;

    try {
      const analytics = await fetchAdminAnalytics();
      if (!analytics) return;

      // Update stat cards
      const statValues = adminPage.querySelectorAll('.stat-value');
      if (statValues.length >= 4) {
        statValues[0].textContent = analytics.totalUsers?.toLocaleString() || '0';
        statValues[1].textContent = analytics.totalTrips?.toLocaleString() || '0';
        statValues[2].textContent = analytics.citiesCovered?.toLocaleString() || '0';
        statValues[3].textContent = '$' + (analytics.revenue / 100000).toFixed(1) + 'L';
      }
      console.log('[OK] Admin analytics loaded from API');
    } catch (e) {
      console.log('Admin: Using static data');
    }
  }

  // ===== INITIALIZATION =====
  document.addEventListener('DOMContentLoaded', () => {
    // Auth pages
    initLogin();
    initRegister();

    // Sidebar on all pages
    initSidebar();
    initSidebarUser();

    // Page-specific loaders
    initDashboard();
    initTripListing();
    initCommunity();
    initInvoice();
    initActivitySearch();
    initCreateTrip();
    initProfile();
    initPackingChecklist();
    initTripNotes();
    initAdmin();

    // Backend connection test
    testBackendConnection();
  });

  // Expose for debugging
  window.TraveloopAuth = { getStoredUser, isLoggedIn, logoutUser };
})();
