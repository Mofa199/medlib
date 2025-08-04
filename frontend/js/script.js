// =================================================================================
// 1. STATE AND CONFIGURATION
// =================================================================================
const API_URL = 'http://127.0.0.1:5000';
const app = document.getElementById('app');
let userProgress = {
    completedTopics: new Set(),
};

// =================================================================================
// 2. API COMMUNICATION
// =================================================================================
const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.hash = '/login';
        throw new Error('No token found, redirecting to login.');
    }
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        logoutUser();
        throw new Error('Session expired, please log in again.');
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An API error occurred');
    }
    return response.json();
};

const loginUser = async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('jwt_token', data.access_token);
    await fetchUserProgress(); // Fetch progress right after login
    window.location.hash = '/';
};

const getAIChatResponse = (message) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("I am a helpful library assistant. As this is a demonstration, I don't have access to the library's content, but I'm here to help with general questions!");
        }, 1000); // Simulate 1 second network delay
    });
};

const registerUser = async (username, email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    alert('Registration successful! Please log in.');
    window.location.hash = '/login';
};

const markTopicAsCompleteAPI = async (topicId) => {
    return await fetchWithAuth(`${API_URL}/api/topics/${topicId}/complete`, { method: 'POST' });
};


// =================================================================================
// 3. UI COMPONENTS / RENDER FUNCTIONS
// =================================================================================
const renderHeader = () => `
    <header class="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-blue-600 dark:text-blue-400">TAMSA Digital Library</h1>
        <nav class="flex items-center">
            <a href="#/" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3">Home</a>
            <a href="#/courses" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3">Courses</a>
            <a href="#/pharmacology" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3">Pharmacology</a>
            <a href="#/about" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3">About</a>
            <a href="#/faq" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3">FAQ</a>
            <a href="#/contact" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3">Contact</a>
            <button id="theme-toggle" class="ml-4 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            </button>
            <a href="#/login" id="login-logout-link" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 border-l-2 dark:border-gray-600 ml-3 pl-6">Login</a>
            <div id="admin-link-container"></div>
        </nav>
    </header>`;

const renderLoginPage = () => `
    <div class="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Login</h2>
            <form id="login-form">
                <div class="mb-4"><label for="username" class="block text-gray-700 dark:text-gray-300">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div>
                <div class="mb-6"><label for="password" class="block text-gray-700 dark:text-gray-300">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div>
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Login</button>
            </form>
            <p class="text-center mt-4 text-gray-600 dark:text-gray-400">Don't have an account? <a href="#/register" class="text-blue-600 hover:underline">Sign up</a></p>
        </div>
    </div>`;

const renderRegisterPage = () => `
    <div class="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Create Account</h2>
            <form id="register-form">
                <div class="mb-4"><label for="username" class="block text-gray-700 dark:text-gray-300">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div>
                <div class="mb-4"><label for="email" class="block text-gray-700 dark:text-gray-300">Email</label><input type="email" id="email" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div>
                <div class="mb-6"><label for="password" class="block text-gray-700 dark:text-gray-300">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div>
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Register</button>
            </form>
            <p class="text-center mt-4 text-gray-600 dark:text-gray-400">Already have an account? <a href="#/login" class="text-blue-600 hover:underline">Login</a></p>
        </div>
    </div>`;

const renderDashboardPage = () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.hash = '/login'; return ''; }
    const username = decodeJwt(token)?.identity?.username || 'User';
    return `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Welcome, ${username}!</h2><div id="dashboard-content" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div></div>`;
};

const renderCoursesPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Courses</h2><div id="content-area" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div></div>`;
const renderModuleListPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Modules for Course ${params[0]}</h2><div id="content-area" class="space-y-4"></div></div>`;
const renderTopicListPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Topics for Module ${params[0]}</h2><div id="content-area" class="space-y-2"></div></div>`;
const renderTopicDetailPage = () => `<div class="p-8" id="content-area"></div>`;
const renderPharmacologyPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Pharmacology</h2><div id="content-area"></div></div>`;
const renderDrugDetailPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Details for ${decodeURIComponent(params[0])}</h2><p class="dark:text-gray-300">Detailed information about ${decodeURIComponent(params[0])} will be displayed here.</p></div>`;
const renderAboutPage = () => `
    <div class="p-8 bg-gray-50 dark:bg-gray-900">
        <h2 class="text-4xl font-bold text-center mb-12 dark:text-white">About TAMSA Digital Library</h2>
        <div class="max-w-4xl mx-auto mb-12"><div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"><h3 class="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Our Mission</h3><p class="text-gray-700 dark:text-gray-300">To empower the next generation of medical professionals by providing a world-class, accessible, and comprehensive digital library. We are committed to fostering a community of learning, innovation, and excellence in medical education.</p></div></div>
        <div class="max-w-4xl mx-auto mb-12"><div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"><h3 class="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Our History</h3><p class="text-gray-700 dark:text-gray-300">Founded in 2024, the TAMSA Digital Library project was initiated to bridge the gap in digital academic resources for students in medicine, nursing, and pharmacy. From a simple idea, it has grown into a comprehensive platform designed to support every step of the student journey.</p></div></div>
        <div class="max-w-4xl mx-auto"><div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"><h3 class="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">Meet the Team</h3><p class="text-center text-gray-700 dark:text-gray-300">(A carousel or grid of team member profiles will be displayed here.)</p></div></div>
    </div>`;
const renderContactPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Contact Us</h2></div>`;

const renderAdminDashboardPage = () => `
    <div class="p-8">
        <h2 class="text-3xl font-bold mb-6 dark:text-white">Admin Dashboard</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="#/admin/users" class="block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <h3 class="text-xl font-bold dark:text-white">User Management</h3>
            </a>
            <!-- Other admin links can go here -->
        </div>
    </div>`;

const renderUserManagementPage = () => `
    <div class="p-8">
        <h2 class="text-3xl font-bold mb-6 dark:text-white">User Management</h2>
        <div id="content-area" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
            <!-- User table will be rendered here -->
            <p class="dark:text-white">Loading users...</p>
        </div>
    </div>`;

const renderFAQPage = () => {
    const FAQ_DATA = [ { q: 'How do I reset my password?', a: 'You can reset your password by clicking the "Forgot Password" link on the login page.' }, { q: 'How do I access course materials?', a: 'Once you are logged in, you can access all your courses and their materials from the "Courses" page.' }, { q: 'Who can I contact for support?', a: 'For any support-related questions, please visit our "Contact Us" page and send us a message.' } ];
    return `<div class="p-8 bg-gray-50 dark:bg-gray-900"><h2 class="text-4xl font-bold text-center mb-12 dark:text-white">Frequently Asked Questions</h2><div class="max-w-4xl mx-auto">${FAQ_DATA.map((faq, index) => `<div class="mb-4 border dark:border-gray-700 rounded-lg"><button class="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold dark:text-white" onclick="toggleAccordion('faq-${index}')">${faq.q}</button><div id="accordion-faq-${index}" class="hidden p-4 bg-white dark:bg-gray-800"><p class="text-gray-700 dark:text-gray-300">${faq.a}</p></div></div>`).join('')}</div></div>`;
};
const render404Page = () => `<h2 class="text-3xl p-6 text-center text-red-500">404 - Page Not Found</h2>`;

// =================================================================================
// 4. ROUTER AND DATA FETCHING LOGIC
// =================================================================================
const PHARMACOLOGY_DATA = [{category: 'Analgesics',drugs: ['Aspirin', 'Ibuprofen', 'Paracetamol', 'Morphine']}, {category: 'Antibiotics',drugs: ['Penicillin', 'Amoxicillin', 'Ciprofloxacin', 'Doxycycline']}, {category: 'Antihypertensives',drugs: ['Lisinopril', 'Amlodipine', 'Metoprolol', 'Losartan']}];
const displayPharmacologyData = () => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    contentArea.innerHTML = PHARMACOLOGY_DATA.map((cat, index) => `<div class="mb-4 border dark:border-gray-700 rounded-lg"><button class="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold dark:text-white" onclick="toggleAccordion('pharma-${index}')">${cat.category}</button><div id="accordion-pharma-${index}" class="hidden p-4"><ul class="list-disc list-inside">${cat.drugs.map(drug => `<li><a href="#/drugs/${encodeURIComponent(drug)}" class="text-blue-600 dark:text-blue-400 hover:underline">${drug}</a></li>`).join('')}</ul></div></div>`).join('');
};
const fetchAndDisplayCourses = async () => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    const courses = await fetchWithAuth(`${API_URL}/admin/courses`);
    contentArea.innerHTML = courses.map(course => `<a href="#/courses/${course.id}" class="block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"><h3 class="text-xl font-bold mb-2 dark:text-white">${course.name}</h3><p class="text-gray-700 dark:text-gray-300">${course.description || ''}</p></a>`).join('');
};
const fetchAndDisplayModules = async (courseId) => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    const modules = await fetchWithAuth(`${API_URL}/courses/${courseId}/modules`);
    contentArea.innerHTML = modules.map(module => `<a href="#/modules/${module.id}" class="block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"><h3 class="text-xl font-bold mb-2 dark:text-white">${module.name}</h3><p class="text-gray-700 dark:text-gray-300">${module.description || ''}</p></a>`).join('');
};
const fetchAndDisplayTopics = async (moduleId) => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    const topics = await fetchWithAuth(`${API_URL}/modules/${moduleId}/topics`);
    contentArea.innerHTML = topics.map(topic => `<a href="#/topics/${topic.id}" class="block bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"><h4 class="font-semibold dark:text-white">${topic.name}</h4></a>`).join('');
};
const fetchAndDisplayTopicDetails = async (topicId) => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    const topic = await fetchWithAuth(`${API_URL}/topics/${topicId}`);
    const isCompleted = userProgress.completedTopics.has(topic.id);
    contentArea.innerHTML = `<h2 class="text-4xl font-bold mb-4 dark:text-white">${topic.name}</h2><div class="prose dark:prose-invert max-w-none">${topic.content}</div><h3 class="text-2xl font-bold mt-8 mb-4 dark:text-white">Resources</h3><ul class="list-disc list-inside mb-8 dark:text-gray-300">${topic.resources.map(r => `<li><a href="${r.path_or_url}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">${r.name}</a> (${r.resource_type})</li>`).join('')}</ul><button id="mark-complete-btn" data-topic-id="${topic.id}" class="${isCompleted ? 'bg-green-500' : 'bg-blue-600'} text-white py-2 px-4 rounded-lg" ${isCompleted ? 'disabled' : ''}>${isCompleted ? '✓ Completed' : 'Mark as Complete'}</button>`;
};
const fetchAndDisplayUsers = async () => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    const users = await fetchWithAuth(`${API_URL}/admin/users`);
    contentArea.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                ${users.map(user => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${user.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${user.username}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${user.role}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

const displayDashboardData = () => {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;
    const completedCount = userProgress.completedTopics.size;
    dashboardContent.innerHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"><h3 class="text-xl font-bold mb-4 dark:text-white">My Progress</h3><p class="text-gray-700 dark:text-gray-300">You have completed <strong>${completedCount}</strong> topics.</p></div><div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"><h3 class="text-xl font-bold mb-4 dark:text-white">My Badges</h3><div class="flex space-x-4"><div class="text-4xl">🏅</div><div class="text-4xl">🏆</div></div></div>`;
};

const routes = [ { path: /^\/$/, view: renderDashboardPage, action: displayDashboardData }, { path: /^\/login$/, view: renderLoginPage }, { path: /^\/register$/, view: renderRegisterPage }, { path: /^\/courses$/, view: renderCoursesPage, action: fetchAndDisplayCourses }, { path: /^\/courses\/(\d+)$/, view: renderModuleListPage, action: (p) => fetchAndDisplayModules(p[0]) }, { path: /^\/modules\/(\d+)$/, view: renderTopicListPage, action: (p) => fetchAndDisplayTopics(p[0]) }, { path: /^\/topics\/(\d+)$/, view: renderTopicDetailPage, action: (p) => fetchAndDisplayTopicDetails(p[0]) }, { path: /^\/pharmacology$/, view: renderPharmacologyPage, action: displayPharmacologyData }, { path: /^\/drugs\/([a-zA-Z0-9%]+)$/, view: renderDrugDetailPage }, { path: /^\/about$/, view: renderAboutPage }, { path: /^\/contact$/, view: renderContactPage }, { path: /^\/faq$/, view: renderFAQPage }, ];
const router = () => {
    const token = localStorage.getItem('jwt_token');
    const path = window.location.hash.substring(1) || '/';

    // If not logged in, only allow access to login/register pages
    if (!token && path !== '/login' && path !== '/register') {
        window.location.hash = '/login';
        return;
    }

    const match = routes.find(route => route.path.test(path));
    if (!match) { app.innerHTML = renderHeader() + render404Page(); return; }
    const params = path.match(match.path).slice(1);
    app.innerHTML = renderHeader() + match.view(params);
    if (match.action) { try { match.action(params); } catch (e) { console.error(e); alert(e.message); } }
    handleAuthLink();
};

// =================================================================================
// 5. UTILS AND APP INITIALIZATION
// =================================================================================
const toggleAccordion = (id) => { const content = document.getElementById(`accordion-${id}`); if (content) { content.classList.toggle('hidden'); } };
const toggleTheme = () => { const isDark = document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); };
const loadTheme = () => { const theme = localStorage.getItem('theme'); if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } };
const decodeJwt = (token) => { try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; } };
const logoutUser = () => {
    localStorage.removeItem('jwt_token');
    userProgress.completedTopics = new Set(); // Clear progress on logout
    window.location.hash = '/login';
};
const handleAuthLink = () => {
    const link = document.getElementById('login-logout-link');
    const adminContainer = document.getElementById('admin-link-container');
    if (!link || !adminContainer) return;

    const token = localStorage.getItem('jwt_token');
    if (token) {
        link.textContent = 'Logout';
        link.href = '#';
        link.onclick = (e) => { e.preventDefault(); logoutUser(); };

        const userData = decodeJwt(token);
        if (userData?.identity?.role === 'admin') {
            adminContainer.innerHTML = `<a href="#/admin" class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 px-3 border-l-2 dark:border-gray-600 ml-3 pl-6">Admin</a>`;
        } else {
            adminContainer.innerHTML = '';
        }

    } else {
        link.textContent = 'Login';
        link.href = '#/login';
        link.onclick = null;
        adminContainer.innerHTML = '';
    }
};

const fetchUserProgress = async () => {
    try {
        const data = await fetchWithAuth(`${API_URL}/api/progress`);
        userProgress.completedTopics = new Set(data.completed_topic_ids);
    } catch (e) {
        console.error("Could not fetch user progress. User might not be logged in.", e);
        userProgress.completedTopics = new Set();
    }
};

const init = () => {
    loadTheme();
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
    app.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            if (e.target.id === 'login-form') { await loginUser(e.target.elements.username.value, e.target.elements.password.value); }
            if (e.target.id === 'register-form') { await registerUser(e.target.elements.username.value, e.target.elements.email.value, e.target.elements.password.value); }
        } catch (error) { alert(`Error: ${error.message}`); }
    });
    document.body.addEventListener('click', async (e) => {
        if (e.target.closest('#theme-toggle')) { toggleTheme(); }
        if (e.target.closest('#mark-complete-btn')) {
            const button = e.target.closest('#mark-complete-btn');
            const topicId = parseInt(button.dataset.topicId);
            try {
                await markTopicAsCompleteAPI(topicId);
                // After successful API call, update local state
                userProgress.completedTopics.add(topicId);
                // Re-render button to show new state
                button.textContent = '✓ Completed';
                button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                button.classList.add('bg-green-500');
                button.disabled = true;

                // Optionally, re-render dashboard data if visible
                if(window.location.hash === '#/') {
                    displayDashboardData();
                }

            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });
    const chatOpenButton = document.getElementById('chat-open-button');
    const chatCloseButton = document.getElementById('chat-close-button');
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    chatOpenButton.addEventListener('click', () => chatWindow.classList.remove('hidden'));
    chatCloseButton.addEventListener('click', () => chatWindow.classList.add('hidden'));
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        const userMessage = chatInput.value.trim();
        if (userMessage) {
            chatMessages.innerHTML += `<div class="text-right my-2"><p class="bg-blue-500 text-white rounded-lg py-2 px-4 inline-block">${userMessage}</p></div>`;
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            const aiResponse = await getAIChatResponse(userMessage);
            chatMessages.innerHTML += `<div class="text-left my-2"><p class="bg-gray-200 text-gray-800 rounded-lg py-2 px-4 inline-block">${aiResponse}</p></div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
};

init();
