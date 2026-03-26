// ========== AUTHENTICATION & USER MANAGEMENT ==========

let currentUser = null; // { name, email, role, avatar, phone, studentId }


function loadUser() {
    const user = localStorage.getItem('kem_user');
    if (user) {
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

function saveUser(user) {
    localStorage.setItem('kem_user', JSON.stringify(user));
    currentUser = user;
    updateProfileUI();
    updateNavbarProfile();
}

function logout() {
    localStorage.removeItem('kem_user');
    localStorage.removeItem('kem_token');
    window.location.href = '/index.html';
}

function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('roleContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
}

function showRoleSelection() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('roleContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('roleContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    updateProfileUI();
    updateNavbarProfile();
    
    // Show/hide Organizer link based on role
    const orgLink = document.getElementById('organizerLink');
    const mobileOrgLink = document.getElementById('mobileOrganizerLink');
    if (currentUser.role === 'organizer') {
        orgLink.style.display = 'inline';
        mobileOrgLink.style.display = 'block';
    } else {
        orgLink.style.display = 'none';
        mobileOrgLink.style.display = 'none';
    }
    
    // Start with home view
    showHome();
}

function updateProfileUI() {
    if (!currentUser) return;
    const shortName = currentUser.name || currentUser.email.split('@')[0];
    document.getElementById('profileNameShort').textContent = shortName;
    document.getElementById('profileDisplayName').textContent = currentUser.name || shortName;
    document.getElementById('profileDisplayEmail').textContent = currentUser.email;
    document.getElementById('profileDisplayRole').textContent = `Role: ${currentUser.role === 'organizer' ? 'Organizer' : 'Student'}`;
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileStudentId').value = currentUser.studentId || '';
    document.getElementById('profileRole').value = currentUser.role === 'organizer' ? 'Organizer' : 'Student';
    
    // Avatar
    if (currentUser.avatar) {
        document.getElementById('profileAvatarImg').src = currentUser.avatar;
        document.getElementById('profileAvatarImg').style.display = 'block';
        document.getElementById('profileAvatarPlaceholder').style.display = 'none';
        document.getElementById('profileAvatarUrl').value = currentUser.avatar;
    } else {
        document.getElementById('profileAvatarImg').style.display = 'none';
        document.getElementById('profileAvatarPlaceholder').style.display = 'flex';
        document.getElementById('profileAvatarUrl').value = '';
    }
}

function updateNavbarProfile() {
    if (!currentUser) return;
    const profileLink = document.getElementById('profileLink');
    const icon = document.getElementById('profileIcon');
    const img = document.getElementById('profileNavImage');
    const nameSpan = document.getElementById('profileNameShort');
    
    nameSpan.textContent = currentUser.name || currentUser.email.split('@')[0];
    
    if (currentUser.avatar) {
        img.src = currentUser.avatar;
        img.style.display = 'inline-block';
        icon.style.display = 'none';
    } else {
        img.style.display = 'none';
        icon.style.display = 'inline-block';
    }
}

function switchAuthTab(tab) {
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.remove('active');
    if (tab === 'login') {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('signupTab').classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    document.getElementById('loginSuccess').style.display = 'none';

    if (email && password) {
        // Call backend login API
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('kem_token', data.token);
                saveUser(data.user);
                loadEventsFromAPI().then(() => showMainApp());
            } else {
                errorEl.textContent = data.message || 'Login failed';
                errorEl.style.display = 'block';
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            errorEl.textContent = 'Login error. Please check your connection.';
            errorEl.style.display = 'block';
        });
    } else {
        errorEl.textContent = 'Please fill all fields';
        errorEl.style.display = 'block';
    }
}

let pendingSignupData = null;

function showSignupError(msg) {
    const el = document.getElementById('signupError');
    el.textContent = msg;
    el.style.display = 'block';
}

function handleSignup(e) {
    e.preventDefault();
    document.getElementById('signupError').style.display = 'none';
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const studentId = document.getElementById('signupStudentId').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirmPassword').value;

    if (!name || !email || !phone || !studentId || !password || !confirm) {
        showSignupError('Please fill in all fields.');
        return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
        showSignupError('Only Gmail addresses (@gmail.com) are allowed.');
        return;
    }

    if (!/(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
        showSignupError('Password must contain at least one uppercase letter and one symbol.');
        return;
    }

    if (password !== confirm) {
        showSignupError('Passwords do not match.');
        return;
    }

    pendingSignupData = { name, email, phone, studentId, password, confirmPassword: confirm };
    showRoleSelection();
}

let selectedRole = null;
function selectRole(role) {
    selectedRole = role;
    document.getElementById('roleStudent').classList.remove('selected');
    document.getElementById('roleOrganizer').classList.remove('selected');
    if (role === 'student') {
        document.getElementById('roleStudent').classList.add('selected');
    } else {
        document.getElementById('roleOrganizer').classList.add('selected');
    }
}

function showRoleError(msg) {
    const el = document.getElementById('roleError');
    el.textContent = msg;
    el.style.display = 'block';
}

function confirmRole() {
    document.getElementById('roleError').style.display = 'none';

    if (!selectedRole) {
        showRoleError('Please select a role to continue.');
        return;
    }
    if (!pendingSignupData) {
        showRoleError('Something went wrong. Please sign up again.');
        return;
    }

    const confirmBtn = document.querySelector('#roleContainer .auth-btn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Please wait...';
    }

    fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pendingSignupData, role: selectedRole })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            pendingSignupData = null;
            selectedRole = null;
            document.querySelector('#signupForm form').reset();
            document.getElementById('roleContainer').style.display = 'none';
            document.getElementById('authContainer').style.display = 'flex';
            const successMsg = 'Registration successful! A verification email has been sent to your inbox. Please verify before logging in.';
            showToast(successMsg);
            setTimeout(() => {
                switchAuthTab('login');
                const successEl = document.getElementById('loginSuccess');
                successEl.textContent = successMsg;
                successEl.style.display = 'block';
            }, 1000);
        } else {
            document.getElementById('roleContainer').style.display = 'none';
            document.getElementById('authContainer').style.display = 'flex';
            switchAuthTab('signup');
            showSignupError(data.message || 'Registration failed.');
        }
    })
    .catch(() => {
        document.getElementById('roleContainer').style.display = 'none';
        document.getElementById('authContainer').style.display = 'flex';
        switchAuthTab('signup');
        showSignupError('Registration error. Please check your connection.');
    })
    .finally(() => {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Continue';
        }
    });
}

// Profile functions
function previewAvatar() {
    const url = document.getElementById('profileAvatarUrl').value;
    if (url) {
        document.getElementById('profileAvatarImg').src = url;
        document.getElementById('profileAvatarImg').style.display = 'block';
        document.getElementById('profileAvatarPlaceholder').style.display = 'none';
    } else {
        document.getElementById('profileAvatarImg').style.display = 'none';
        document.getElementById('profileAvatarPlaceholder').style.display = 'flex';
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById('profileAvatarUrl').value = dataUrl;
        previewAvatar();
    };
    reader.readAsDataURL(file);
}

function saveProfile() {
    const name   = document.getElementById('profileName').value.trim();
    const phone  = document.getElementById('profilePhone').value.trim();
    const avatar = document.getElementById('profileAvatarUrl').value.trim() || null;

    if (!name) {
        showToast('Name cannot be empty');
        return;
    }

    const token = localStorage.getItem('kem_token');

    fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, avatar })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentUser = { ...currentUser, ...data.user };
            saveUser(currentUser);
            updateProfileUI();
            updateNavbarProfile();
            showToast('Profile updated successfully');
        } else {
            showToast(data.message || 'Failed to update profile.');
        }
    })
    .catch(() => showToast('Network error. Could not update profile.'));
}

// ========== DATA MANAGEMENT ==========

const defaultEvents = [
    {
        id: 1,
        title: "AI Seminar",
        date: "2026-02-10",
        time: "10:00 AM",
        venue: "Auditorium A, KNUST",
        category: "Academic",
        ticket: 0,
        description: "Join us for an insightful AI Seminar featuring industry experts and researchers. Learn about the latest advancements in artificial intelligence, machine learning, and how AI is shaping the future of technology.",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 2,
        title: "Freshers Party",
        date: "2026-02-15",
        time: "6:00 PM",
        venue: "Student Center, KNUST",
        category: "Social",
        ticket: 50,
        description: "Welcome party for freshers! Come meet new friends, enjoy music, food, and fun activities. A great way to start your university journey!",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 3,
        title: "Tech Conference",
        date: "2026-03-01",
        time: "9:00 AM",
        venue: "CCB, KNUST",
        category: "Tech",
        ticket: 0,
        description: "Annual technology conference featuring talks from industry leaders, workshops, and networking opportunities.",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 4,
        title: "Art Workshop",
        date: "2026-02-18",
        time: "2:00 PM",
        venue: "Cultural Centre",
        category: "Arts",
        ticket: 50,
        description: "Learn painting techniques from professional artists. All materials provided.",
        image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 5,
        title: "Career Fair",
        date: "2026-02-22",
        time: "11:00 AM",
        venue: "College of Engineering",
        category: "Academic",
        ticket: 0,
        description: "Meet top employers, submit your CV, and find internship and job opportunities.",
        image: "https://images.unsplash.com/photo-1521791051995-24a6a7c3a2f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 6,
        title: "Music Night",
        date: "2026-02-28",
        time: "7:00 PM",
        venue: "Auditorium",
        category: "Music",
        ticket: 50,
        description: "An evening of live music performances by student bands and special guests.",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    }
];

function getEvents() {
    const events = localStorage.getItem('kem_events');
    return events ? JSON.parse(events) : defaultEvents;
}

function saveEvents(evts) {
    localStorage.setItem('kem_events', JSON.stringify(evts));
}

// Fetch all events from backend and refresh the local events array.
// If the backend returns no events (empty DB), fall back to the hardcoded defaultEvents
// so the app always has content to display.
function loadEventsFromAPI() {
    return fetch('/api/events')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                events = data.events.length > 0 ? data.events : defaultEvents;
                saveEvents(events);
            }
        })
        .catch(() => {
            events = getEvents();
        });
}

function getRegistrations() {
    return JSON.parse(localStorage.getItem('kem_registrations')) || [];
}

function saveRegistrations(registrations) {
    localStorage.setItem('kem_registrations', JSON.stringify(registrations));
}

let events = getEvents();
let currentEventId = null;

// ========== VIEW MANAGEMENT ==========

function hideAllViews() {
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('eventsView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('detailsView').style.display = 'none';
    document.getElementById('ticketsView').style.display = 'none';
    document.getElementById('calendarView').style.display = 'none';
    document.getElementById('faqView').style.display = 'none';
    document.getElementById('profileView').style.display = 'none';
}

function closeMobileNav() {
    const menuBtn = document.getElementById('menuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) mobileNav.classList.remove('active');
    if (menuBtn) menuBtn.classList.remove('active');
}

function showHome(pushState = true) {
    closeMobileNav();
    hideAllViews();
    window.scrollTo(0, 0);
    document.getElementById('homeView').style.display = 'block';
    updateActiveNav('home');
    renderTrainEvents();
    if (pushState) history.pushState({ view: 'home' }, '', '#home');
}

function showEvents(pushState = true) {
    closeMobileNav();
    hideAllViews();
    document.getElementById('eventsView').style.display = 'block';
    updateActiveNav('events');
    renderEventsGrid();
    if (pushState) history.pushState({ view: 'events' }, '', '#events');
}

function showDashboard(pushState = true) {
    closeMobileNav();
    if (currentUser?.role !== 'organizer') {
        showToast('Only organizers can access this page.');
        return;
    }
    hideAllViews();
    document.getElementById('dashboardView').style.display = 'block';
    updateActiveNav('dashboard');
    renderDashboard();
    if (pushState) history.pushState({ view: 'dashboard' }, '', '#dashboard');
}

function showEventDetails(id, pushState = true) {
    currentEventId = id;
    const event = events.find(e => e.id == id || e._id == id);
    if (!event) return;
    if (pushState) history.pushState({ view: 'eventDetails', id }, '', `#event-${id}`);

    // Set hero background image
    const hero = document.getElementById('detailsHero');
    hero.style.backgroundImage = `url('${event.image || 'https://picsum.photos/1400/500?random=' + id}')`;

    // Populate hero title overlay
    document.getElementById('detailsHeroContent').innerHTML = `
        <h1 class="details-hero-title">${event.title}</h1>
        <div class="details-hero-badges">
            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
            </span>
            <span class="details-hero-category">${event.category}</span>
        </div>
    `;

    hideAllViews();
    document.getElementById('detailsView').style.display = 'block';
    renderEventDetails(event);
    renderRelatedEvents(event.category, id);
}

function showTickets(eventId = null, pushState = true) {
    closeMobileNav();
    if (eventId) currentEventId = eventId;
    hideAllViews();
    document.getElementById('ticketsView').style.display = 'block';
    updateActiveNav('tickets');
    if (pushState) history.pushState({ view: 'tickets', eventId }, '', '#tickets');

    const myBookingsContainer = document.getElementById('myBookingsContainer');
    const ticketCheckout      = document.getElementById('ticketCheckout');

    if (eventId) {
        // Came from "Get Ticket" — show checkout form
        document.getElementById('ticketsViewTitle').textContent    = 'Complete Your Booking';
        document.getElementById('ticketsViewSubtitle').textContent = 'You\'re one step away from the experience!';
        myBookingsContainer.style.display = 'none';
        ticketCheckout.style.display      = 'block';
        renderTicketCheckout();
    } else {
        // Came from navbar — show their booked events
        document.getElementById('ticketsViewTitle').textContent    = 'My Tickets';
        document.getElementById('ticketsViewSubtitle').textContent = 'Events you\'ve booked';
        ticketCheckout.style.display      = 'none';
        myBookingsContainer.style.display = 'block';
        renderMyBookings();
    }
}

function buildGoogleCalendarUrl(ev) {
    const dateStr = (ev.date || '').replace(/-/g, '');
    const match   = (ev.time || '').match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let h = 0, m = 0;
    if (match) {
        h = parseInt(match[1]);
        m = parseInt(match[2]);
        const period = (match[3] || '').toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
    }
    const pad  = n => String(n).padStart(2, '0');
    const start = `${dateStr}T${pad(h)}${pad(m)}00`;
    const end   = `${dateStr}T${pad((h + 2) % 24)}${pad(m)}00`;
    const p = new URLSearchParams({
        action:   'TEMPLATE',
        text:     ev.title,
        dates:    `${start}/${end}`,
        location: ev.venue,
    });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function renderMyBookings() {
    const container = document.getElementById('myBookingsContainer');
    const token = localStorage.getItem('kem_token');

    container.innerHTML = '<p class="text-muted"><i class="fas fa-spinner fa-spin"></i> Loading your tickets...</p>';

    fetch('/api/bookings/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success || data.bookings.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:3rem 1rem;">
                    <i class="fas fa-ticket-alt" style="font-size:3rem; color:#cbd5e1; margin-bottom:1rem;"></i>
                    <h3 style="color:#64748b; margin-bottom:0.5rem;">No tickets yet</h3>
                    <p style="color:#94a3b8; margin-bottom:1.5rem;">You haven't booked any events. Browse events to get started.</p>
                    <a href="#" onclick="showEvents()" class="kem-btn kem-btn-primary">Browse Events</a>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1.5rem;">
                ${data.bookings.map(booking => {
                    const ev = booking.event;
                    const ticketLabel = ev.ticket > 0 ? `₵${ev.ticket} × ${booking.quantity}` : 'Free';
                    const bookedDate  = new Date(booking.bookedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
                    return `
                    <div style="background:white; border-radius:1rem; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08); display:flex; flex-direction:column;">
                        <img src="${ev.image || 'https://picsum.photos/400/200?random=' + ev._id}" alt="${ev.title}"
                             style="width:100%; height:160px; object-fit:cover;">
                        <div style="padding:1.25rem; flex:1; display:flex; flex-direction:column; gap:0.5rem;">
                            <h3 style="margin:0; color:#0f172a; font-size:1.1rem;">${ev.title}</h3>
                            <p style="margin:0; color:#64748b; font-size:0.9rem;"><i class="fas fa-calendar" style="color:#1e3a8a; margin-right:6px;"></i>${ev.date} &nbsp;·&nbsp; ${ev.time}</p>
                            <p style="margin:0; color:#64748b; font-size:0.9rem;"><i class="fas fa-map-marker-alt" style="color:#1e3a8a; margin-right:6px;"></i>${ev.venue}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.75rem; border-top:1px solid #e2e8f0;">
                                <span style="background:${ev.ticket > 0 ? '#2563eb' : '#10b981'}; color:white; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.78rem; font-weight:600;">${ticketLabel}</span>
                                <span style="color:#94a3b8; font-size:0.8rem;">Booked ${bookedDate}</span>
                            </div>
                            <a href="${buildGoogleCalendarUrl(ev)}" target="_blank" rel="noopener"
                               style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:0.75rem; padding:0.6rem; border-radius:8px; border:1px solid #e2e8f0; color:#1e3a8a; text-decoration:none; font-size:0.85rem; font-weight:600; transition:background 0.2s;"
                               onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='transparent'">
                                <i class="fas fa-calendar-plus"></i> Add to Google Calendar
                            </a>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
    })
    .catch(() => {
        container.innerHTML = '<p class="text-muted">Could not load your tickets. Please try again.</p>';
    });
}

function showCalendar(pushState = true) {
    closeMobileNav();
    hideAllViews();
    document.getElementById('calendarView').style.display = 'block';
    updateActiveNav('calendar');
    renderCalendar();
    if (pushState) history.pushState({ view: 'calendar' }, '', '#calendar');
}

function showFAQ(pushState = true) {
    closeMobileNav();
    hideAllViews();
    document.getElementById('faqView').style.display = 'block';
    updateActiveNav('faq');
    initFAQ();
    if (pushState) history.pushState({ view: 'faq' }, '', '#faq');
}

function showProfile(pushState = true) {
    closeMobileNav();
    hideAllViews();
    document.getElementById('profileView').style.display = 'block';
    updateActiveNav('profile');
    updateProfileUI();
    if (pushState) history.pushState({ view: 'profile' }, '', '#profile');
}

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    const view = e.state?.view;
    if (!view) { showHome(false); return; }
    const map = {
        home:         () => showHome(false),
        events:       () => showEvents(false),
        dashboard:    () => showDashboard(false),
        tickets:      () => showTickets(e.state.eventId || null, false),
        calendar:     () => showCalendar(false),
        faq:          () => showFAQ(false),
        profile:      () => showProfile(false),
        eventDetails: () => showEventDetails(e.state.id, false),
    };
    if (map[view]) map[view]();
});

function updateActiveNav(page) {
    const navLinks = document.querySelectorAll('.kem-nav-links a, .kem-mobile-nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const text = link.textContent.trim();
        if (page === 'home' && text === 'Home') link.classList.add('active');
        if (page === 'events' && text === 'Events') link.classList.add('active');
        if (page === 'dashboard' && text === 'Organizer') link.classList.add('active');
        if (page === 'calendar' && text === 'Calendar') link.classList.add('active');
        if (page === 'faq' && text === 'FAQ') link.classList.add('active');
        if (page === 'tickets' && text === 'Tickets') link.classList.add('active');
        if (page === 'profile' && text === 'Profile') link.classList.add('active');
    });
}

// ========== RENDER FUNCTIONS ==========

function renderTrainEvents() {
    const trainContainer = document.getElementById('trainEvents');
    if (!trainContainer) return;
    
    const events = getEvents();
    const leftEvents = events.slice(0, 3);
    const rightEvents = events.slice(3, 6);
    
    trainContainer.innerHTML = `
        <div class="kem-train-column kem-column-up">
            ${leftEvents.map(event => `
                <div class="kem-train-carriage" role="button" tabindex="0" onclick="showEventDetails('${event.id}')">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets('${event.id}')">
                                Get Ticket
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
            ${leftEvents.map(event => `
                <div class="kem-train-carriage" role="button" tabindex="0" onclick="showEventDetails('${event.id}')">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets('${event.id}')">
                                Get Ticket
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="kem-train-column kem-column-down">
            ${rightEvents.map(event => `
                <div class="kem-train-carriage" role="button" tabindex="0" onclick="showEventDetails('${event.id}')">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets('${event.id}')">
                                Get Ticket
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
            ${rightEvents.map(event => `
                <div class="kem-train-carriage" role="button" tabindex="0" onclick="showEventDetails('${event.id}')">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets('${event.id}')">
                                Get Ticket
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderEventsGrid() {
    const grid = document.getElementById('eventsGrid');
    const category = document.getElementById('categoryFilter')?.value || 'All';
    const searchTerm = document.getElementById('searchEvents')?.value.toLowerCase() || '';
    
    let filteredEvents = events;
    
    if (category !== 'All') {
        filteredEvents = filteredEvents.filter(e => e.category === category);
    }
    
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(e => 
            e.title.toLowerCase().includes(searchTerm) || 
            e.description.toLowerCase().includes(searchTerm)
        );
    }
    
    grid.innerHTML = filteredEvents.map(event => `
        <div class="event-card" role="button" tabindex="0" onclick="showEventDetails('${event.id}')">
            <img src="${event.image || 'https://picsum.photos/400/200?random=' + event.id}" alt="${event.title}" class="event-img">
            <div class="event-content">
                <h3>${event.title}</h3>
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${event.date}</span>
                    <span><i class="fas fa-clock"></i> ${event.time}</span>
                </div>
                <div class="event-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>
                </div>
                <div class="event-footer">
                    <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                        ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                    </span>
                    <span class="event-category"><i class="fas fa-tag"></i> ${event.category}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderDashboard() {
    const table = document.getElementById('eventTable');
    events = getEvents();
    
    table.innerHTML = events.map(event => `
        <tr>
            <td>${event.title}</td>
            <td>${event.date}</td>
            <td>${event.category}</td>
            <td><span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">${event.ticket == 0 ? 'Free' : '₵' + event.ticket}</span></td>
            <td>
                <button class="btn-small" onclick="editEvent('${event.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-small btn-danger" onclick="deleteEvent('${event.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    renderRegistrations();
}

function renderRegistrations() {
    const table = document.getElementById('registrationsTable');
    const token = localStorage.getItem('kem_token');

    fetch('/api/bookings/organizer', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const bookings = data.bookings.slice(0, 5);
            table.innerHTML = bookings.length === 0
                ? `<tr><td colspan="4" style="text-align:center; color:#64748b;">No bookings yet</td></tr>`
                : bookings.map(b => `
                    <tr>
                        <td>${b.name}</td>
                        <td>${b.email}</td>
                        <td>${b.event ? b.event.title : 'Unknown Event'}</td>
                        <td>${b.studentId}</td>
                    </tr>
                `).join('');
        }
    })
    .catch(() => {
        // Fallback to localStorage if API fails
        const registrations = getRegistrations();
        table.innerHTML = registrations.slice(-5).reverse().map(reg => {
            const event = events.find(e => e.id == reg.eventId);
            return `
                <tr>
                    <td>${reg.name}</td>
                    <td>${reg.email}</td>
                    <td>${event ? event.title : 'Unknown Event'}</td>
                    <td>${reg.studentId}</td>
                </tr>
            `;
        }).join('');
    });
}

function renderEventDetails(event) {
    const container = document.getElementById('eventDetailsContainer');

    container.innerHTML = `
        <div class="kem-details-main">
            <div class="kem-details-meta">
                <div class="kem-meta-chip">
                    <i class="fas fa-calendar"></i>
                    <div><span class="kem-meta-label">Date</span><span class="kem-meta-value">${event.date}</span></div>
                </div>
                <div class="kem-meta-chip">
                    <i class="fas fa-clock"></i>
                    <div><span class="kem-meta-label">Time</span><span class="kem-meta-value">${event.time}</span></div>
                </div>
                <div class="kem-meta-chip">
                    <i class="fas fa-map-marker-alt"></i>
                    <div><span class="kem-meta-label">Venue</span><span class="kem-meta-value">${event.venue}</span></div>
                </div>
                <div class="kem-meta-chip">
                    <i class="fas fa-tag"></i>
                    <div><span class="kem-meta-label">Category</span><span class="kem-meta-value">${event.category}</span></div>
                </div>
            </div>

            <div class="kem-details-description">
                <h2>About This Event</h2>
                <p>${event.description || 'No description provided.'}</p>
            </div>
        </div>

        <div class="kem-details-sidebar">
            <div class="kem-ticket-card">
                <p class="kem-ticket-label">Ticket Price</p>
                <div class="kem-ticket-price">${event.ticket == 0 ? 'Free' : '₵' + event.ticket}</div>
                <div class="kem-ticket-meta">
                    <span><i class="fas fa-calendar"></i> ${event.date}</span>
                    <span><i class="fas fa-clock"></i> ${event.time}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>
                </div>
                <button class="kem-ticket-link" onclick="showTickets('${event.id}')"
                    style="width:100%; padding:1rem; margin-top:1.5rem; font-size:1rem;">
                    <i class="fas fa-ticket-alt"></i> Get Ticket
                </button>
            </div>
        </div>
    `;
}

function renderRelatedEvents(currentCategory, currentId) {
    const container = document.getElementById('relatedEvents');
    if (!container) return;
    
    const related = events
        .filter(e => e.category === currentCategory && e.id != currentId)
        .slice(0, 3);
    
    if (related.length > 0) {
        container.innerHTML = related.map(event => `
            <div class="kem-related-card" onclick="showEventDetails('${event.id}')">
                <img src="${event.image || 'https://picsum.photos/300/160?random=' + event.id}"
                     alt="${event.title}" style="width:100%;height:130px;object-fit:cover;border-radius:10px;margin-bottom:0.75rem;">
                <h4 style="margin:0 0 0.4rem;color:#0f172a;font-size:1rem;">${event.title}</h4>
                <p style="margin:0 0 0.5rem;color:#64748b;font-size:0.85rem;"><i class="fas fa-calendar" style="color:#1e3a8a;margin-right:4px;"></i>${event.date}</p>
                <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                    ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                </span>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p class="text-muted">No related events found in this category.</p>';
    }
}

function renderTicketCheckout() {
    const container = document.getElementById('ticketCheckout');
    const event = events.find(e => e.id == currentEventId || e._id == currentEventId);

    if (!event) {
        container.innerHTML = `
            <div style="text-align:center; padding:3rem 1rem;">
                <i class="fas fa-ticket-alt" style="font-size:3rem; color:#cbd5e1; margin-bottom:1rem;"></i>
                <h3 style="color:#64748b; margin-bottom:0.5rem;">No event selected</h3>
                <p style="color:#94a3b8; margin-bottom:1.5rem;">Please browse events and click "Get Ticket" to continue.</p>
                <a href="#" onclick="showEvents()" class="kem-btn kem-btn-primary">Browse Events</a>
            </div>`;
        return;
    }

    const isFree      = event.ticket == 0;
    const priceLabel  = isFree ? 'Free' : `₵${event.ticket}`;
    const prefillName = currentUser?.name  || '';
    const prefillEmail= currentUser?.email || '';
    const prefillId   = currentUser?.studentId || '';

    container.innerHTML = `
        <div class="checkout-grid">

            <!-- LEFT: Event summary -->
            <div class="checkout-summary">
                <img src="${event.image || 'https://picsum.photos/400/220?random=' + event.id}"
                     alt="${event.title}" class="checkout-event-img">
                <div class="checkout-summary-body">
                    <span class="kem-badge ${isFree ? 'kem-badge-free' : 'kem-badge-ticketed'}" style="margin-bottom:0.75rem; display:inline-block;">${priceLabel}</span>
                    <h2 class="checkout-event-title">${event.title}</h2>
                    <div class="checkout-event-meta">
                        <div class="checkout-meta-row"><i class="fas fa-calendar"></i><span>${event.date}</span></div>
                        <div class="checkout-meta-row"><i class="fas fa-clock"></i><span>${event.time}</span></div>
                        <div class="checkout-meta-row"><i class="fas fa-map-marker-alt"></i><span>${event.venue}</span></div>
                    </div>
                    ${!isFree ? `
                    <div class="checkout-total" id="checkoutTotal">
                        <span>Total</span>
                        <strong>₵${event.ticket}</strong>
                    </div>` : ''}
                </div>
            </div>

            <!-- RIGHT: Form -->
            <div class="checkout-form-panel">
                <h3 class="checkout-form-title">Your Details</h3>

                <div class="checkout-form-group">
                    <label>Full Name</label>
                    <input type="text" id="regName" class="checkout-input" placeholder="John Doe" value="${prefillName}">
                </div>
                <div class="checkout-form-group">
                    <label>Email Address</label>
                    <input type="email" id="regEmail" class="checkout-input" placeholder="you@email.com" value="${prefillEmail}">
                </div>
                <div class="checkout-form-group">
                    <label>Student ID</label>
                    <input type="text" id="regStudentId" class="checkout-input" placeholder="e.g. 20234567" value="${prefillId}">
                </div>
                ${!isFree ? `
                <div class="checkout-form-group">
                    <label>Quantity</label>
                    <select id="ticketQuantity" class="checkout-input"
                        onchange="document.querySelector('#checkoutTotal strong').textContent = '₵' + (${event.ticket} * this.value)">
                        <option value="1">1 ticket</option>
                        <option value="2">2 tickets</option>
                        <option value="3">3 tickets</option>
                        <option value="4">4 tickets</option>
                        <option value="5">5 tickets</option>
                    </select>
                </div>` : `<input type="hidden" id="ticketQuantity" value="1">`}

                <button class="checkout-submit-btn" onclick="submitRegistration()">
                    <i class="fas fa-check-circle"></i>
                    ${isFree ? 'Confirm Registration' : 'Confirm & Book'}
                </button>
                <p class="checkout-note"><i class="fas fa-envelope"></i> A confirmation will be sent to your email.</p>
            </div>
        </div>
    `;
}

// ========== CALENDAR FUNCTIONS ==========

let calendarCurrentDate = new Date();

function renderCalendar() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        calendarCurrentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();
    
    let days = '';
    
    for (let i = firstDay - 1; i >= 0; i--) {
        days += `<div class="day-cell other-month">${prevLastDate - i}</div>`;
    }
    
    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === dateStr);
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        
        days += `<div class="day-cell ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">${i}</div>`;
    }
    
    const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;
    const remainingCells = totalCells - (firstDay + lastDate);
    
    for (let i = 1; i <= remainingCells; i++) {
        days += `<div class="day-cell other-month">${i}</div>`;
    }
    
    document.getElementById('calendarDays').innerHTML = days;
    
    document.querySelectorAll('.day-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.dataset.date;
            showEventsForDate(date);
        });
    });
    
    const firstDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    showEventsForDate(firstDate);
}

function showEventsForDate(date) {
    const dayEvents = events.filter(e => e.date === date);
    const list = document.getElementById('calendarEventList');
    if (dayEvents.length === 0) {
        list.innerHTML = '<h3>Events on Selected Day</h3><p>No events scheduled for this day.</p>';
    } else {
        list.innerHTML = `
            <h3>Events on Selected Day</h3>
            ${dayEvents.map(event => `
                <div class="event-item" onclick="showEventDetails('${event.id}')">
                    <h4>${event.title}</h4>
                    <p>${event.time} | ${event.venue}</p>
                </div>
            `).join('')}
        `;
    }
}

// ========== FAQ FUNCTIONS ==========

function initFAQ() {
    document.querySelectorAll('.kem-faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const isActive = item.classList.contains('active');
            
            document.querySelectorAll('.kem-faq-item').forEach(i => {
                i.classList.remove('active');
            });
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// ========== EVENT CRUD OPERATIONS ==========

function handleEventImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById('eventImage').value = dataUrl;
        updatePreview();
    };
    reader.readAsDataURL(file);
}

function saveEvent(e) {
    e.preventDefault();

    const token = localStorage.getItem('kem_token');
    const eventData = {
        title: document.getElementById('title').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        venue: document.getElementById('venue').value,
        category: document.getElementById('category').value,
        ticket: parseFloat(document.getElementById('ticket').value) || 0,
        description: document.getElementById('description').value,
        image: document.getElementById('eventImage').value || 'https://via.placeholder.com/400x200?text=Event+Image'
    };

    const editId = document.getElementById('editId').value;
    const url    = editId ? `/api/events/${editId}` : '/api/events';
    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            if (editId) {
                const index = events.findIndex(ev => ev.id == editId || ev._id == editId);
                if (index !== -1) events[index] = data.event;
                showToast('Event updated successfully!');
            } else {
                events.unshift(data.event);
                showToast('Event created successfully!');
            }
            saveEvents(events);
            clearForm();
            renderDashboard();
            renderEventsGrid();
            renderTrainEvents();
        } else {
            showToast(data.message || 'Failed to save event.');
        }
    })
    .catch(() => showToast('Network error. Could not save event.'));
}

function editEvent(id) {
    const event = events.find(e => e.id == id || e._id == id);
    
    document.getElementById('editId').value = event.id;
    document.getElementById('title').value = event.title;
    document.getElementById('date').value = event.date;
    document.getElementById('time').value = event.time;
    document.getElementById('venue').value = event.venue;
    document.getElementById('category').value = event.category;
    document.getElementById('ticket').value = event.ticket;
    document.getElementById('description').value = event.description;
    document.getElementById('eventImage').value = event.image || '';
    
    // Clear file input (can't set value programmatically for security, but we can ignore it)
    document.getElementById('eventImageFile').value = '';
    
    if (typeof updatePreview === 'function') updatePreview();
    
    document.querySelector('.dashboard-card').scrollIntoView({ behavior: 'smooth' });
}

function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const token = localStorage.getItem('kem_token');

    fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            events = events.filter(ev => ev.id != id && ev._id != id);
            saveEvents(events);
            renderDashboard();
            renderEventsGrid();
            renderTrainEvents();
            showToast('Event deleted successfully!');
        } else {
            showToast(data.message || 'Failed to delete event.');
        }
    })
    .catch(() => showToast('Network error. Could not delete event.'));
}


function clearForm() {
    document.getElementById('editId').value = '';
    document.getElementById('title').value = '';
    document.getElementById('date').value = '';
    document.getElementById('time').value = '';
    document.getElementById('venue').value = '';
    document.getElementById('description').value = '';
    document.getElementById('eventImage').value = '';
    document.getElementById('eventImageFile').value = '';
    updatePreview();
}

// ========== REGISTRATION ==========

function submitRegistration() {
    const name      = document.getElementById('regName')?.value?.trim();
    const email     = document.getElementById('regEmail')?.value?.trim();
    const studentId = document.getElementById('regStudentId')?.value?.trim();
    const quantity  = parseInt(document.getElementById('ticketQuantity')?.value) || 1;

    if (!name || !email || !studentId) {
        showToast('Please fill in all fields');
        return;
    }

    const event = events.find(e => e.id == currentEventId || e._id == currentEventId);
    if (!event) { showToast('Event not found.'); return; }

    const token = localStorage.getItem('kem_token');

    if (event.ticket <= 0) {
        // ── FREE EVENT: book directly ──────────────────────────────────
        fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ eventId: currentEventId, name, email, studentId, quantity })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                clearRegistrationForm();
                showToast('Booking successful! Your free ticket has been confirmed.');
                setTimeout(() => showEvents(), 2000);
            } else {
                showToast(data.message || 'Booking failed. Please try again.');
            }
        })
        .catch(() => showToast('Network error. Could not complete booking.'));

    } else {
        // ── PAID EVENT: book directly (payment coming soon) ────────────
        fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ eventId: currentEventId, name, email, studentId, quantity })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                clearRegistrationForm();
                showToast('Booking confirmed!');
                setTimeout(() => showEvents(), 2000);
            } else {
                showToast(data.message || 'Booking failed. Please try again.');
            }
        })
        .catch(() => showToast('Network error. Could not complete booking.'));
    }
}

function clearRegistrationForm() {
    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regStudentId = document.getElementById('regStudentId');
    if (regName) regName.value = '';
    if (regEmail) regEmail.value = '';
    if (regStudentId) regStudentId.value = '';
}

// ========== UTILITIES ==========

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updatePreview() {
    const title = document.getElementById('title')?.value || 'Your Event Title';
    const date = document.getElementById('date')?.value ? new Date(document.getElementById('date').value).toLocaleDateString('en-GB') : 'dd/mm/yyyy';
    const time = document.getElementById('time')?.value || '20:00';
    const venue = document.getElementById('venue')?.value || 'Venue name';
    const category = document.getElementById('category')?.value || 'Academic';
    const ticket = document.getElementById('ticket')?.value;
    const ticketDisplay = (ticket === '' || ticket == 0) ? 'Free' : '₵' + parseFloat(ticket).toFixed(2);
    const description = document.getElementById('description')?.value || 'Event description will appear here...';
    const imageUrl = document.getElementById('eventImage')?.value || 'https://via.placeholder.com/400x200?text=Event+Image';

    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewDateTime').textContent = `${date} | ${time}`;
    document.getElementById('previewVenue').textContent = venue;
    document.getElementById('previewCategory').textContent = category;
    document.getElementById('previewTicket').textContent = ticketDisplay;
    document.getElementById('previewDescription').textContent = description;
    document.getElementById('previewImage').style.backgroundImage = `url('${imageUrl}')`;
}

// ========== EVENT LISTENERS ==========

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
        showAuth();
        switchAuthTab('login');
        alert('Email verified successfully! You can now log in.');
        window.history.replaceState({}, '', '/');
    } else if (params.get('verified') === 'false') {
        showAuth();
        alert('Verification link is invalid or has expired. Please sign up again.');
        window.history.replaceState({}, '', '/');
    } else if (loadUser()) {
        if (currentUser.role) {
            loadEventsFromAPI().then(() => showMainApp());
        } else {
            showRoleSelection();
        }
    } else {
        showAuth();
    }

    const menuBtn = document.getElementById('menuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchEvents');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', renderEventsGrid);
    }
    if (searchInput) {
        searchInput.addEventListener('input', debounce(renderEventsGrid, 300));
    }

    document.getElementById('eventForm')?.addEventListener('submit', saveEvent);

    document.getElementById('prevMonth')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendar();
    });

    // Clear file input when URL field is manually changed
    document.getElementById('eventImage')?.addEventListener('input', function() {
        document.getElementById('eventImageFile').value = '';
    });

    document.addEventListener('click', function(event) {
        if (mobileNav && mobileNav.classList.contains('active') &&
            !mobileNav.contains(event.target) &&
            !menuBtn.contains(event.target)) {
            mobileNav.classList.remove('active');
            menuBtn.classList.remove('active');
        }
    });
});

// ========== CHATBOT ==========

let chatHistory = [];
let chatIsStreaming = false;

function toggleChat() {
    const panel = document.getElementById('chatPanel');
    const openIcon = document.getElementById('chatOpenIcon');
    const closeIcon = document.getElementById('chatCloseIcon');
    const isOpen = panel.style.display !== 'none';

    panel.style.display = isOpen ? 'none' : 'flex';
    openIcon.style.display = isOpen ? 'inline-block' : 'none';
    closeIcon.style.display = isOpen ? 'none' : 'inline-block';

    if (!isOpen) document.getElementById('chatInput').focus();
}

function clearChat() {
    chatHistory = [];
    document.getElementById('chatMessages').innerHTML = `
        <div class="chat-msg assistant">
            <div class="chat-bubble">Hey! 👋 I'm the KEM Assistant. Ask me anything about campus events, how to book tickets, or anything about the platform!</div>
        </div>`;
}

function appendChatMessage(role, text) {
    const msgs = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `<div class="chat-bubble">${text}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div.querySelector('.chat-bubble');
}

function showTypingIndicator() {
    const msgs = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg assistant';
    div.id = 'chatTyping';
    div.innerHTML = `<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById('chatTyping');
    if (el) el.remove();
}

async function sendChatMessage() {
    if (chatIsStreaming) return;

    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    chatIsStreaming = true;
    document.getElementById('chatSendBtn').disabled = true;

    appendChatMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory }),
        });

        removeTypingIndicator();

        if (!response.ok) {
            appendChatMessage('assistant', 'Sorry, something went wrong. Please try again.');
            chatIsStreaming = false;
            document.getElementById('chatSendBtn').disabled = false;
            return;
        }

        const bubble = appendChatMessage('assistant', '');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') break;
                try {
                    const parsed = JSON.parse(payload);
                    if (parsed.error) { bubble.textContent = parsed.error; break; }
                    if (parsed.text) {
                        assistantText += parsed.text;
                        bubble.textContent = assistantText;
                        document.getElementById('chatMessages').scrollTop =
                            document.getElementById('chatMessages').scrollHeight;
                    }
                } catch (_) {}
            }
        }

        if (assistantText) chatHistory.push({ role: 'assistant', content: assistantText });

    } catch (err) {
        removeTypingIndicator();
        appendChatMessage('assistant', 'Network error. Please check your connection.');
    }

    chatIsStreaming = false;
    document.getElementById('chatSendBtn').disabled = false;
    document.getElementById('chatInput').focus();
}

