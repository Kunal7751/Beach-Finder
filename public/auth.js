// ==========================================
// AUTH.JS — Frontend Authentication Logic
// ==========================================
const API_BASE = window.location.origin + '/api';

// ==========================================
// AUTH STATE
// ==========================================
let currentUser = null;
let authToken = localStorage.getItem('beachToken') || null;

// On page load, check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    if (authToken) {
        loadUserProfile();
    }
});

// ==========================================
// INIT AUTH UI
// ==========================================
function initAuthUI() {
    const authModal = document.getElementById('authModal');
    const authClose = document.getElementById('authClose');
    const loginBtn = document.getElementById('loginNavBtn');
    const tabBtns = document.querySelectorAll('.auth-tab-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal();
        });
    }

    if (authClose) {
        authClose.addEventListener('click', closeAuthModal);
    }

    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(btn.dataset.tab + 'Form').classList.add('active');
        });
    });

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Profile update form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

// ==========================================
// OPEN / CLOSE AUTH MODAL
// ==========================================
function openAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    clearAuthErrors();
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.body.style.overflow = '';
}

function clearAuthErrors() {
    document.querySelectorAll('.auth-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    document.querySelectorAll('.auth-success').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

function showAuthError(formId, message) {
    const errorEl = document.querySelector(`#${formId} .auth-error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function showAuthSuccess(formId, message) {
    const successEl = document.querySelector(`#${formId} .auth-success`);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
}

// ==========================================
// REGISTER
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    clearAuthErrors();

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const country = document.getElementById('regCountry').value.trim();
    const state = document.getElementById('regState').value.trim();
    const city = document.getElementById('regCity').value.trim();

    if (!username || !email || !password) {
        showAuthError('registerForm', 'Please fill in all required fields');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, country, state, city })
        });

        const data = await res.json();

        if (!res.ok) {
            showAuthError('registerForm', data.error || 'Registration failed');
            return;
        }

        // Save token and user
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('beachToken', authToken);

        showAuthSuccess('registerForm', '🎉 Registration successful!');
        setTimeout(() => {
            closeAuthModal();
            updateUIForLoggedInUser();
        }, 1000);
    } catch (err) {
        showAuthError('registerForm', 'Network error. Make sure the server is running.');
    }
}

// ==========================================
// LOGIN
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    clearAuthErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAuthError('loginForm', 'Please enter email and password');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showAuthError('loginForm', data.error || 'Login failed');
            return;
        }

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('beachToken', authToken);

        showAuthSuccess('loginForm', '✅ Login successful!');
        setTimeout(() => {
            closeAuthModal();
            updateUIForLoggedInUser();
        }, 1000);
    } catch (err) {
        showAuthError('loginForm', 'Network error. Make sure the server is running.');
    }
}

// ==========================================
// LOGOUT
// ==========================================
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('beachToken');
    updateUIForLoggedOutUser();
}

// ==========================================
// LOAD USER PROFILE
// ==========================================
async function loadUserProfile() {
    try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!res.ok) {
            handleLogout();
            return;
        }

        const data = await res.json();
        currentUser = data.user;
        updateUIForLoggedInUser();
    } catch (err) {
        // Server might not be running, just stay logged out
        console.log('Could not connect to server for profile');
    }
}

// ==========================================
// UPDATE PROFILE
// ==========================================
async function handleProfileUpdate(e) {
    e.preventDefault();

    const username = document.getElementById('profileUsername').value.trim();
    const country = document.getElementById('profileCountry').value.trim();
    const state = document.getElementById('profileState').value.trim();
    const city = document.getElementById('profileCity').value.trim();

    try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ username, country, state, city })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Update failed');
            return;
        }

        currentUser = data.user;
        updateUIForLoggedInUser();
        alert('✅ Profile updated successfully!');
    } catch (err) {
        alert('Network error. Make sure the server is running.');
    }
}

// ==========================================
// TOGGLE FAVORITE
// ==========================================
async function toggleFavorite(beachId, btnEl) {
    if (!authToken || !currentUser) {
        openAuthModal();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/favorites/${beachId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await res.json();
        if (res.ok) {
            currentUser.favoriteBeaches = data.favoriteBeaches;
            if (btnEl) {
                btnEl.classList.toggle('active', data.favoriteBeaches.includes(beachId));
            }
            // Update all favorite buttons for this beach
            document.querySelectorAll(`.card-favorite[data-beach-id="${beachId}"]`).forEach(btn => {
                btn.classList.toggle('active', data.favoriteBeaches.includes(beachId));
            });
        }
    } catch (err) {
        console.log('Error toggling favorite');
    }
}

// ==========================================
// UI UPDATES
// ==========================================
function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginNavBtn');
    const userMenu = document.getElementById('userNavMenu');

    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) {
        userMenu.style.display = 'flex';
        const usernameEl = document.getElementById('navUsername');
        if (usernameEl) usernameEl.textContent = currentUser.username;
        const locationEl = document.getElementById('navUserLocation');
        if (locationEl) {
            const parts = [currentUser.city, currentUser.state, currentUser.country].filter(Boolean);
            locationEl.textContent = parts.join(', ') || 'Set your location';
        }
    }

    // Fill profile form
    if (currentUser) {
        const el = (id) => document.getElementById(id);
        if (el('profileUsername')) el('profileUsername').value = currentUser.username || '';
        if (el('profileCountry')) el('profileCountry').value = currentUser.country || '';
        if (el('profileState')) el('profileState').value = currentUser.state || '';
        if (el('profileCity')) el('profileCity').value = currentUser.city || '';
    }

    // Update favorite buttons
    if (currentUser && currentUser.favoriteBeaches) {
        document.querySelectorAll('.card-favorite').forEach(btn => {
            const beachId = parseInt(btn.dataset.beachId);
            if (currentUser.favoriteBeaches.includes(beachId)) {
                btn.classList.add('active');
            }
        });
    }
}

function updateUIForLoggedOutUser() {
    const loginBtn = document.getElementById('loginNavBtn');
    const userMenu = document.getElementById('userNavMenu');

    if (loginBtn) loginBtn.style.display = '';
    if (userMenu) userMenu.style.display = 'none';

    // Remove active from all favorites
    document.querySelectorAll('.card-favorite.active').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Make functions globally accessible
window.toggleFavorite = toggleFavorite;
window.openAuthModal = openAuthModal;
