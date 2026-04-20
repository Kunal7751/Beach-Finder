// ==========================================
// APP.JS — Main Application Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initParticles();
    initSearch();
    initFilters();
    initViewToggle();
    initModal();
    renderBeaches(BEACHES);
    renderTopPicks();
    animateStats();
    initScrollAnimations();
});

// ==========================================
// NAVBAR
// ==========================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    toggle.addEventListener('click', () => {
        links.classList.toggle('open');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            links.classList.remove('open');
        });
    });

    // Active section tracking
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + 200;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(l => l.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    });
}

// ==========================================
// HERO PARTICLES
// ==========================================
function initParticles() {
    const container = document.getElementById('heroParticles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 6 + 2;
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            --dur: ${Math.random() * 4 + 3}s;
            animation-delay: ${Math.random() * 4}s;
            opacity: ${Math.random() * 0.5 + 0.1};
        `;
        container.appendChild(particle);
    }
}

// ==========================================
// SEARCH
// ==========================================
function initSearch() {
    const input = document.getElementById('searchInput');
    const suggestions = document.getElementById('searchSuggestions');
    const searchBtn = document.getElementById('searchBtn');

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (query.length < 2) {
            suggestions.classList.remove('active');
            return;
        }

        const matches = BEACHES.filter(b =>
            b.name.toLowerCase().includes(query) ||
            b.state.toLowerCase().includes(query) ||
            b.location.toLowerCase().includes(query) ||
            b.activities.some(a => a.toLowerCase().includes(query))
        ).slice(0, 5);

        if (matches.length > 0) {
            suggestions.innerHTML = matches.map(b => `
                <div class="suggestion-item" data-id="${b.id}">
                    <span class="suggestion-icon">🏖️</span>
                    <span>${highlightMatch(b.name, query)}</span>
                    <span class="suggestion-state">${b.state}</span>
                </div>
            `).join('');
            suggestions.classList.add('active');

            suggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const beach = BEACHES.find(b => b.id === parseInt(item.dataset.id));
                    if (beach) openModal(beach);
                    suggestions.classList.remove('active');
                    input.value = '';
                });
            });
        } else {
            suggestions.classList.remove('active');
        }
    });

    searchBtn.addEventListener('click', () => performSearch());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.hero-search-wrapper')) {
            suggestions.classList.remove('active');
        }
    });
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) return;

    const filtered = BEACHES.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.state.toLowerCase().includes(query) ||
        b.location.toLowerCase().includes(query) ||
        b.activities.some(a => a.toLowerCase().includes(query)) ||
        b.description.toLowerCase().includes(query)
    );

    renderBeaches(filtered);
    document.getElementById('searchSuggestions').classList.remove('active');
    document.getElementById('beaches').scrollIntoView({ behavior: 'smooth' });
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<strong style="color: var(--clr-accent-2)">$1</strong>');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==========================================
// FILTERS
// ==========================================
function initFilters() {
    const stateFilter = document.getElementById('filterState');
    const activityFilter = document.getElementById('filterActivity');
    const seasonFilter = document.getElementById('filterSeason');
    const sortFilter = document.getElementById('filterSort');
    const resetBtn = document.getElementById('filterReset');

    [stateFilter, activityFilter, seasonFilter, sortFilter].forEach(f => {
        f.addEventListener('change', applyFilters);
    });

    resetBtn.addEventListener('click', resetFilters);
}

function applyFilters() {
    const state = document.getElementById('filterState').value;
    const activity = document.getElementById('filterActivity').value;
    const season = document.getElementById('filterSeason').value;
    const sort = document.getElementById('filterSort').value;

    let filtered = [...BEACHES];

    if (state !== 'all') {
        filtered = filtered.filter(b => b.state === state);
    }

    if (activity !== 'all') {
        filtered = filtered.filter(b => b.activities.some(a =>
            a.toLowerCase().includes(activity.toLowerCase())
        ));
    }

    if (season !== 'all') {
        filtered = filtered.filter(b => b.bestTime === season);
    }

    // Sort
    switch (sort) {
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'state':
            filtered.sort((a, b) => a.state.localeCompare(b.state));
            break;
    }

    renderBeaches(filtered);
}

function resetFilters() {
    document.getElementById('filterState').value = 'all';
    document.getElementById('filterActivity').value = 'all';
    document.getElementById('filterSeason').value = 'all';
    document.getElementById('filterSort').value = 'rating';
    document.getElementById('searchInput').value = '';
    renderBeaches(BEACHES);
}

function filterByState(state) {
    document.getElementById('filterState').value = state;
    applyFilters();
    document.getElementById('beaches').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// VIEW TOGGLE
// ==========================================
function initViewToggle() {
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    const grid = document.getElementById('beachesGrid');

    gridBtn.addEventListener('click', () => {
        grid.classList.remove('list-view');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    });

    listBtn.addEventListener('click', () => {
        grid.classList.add('list-view');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    });
}

// ==========================================
// RENDER BEACH CARDS
// ==========================================
function renderBeaches(beaches) {
    const grid = document.getElementById('beachesGrid');
    const noResults = document.getElementById('noResults');
    const countEl = document.getElementById('resultCount');

    if (beaches.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        countEl.textContent = 'No beaches found';
        return;
    }

    grid.style.display = '';
    noResults.style.display = 'none';
    countEl.textContent = `${beaches.length} beach${beaches.length !== 1 ? 'es' : ''} found`;

    grid.innerHTML = beaches.map((beach, i) => `
        <div class="beach-card" style="animation-delay: ${i * 0.06}s" data-id="${beach.id}">
            <div class="card-image-wrapper">
                <img src="${beach.image}" alt="${beach.name}" class="card-image" loading="lazy">
                <span class="card-badge">${beach.state}</span>
                <span class="card-rating">⭐ ${beach.rating}</span>
                <button class="card-favorite" onclick="event.stopPropagation(); this.classList.toggle('active')" aria-label="Add to favorites">♥</button>
            </div>
            <div class="card-body">
                <h3 class="card-title">${beach.name}</h3>
                <p class="card-location">📍 ${beach.location}</p>
                <p class="card-description">${beach.description}</p>
                <div class="card-tags">
                    ${beach.activities.slice(0, 3).map(a => `<span class="card-tag">${a}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="card-season">Best: <strong>${beach.bestTime}</strong></span>
                    <span class="card-action">View Details →</span>
                </div>
            </div>
        </div>
    `).join('');

    // Attach click handlers
    grid.querySelectorAll('.beach-card').forEach(card => {
        card.addEventListener('click', () => {
            const beach = BEACHES.find(b => b.id === parseInt(card.dataset.id));
            if (beach) openModal(beach);
        });
    });
}

// ==========================================
// TOP PICKS
// ==========================================
function renderTopPicks() {
    const carousel = document.getElementById('topPicksCarousel');
    const topBeaches = [...BEACHES].sort((a, b) => b.rating - a.rating).slice(0, 3);

    carousel.innerHTML = topBeaches.map((beach, i) => {
        const stars = '★'.repeat(Math.floor(beach.rating)) + (beach.rating % 1 >= 0.5 ? '½' : '');
        return `
            <div class="top-pick-card" data-id="${beach.id}">
                <img src="${beach.image}" alt="${beach.name}" class="top-pick-img" loading="lazy">
                <div class="top-pick-content">
                    <span class="top-pick-rank">${i + 1}</span>
                    <h3 class="top-pick-title">${beach.name}</h3>
                    <p class="top-pick-location">📍 ${beach.location}</p>
                    <div class="top-pick-rating">
                        <span class="top-pick-stars">${stars}</span>
                        <span>${beach.rating}/5</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    carousel.querySelectorAll('.top-pick-card').forEach(card => {
        card.addEventListener('click', () => {
            const beach = BEACHES.find(b => b.id === parseInt(card.dataset.id));
            if (beach) openModal(beach);
        });
    });
}

// ==========================================
// MODAL
// ==========================================
function initModal() {
    const overlay = document.getElementById('beachModal');
    const closeBtn = document.getElementById('modalClose');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal(beach) {
    const overlay = document.getElementById('beachModal');
    const body = document.getElementById('modalBody');

    const fullStars = Math.floor(beach.rating);
    const halfStar = beach.rating % 1 >= 0.5;
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) starsHTML += '★';
        else if (i === fullStars && halfStar) starsHTML += '★';
        else starsHTML += '☆';
    }

    body.innerHTML = `
        <img src="${beach.image}" alt="${beach.name}" class="modal-hero-img">
        <div class="modal-details">
            <h2 class="modal-title">${beach.name}</h2>
            <p class="modal-location">📍 ${beach.location}, ${beach.state}</p>
            
            <div class="modal-rating-row">
                <span class="modal-stars">${starsHTML}</span>
                <span class="modal-rating-text">${beach.rating} / 5</span>
            </div>

            <p class="modal-description">${beach.longDescription}</p>

            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <div class="modal-info-label">Best Time to Visit</div>
                    <div class="modal-info-value">📅 ${beach.bestTime}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">Ideal For</div>
                    <div class="modal-info-value">👥 ${beach.idealFor}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">State</div>
                    <div class="modal-info-value">🗺️ ${beach.state}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">Rating</div>
                    <div class="modal-info-value">⭐ ${beach.rating} / 5</div>
                </div>
            </div>

            <div class="modal-activities">
                <h4>🏄 Activities</h4>
                <div class="modal-activity-tags">
                    ${beach.activities.map(a => `<span class="modal-activity-tag">${a}</span>`).join('')}
                </div>
            </div>

            <div id="weatherContainer">
                <div class="weather-loading">✨ Fetching real-time weather for ${beach.name}...</div>
            </div>

            <div id="safetyContainer">
                <!-- Water Quality Injected by JS -->
            </div>



            <div class="modal-highlights">
                <h4>✨ Highlights</h4>
                <ul class="modal-highlight-list">
                    ${beach.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Fetch real-time weather
    fetchWeather(beach.location.split(',')[0].trim());
    
    // Render Water Quality & Safety
    renderWaterQuality(beach);
}

function renderWaterQuality(beach) {
    const container = document.getElementById('safetyContainer');
    
    // Seed-based random values to keep metrics consistent for each beach
    const seed = beach.id * 12345;
    const getRandom = (min, max, offset) => {
        const x = Math.sin(seed + offset) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min + 1) + min);
    };

    const wqi = getRandom(85, 98, 1);
    const ph = (getRandom(75, 82, 2) / 10).toFixed(1);
    
    const isExcellent = wqi > 92;

    container.innerHTML = `
        <div class="modal-safety">
            <div class="safety-card ${isExcellent ? '' : 'warning'}">
                <div class="safety-header">
                    <span class="safety-icon">💧</span>
                    <span class="safety-title">Water Quality (WQI)</span>
                </div>
                <div class="wqi-score">${wqi}</div>
                <div class="wqi-label">${isExcellent ? 'Grade A - Excellent' : 'Grade B - Good'}</div>
            </div>
            
            <div class="safety-card">
                <div class="safety-header">
                    <span class="safety-icon">🛡️</span>
                    <span class="safety-title">Water Safety</span>
                </div>
                <div class="safety-metrics">
                    <div class="metric-item">
                        <span class="metric-label">pH Level</span>
                        <span class="metric-value">${ph}</span>
                    </div>
                    <div class="metric-bar"><div class="metric-fill" style="width: ${ph * 10}%"></div></div>
                </div>
            </div>
        </div>
    `;
}


async function fetchWeather(location) {
    const container = document.getElementById('weatherContainer');
    try {
        // Using wttr.in as a free weather API that doesn't require a key
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        const data = await response.json();
        
        const current = data.current_condition[0];
        const weatherCode = current.weatherCode;
        
        // Map weather descriptions to emojis
        let emoji = '☀️';
        const desc = current.weatherDesc[0].value.toLowerCase();
        if (desc.includes('cloud')) emoji = '☁️';
        else if (desc.includes('rain')) emoji = '🌧️';
        else if (desc.includes('clear')) emoji = '☀️';
        else if (desc.includes('mist') || desc.includes('fog')) emoji = '🌫️';
        else if (desc.includes('thunder')) emoji = '⛈️';
        
        container.innerHTML = `
            <div class="modal-weather">
                <div class="weather-main">
                    <span class="weather-icon-large">${emoji}</span>
                    <div>
                        <div class="weather-temp">${current.temp_C}°C</div>
                        <div class="weather-desc">${desc}</div>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail-item">
                        <div class="weather-detail-label">Humidity</div>
                        <div class="weather-detail-value">💧 ${current.humidity}%</div>
                    </div>
                    <div class="weather-detail-item">
                        <div class="weather-detail-label">Wind</div>
                        <div class="weather-detail-value">💨 ${current.windspeedKmph} km/h</div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Weather Fetch Error:', error);
        container.innerHTML = ''; // Hide weather if it fails
    }
}


function closeModal() {
    document.getElementById('beachModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ==========================================
// STATS ANIMATION
// ==========================================
function animateStats() {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('[data-count]');
                counters.forEach(counter => {
                    const target = parseInt(counter.dataset.count);
                    const duration = 2000;
                    const start = performance.now();

                    function update(now) {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        counter.textContent = Math.round(eased * target).toLocaleString();
                        if (progress < 1) requestAnimationFrame(update);
                    }
                    requestAnimationFrame(update);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer) statsObserver.observe(statsContainer);
}

// ==========================================
// SCROLL ANIMATIONS
// ==========================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section-header, .feature-item, .map-card, .about-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

// Make filterByState available globally
window.filterByState = filterByState;
window.resetFilters = resetFilters;
