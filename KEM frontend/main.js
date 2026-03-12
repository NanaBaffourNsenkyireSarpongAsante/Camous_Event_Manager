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
    window.location.reload();
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
                saveUser(data.user);
                showMainApp();
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

    if (password !== confirm) {
        showSignupError('Passwords do not match.');
        return;
    }

    pendingSignupData = { name, email, phone, studentId, password, confirmPassword: confirm };
    document.querySelector('#signupForm form').reset();
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
            document.getElementById('roleContainer').style.display = 'none';
            document.getElementById('authContainer').style.display = 'flex';
            switchAuthTab('login');
            const successEl = document.getElementById('loginSuccess');
            successEl.textContent = 'Registration successful! A verification email has been sent to your inbox. Please verify before logging in.';
            successEl.style.display = 'block';
        } else {
            showRoleError(data.message || 'Registration failed.');
        }
    })
    .catch(() => {
        showRoleError('Registration error. Please check your connection.');
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
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const studentId = document.getElementById('profileStudentId').value.trim();
    const avatar = document.getElementById('profileAvatarUrl').value.trim() || null;
    
    if (!name || !email) {
        showToast('Name and email cannot be empty');
        return;
    }
    
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;
    currentUser.studentId = studentId;
    currentUser.avatar = avatar;
    saveUser(currentUser);
    showToast('Profile updated successfully');
    updateProfileUI();
    updateNavbarProfile();
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

function saveEvents(events) {
    localStorage.setItem('kem_events', JSON.stringify(events));
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

function showHome() {
    hideAllViews();
    document.getElementById('homeView').style.display = 'block';
    updateActiveNav('home');
    renderTrainEvents();
}

function showEvents() {
    hideAllViews();
    document.getElementById('eventsView').style.display = 'block';
    updateActiveNav('events');
    renderEventsGrid();
}

function showDashboard() {
    if (currentUser?.role !== 'organizer') {
        showToast('Only organizers can access this page.');
        return;
    }
    hideAllViews();
    document.getElementById('dashboardView').style.display = 'block';
    updateActiveNav('dashboard');
    renderDashboard();
}

function showEventDetails(id) {
    currentEventId = id;
    const event = events.find(e => e.id == id);
    if (!event) return;
    
    hideAllViews();
    document.getElementById('detailsView').style.display = 'block';
    renderEventDetails(event);
    renderRelatedEvents(event.category, id);
}

function showTickets(eventId = null) {
    if (eventId) currentEventId = eventId;
    hideAllViews();
    document.getElementById('ticketsView').style.display = 'block';
    updateActiveNav('tickets');
    renderTicketCheckout();
}

function showCalendar() {
    hideAllViews();
    document.getElementById('calendarView').style.display = 'block';
    updateActiveNav('calendar');
    renderCalendar();
}

function showFAQ() {
    hideAllViews();
    document.getElementById('faqView').style.display = 'block';
    updateActiveNav('faq');
    initFAQ();
}

function showProfile() {
    hideAllViews();
    document.getElementById('profileView').style.display = 'block';
    updateActiveNav('profile');
    updateProfileUI();
}

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
                <div class="kem-train-carriage" onclick="showEventDetails(${event.id})">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets(${event.id})">
                                Get Ticket
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
            ${leftEvents.map(event => `
                <div class="kem-train-carriage" onclick="showEventDetails(${event.id})">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets(${event.id})">
                                Get Ticket
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="kem-train-column kem-column-down">
            ${rightEvents.map(event => `
                <div class="kem-train-carriage" onclick="showEventDetails(${event.id})">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets(${event.id})">
                                Get Ticket
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
            ${rightEvents.map(event => `
                <div class="kem-train-carriage" onclick="showEventDetails(${event.id})">
                    <img src="${event.image || 'https://picsum.photos/300/200?random=' + event.id}" alt="${event.title}" class="kem-train-image">
                    <div class="kem-carriage-content">
                        <h3>${event.title}</h3>
                        <p class="kem-datetime">${event.date} | ${event.time}</p>
                        <div class="kem-carriage-footer">
                            <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">
                                ${event.ticket == 0 ? 'Free' : '₵' + event.ticket}
                            </span>
                            <button class="kem-ticket-link" onclick="event.stopPropagation(); showTickets(${event.id})">
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
        <div class="event-card" onclick="showEventDetails(${event.id})">
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
                <button class="btn-small" onclick="editEvent(${event.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-small btn-danger" onclick="deleteEvent(${event.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    renderRegistrations();
}

function renderRegistrations() {
    const table = document.getElementById('registrationsTable');
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
}

function renderEventDetails(event) {
    const container = document.getElementById('eventDetailsContainer');
    
    container.innerHTML = `
        <div class="kem-details-main">
            <img src="${event.image || 'https://via.placeholder.com/800x400?text=No+Image'}" alt="${event.title}" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin-bottom:1.5rem;">
            <div class="kem-details-header">
                <h1>${event.title}</h1>
                <div class="kem-details-badges">
                    <span class="kem-badge ${event.ticket == 0 ? 'kem-badge-free' : 'kem-badge-ticketed'}">${event.ticket == 0 ? 'Free' : '₵' + event.ticket}</span>
                    <span class="kem-details-category">${event.category}</span>
                </div>
            </div>

            <div class="kem-details-meta">
                <div class="kem-meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${event.date}</span>
                </div>
                <div class="kem-meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${event.time}</span>
                </div>
                <div class="kem-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.venue}</span>
                </div>
            </div>

            <div class="kem-details-description">
                <h2>About This Event</h2>
                <p>${event.description}</p>
            </div>
        </div>

        <div class="kem-details-sidebar">
            <div class="kem-ticket-card">
                <h3>Get Your Ticket</h3>
                <div class="kem-ticket-price">${event.ticket == 0 ? 'Free' : '₵' + event.ticket}</div>
                <p class="kem-ticket-availability"><i class="fas fa-users"></i> Limited spots available</p>
                
                <button class="kem-ticket-link" onclick="showTickets(${event.id})" style="width: 100%; padding: 1rem;">
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
            <div class="kem-related-card" onclick="showEventDetails(${event.id})">
                <h4>${event.title}</h4>
                <p>${event.date} | ${event.time}</p>
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
    const event = events.find(e => e.id == currentEventId);
    
    if (!event) {
        container.innerHTML = `
            <h2>Complete Your Purchase</h2>
            <p>Please select an event to purchase tickets.</p>
            <a href="#" onclick="showEvents()" class="kem-btn kem-btn-primary">Browse Events</a>
        `;
        return;
    }
    
    container.innerHTML = `
        <h2>Complete Your Purchase</h2>
        <div class="ticket-summary">
            <h3>${event.title}</h3>
            <p><i class="fas fa-calendar"></i> ${event.date} at ${event.time}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
            <div class="ticket-price">${event.ticket == 0 ? 'Free' : '₵' + event.ticket + ' per ticket'}</div>
        </div>
        
        <div class="registration-form">
            <h3>Your Information</h3>
            <div class="form-group">
                <label for="regName">Full Name</label>
                <input type="text" id="regName" class="form-control" required placeholder="Enter your full name">
            </div>
            <div class="form-group">
                <label for="regEmail">Email Address</label>
                <input type="email" id="regEmail" class="form-control" required placeholder="Enter your email">
            </div>
            <div class="form-group">
                <label for="regStudentId">Student ID</label>
                <input type="text" id="regStudentId" class="form-control" required placeholder="Enter your student ID">
            </div>
            <div class="form-group">
                <label for="ticketQuantity">Quantity</label>
                <select id="ticketQuantity" class="form-control">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </div>
            
            <button class="kem-ticket-link" onclick="submitRegistration()" style="width: 100%; padding: 1rem; margin-top: 1rem;">
                <i class="fas fa-check-circle"></i> Confirm Registration
            </button>
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
                <div class="event-item" onclick="showEventDetails(${event.id})">
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
    
    if (editId) {
        const index = events.findIndex(e => e.id == editId);
        events[index] = { ...eventData, id: parseInt(editId) };
        showToast('Event updated successfully!');
    } else {
        events.push({ id: Date.now(), ...eventData });
        showToast('Event created successfully!');
    }
    
    saveEvents(events);
    clearForm();
    renderDashboard();
    renderEventsGrid();
    renderTrainEvents();
}

function editEvent(id) {
    const event = events.find(e => e.id === id);
    
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
    
    events = events.filter(e => e.id !== id);
    saveEvents(events);
    renderDashboard();
    renderEventsGrid();
    renderTrainEvents();
    showToast('Event deleted successfully!');
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
    const name = document.getElementById('regName')?.value;
    const email = document.getElementById('regEmail')?.value;
    const studentId = document.getElementById('regStudentId')?.value;
    const quantity = document.getElementById('ticketQuantity')?.value || 1;
    
    if (!name || !email || !studentId) {
        showToast('Please fill in all fields');
        return;
    }
    
    const registrations = getRegistrations();
    
    registrations.push({
        id: Date.now(),
        eventId: currentEventId,
        name,
        email,
        studentId,
        quantity: parseInt(quantity),
        date: new Date().toISOString()
    });
    
    saveRegistrations(registrations);
    
    showToast('Registration successful! Check your email for confirmation.');
    
    document.getElementById('regName').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regStudentId').value = '';
    
    setTimeout(() => {
        showEvents();
    }, 2000);
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
            showMainApp();
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