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
    await fetchUserProgress();
    window.location.hash = '/';
};

const getAIChatResponse = async (message) => {
    // This is a mock response. Replace with a real API call.
    return new Promise(resolve => setTimeout(() => resolve("This is a mocked AI response."), 1000));
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
        <nav class="flex items-center space-x-4">
            <form id="search-form" class="w-full max-w-sm"><input type="search" id="search-input" placeholder="Search..." class="w-full px-3 py-1.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></form>
            <a href="#/" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Home</a>
            <a href="#/courses" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Courses</a>
            <a href="#/news" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">News</a>
            <a href="#/events" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Events</a>
            <a href="#/about" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">About</a>
            <a href="#/faq" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">FAQ</a>
            <button id="theme-toggle" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg></button>
            <a href="#/login" id="login-logout-link" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-l-2 dark:border-gray-600 ml-2 pl-4">Login</a>
            <div id="admin-link-container"></div>
        </nav>
    </header>`;

const renderFooter = () => `<footer class="bg-gray-800 text-white mt-12 py-8 px-4"><div class="max-w-7xl mx-auto text-center text-gray-500">© 2024 TAMSA Digital Library. All Rights Reserved.</div></footer>`;
const renderLoginPage = () => `<div class="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-96"><h2 class="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Login</h2><form id="login-form"><div class="mb-4"><label for="username" class="block text-gray-700 dark:text-gray-300">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div><div class="mb-6"><label for="password" class="block text-gray-700 dark:text-gray-300">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div><button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Login</button></form><p class="text-center mt-4 text-gray-600 dark:text-gray-400">Don't have an account? <a href="#/register" class="text-blue-600 hover:underline">Sign up</a></p></div></div>`;
const renderRegisterPage = () => `<div class="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-96"><h2 class="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Create Account</h2><form id="register-form"><div class="mb-4"><label for="username" class="block text-gray-700 dark:text-gray-300">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div><div class="mb-4"><label for="email" class="block text-gray-700 dark:text-gray-300">Email</label><input type="email" id="email" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div><div class="mb-6"><label for="password" class="block text-gray-700 dark:text-gray-300">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required></div><button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Register</button></form><p class="text-center mt-4 text-gray-600 dark:text-gray-400">Already have an account? <a href="#/login" class="text-blue-600 hover:underline">Login</a></p></div></div>`;
const renderDashboardPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Welcome, ${(decodeJwt(localStorage.getItem('jwt_token'))?.identity?.username || 'User')}!</h2><div id="dashboard-content" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div></div>`;
const renderCoursesPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Courses</h2><div id="content-area" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div></div>`;
const renderModuleListPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Modules for Course ${params[0]}</h2><div id="content-area" class="space-y-4"></div></div>`;
const renderTopicListPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Topics for Module ${params[0]}</h2><div id="content-area" class="space-y-2"></div></div>`;
const renderTopicDetailPage = () => `<div class="p-8" id="content-area"></div>`;
const renderPharmacologyPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Pharmacology</h2><div id="content-area"></div></div>`;
const renderDrugDetailPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Details for ${decodeURIComponent(params[0])}</h2><p class="dark:text-gray-300">Detailed information will be displayed here.</p></div>`;
const renderAboutPage = () => `<div class="p-8 bg-gray-50 dark:bg-gray-900"><h2 class="text-4xl font-bold text-center mb-12 dark:text-white">About TAMSA Digital Library</h2></div>`;
const renderContactPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Contact Us</h2></div>`;
const renderNewsPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">News & Announcements</h2><div id="content-area" class="space-y-6"></div></div>`;
const renderEventsPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Upcoming Events</h2><div id="content-area" class="space-y-6"></div></div>`;
const renderFAQPage = () => `<div class="p-8 bg-gray-50 dark:bg-gray-900"><h2 class="text-4xl font-bold text-center mb-12 dark:text-white">Frequently Asked Questions</h2><div id="content-area" class="max-w-4xl mx-auto"></div></div>`;
const renderAdminDashboardPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Admin Dashboard</h2></div>`;
const renderUserManagementPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">User Management</h2><div id="content-area" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto"></div></div>`;
const renderSearchResultsPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Search Results for "${params[0]}"</h2><div id="content-area" class="space-y-4"></div></div>`;
const render404Page = () => `<h2 class="text-3xl p-6 text-center text-red-500">404 - Page Not Found</h2>`;

// =================================================================================
// 4. ROUTER AND DATA FETCHING LOGIC
// =================================================================================
const fetchAndDisplayNews = async () => { /* ... */ };
const fetchAndDisplayEvents = async () => { /* ... */ };
// ... (other fetch functions)

const routes = [
    { path: /^\/$/, view: renderDashboardPage, action: displayDashboardData },
    { path: /^\/login$/, view: renderLoginPage },
    { path: /^\/register$/, view: renderRegisterPage },
    { path: /^\/courses$/, view: renderCoursesPage, action: fetchAndDisplayCourses },
    { path: /^\/courses\/(\d+)$/, view: renderModuleListPage, action: (p) => fetchAndDisplayModules(p[0]) },
    { path: /^\/modules\/(\d+)$/, view: renderTopicListPage, action: (p) => fetchAndDisplayTopics(p[0]) },
    { path: /^\/topics\/(\d+)$/, view: renderTopicDetailPage, action: (p) => fetchAndDisplayTopicDetails(p[0]) },
    { path: /^\/pharmacology$/, view: renderPharmacologyPage, action: displayPharmacologyData },
    { path: /^\/drugs\/([a-zA-Z0-9%]+)$/, view: renderDrugDetailPage },
    { path: /^\/news$/, view: renderNewsPage, action: fetchAndDisplayNews },
    { path: /^\/events$/, view: renderEventsPage, action: fetchAndDisplayEvents },
    { path: /^\/about$/, view: renderAboutPage },
    { path: /^\/faq$/, view: renderFAQPage, action: displayFAQData },
    { path: /^\/contact$/, view: renderContactPage },
    { path: /^\/admin$/, view: renderAdminDashboardPage },
    { path: /^\/admin\/users$/, view: renderUserManagementPage, action: fetchAndDisplayUsers },
    { path: /^\/search\?q=(.+)$/, view: (p) => renderSearchResultsPage(p), action: (p) => fetchAndDisplaySearchResults(p[0]) },
];

const router = () => {
    const token = localStorage.getItem('jwt_token');
    const path = window.location.hash.substring(1) || '/';
    const publicPages = ['/login', '/register'];

    if (!token && !publicPages.includes(path)) {
        window.location.hash = '/login';
        return;
    }

    const match = routes.find(route => route.path.test(path));
    if (!match) {
        app.innerHTML = renderHeader() + render404Page() + renderFooter();
        return;
    }

    const params = path.match(match.path).slice(1);

    if (publicPages.includes(path)) {
        app.innerHTML = match.view(params);
    } else {
        app.innerHTML = renderHeader() + match.view(params) + renderFooter();
        handleAuthLink();
    }

    if (match.action) {
        try { match.action(params); } catch (e) { console.error(e); alert(e.message); }
    }
};

// =================================================================================
// 5. UTILS AND APP INITIALIZATION
// =================================================================================
const handleAuthLink = () => {
    const token = localStorage.getItem('jwt_token');
    const link = document.getElementById('login-logout-link');
    if (token) {
        link.textContent = 'Logout';
        link.href = '#/logout';
        link.onclick = () => {
            localStorage.removeItem('jwt_token');
            window.location.hash = '/login';
        };
    } else {
        link.textContent = 'Login';
        link.href = '#/login';
        link.onclick = null;
    }
};

const decodeJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

// Dummy action functions to avoid errors
const displayDashboardData = () => { document.getElementById('dashboard-content').innerHTML = "Dashboard content goes here."; };
const fetchAndDisplayCourses = () => { document.getElementById('content-area').innerHTML = "Courses content goes here."; };
const fetchAndDisplayModules = (courseId) => { document.getElementById('content-area').innerHTML = `Modules for course ${courseId} go here.`; };
const fetchAndDisplayTopics = (moduleId) => { document.getElementById('content-area').innerHTML = `Topics for module ${moduleId} go here.`; };
const fetchAndDisplayTopicDetails = (topicId) => { document.getElementById('content-area').innerHTML = `Details for topic ${topicId} go here.`; };
const displayPharmacologyData = () => { document.getElementById('content-area').innerHTML = "Pharmacology content goes here."; };
const fetchAndDisplayNews = () => { document.getElementById('content-area').innerHTML = "News content goes here."; };
const fetchAndDisplayEvents = () => { document.getElementById('content-area').innerHTML = "Events content goes here."; };
const displayFAQData = () => { document.getElementById('content-area').innerHTML = "FAQ content goes here."; };
const fetchAndDisplayUsers = () => { document.getElementById('content-area').innerHTML = "User management content goes here."; };
const fetchAndDisplaySearchResults = (query) => { document.getElementById('content-area').innerHTML = `Search results for "${query}" go here.`; };


// Event Listeners for router and other functionalities
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
    router();

    // Chatbot functionality
    const chatOpenButton = document.getElementById('chat-open-button');
    const chatCloseButton = document.getElementById('chat-close-button');
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatOpenButton) {
        chatOpenButton.addEventListener('click', () => chatWindow.classList.remove('hidden'));
    }
    if (chatCloseButton) {
        chatCloseButton.addEventListener('click', () => chatWindow.classList.add('hidden'));
    }
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // Display user message
            const userMessageDiv = document.createElement('div');
            userMessageDiv.textContent = message;
            userMessageDiv.classList.add('p-2', 'rounded-lg', 'bg-blue-100', 'self-end', 'text-right', 'mb-2', 'max-w-xs', 'break-words');
            chatMessages.appendChild(userMessageDiv);

            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Get AI response
            const thinkingDiv = document.createElement('div');
            thinkingDiv.textContent = '...';
            thinkingDiv.classList.add('p-2', 'rounded-lg', 'bg-gray-200', 'self-start', 'mb-2');
            chatMessages.appendChild(thinkingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const aiResponse = await getAIChatResponse(message);
                thinkingDiv.textContent = aiResponse;
            } catch (error) {
                thinkingDiv.textContent = 'Error getting response.';
                console.error(error);
            }
        });
    }

    // Event delegation for login and register forms
    document.body.addEventListener('submit', async (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const username = e.target.querySelector('#username').value;
            const password = e.target.querySelector('#password').value;
            try {
                await loginUser(username, password);
                router(); // Re-route to dashboard after login
            } catch (error) {
                alert(error.message);
            }
        } else if (e.target.id === 'register-form') {
            e.preventDefault();
            const username = e.target.querySelector('#username').value;
            const email = e.target.querySelector('#email').value;
            const password = e.target.querySelector('#password').value;
            try {
                await registerUser(username, email, password);
            } catch (error) {
                alert(error.message);
            }
        }
    });
});
