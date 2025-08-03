// =================================================================================
// 1. STATE AND CONFIGURATION
// =================================================================================
const API_URL = 'http://127.0.0.1:5000';
const app = document.getElementById('app');

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
    window.location.hash = '/';
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

// =================================================================================
// 3. UI COMPONENTS / RENDER FUNCTIONS
// =================================================================================
const renderHeader = () => `
    <header class="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-blue-600">TAMSA Digital Library</h1>
        <nav>
            <a href="#/" class="text-gray-600 hover:text-blue-600 px-3">Home</a>
            <a href="#/courses" class="text-gray-600 hover:text-blue-600 px-3">Courses</a>
            <a href="#/about" class="text-gray-600 hover:text-blue-600 px-3">About</a>
            <a href="#/contact" class="text-gray-600 hover:text-blue-600 px-3">Contact</a>
            <a href="#/login" id="login-logout-link" class="text-gray-600 hover:text-blue-600 px-3 border-l-2 ml-3 pl-6">Login</a>
        </nav>
    </header>`;

const renderLoginPage = () => `
    <div class="flex items-center justify-center h-screen">
        <div class="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
            <form id="login-form">
                <div class="mb-4"><label for="username" class="block text-gray-700">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg" required></div>
                <div class="mb-6"><label for="password" class="block text-gray-700">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg" required></div>
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Login</button>
            </form>
            <p class="text-center mt-4">Don't have an account? <a href="#/register" class="text-blue-600 hover:underline">Sign up</a></p>
        </div>
    </div>`;

const renderRegisterPage = () => `
    <div class="flex items-center justify-center h-screen">
        <div class="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2>
            <form id="register-form">
                <div class="mb-4"><label for="username" class="block text-gray-700">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg" required></div>
                <div class="mb-4"><label for="email" class="block text-gray-700">Email</label><input type="email" id="email" class="w-full px-3 py-2 border rounded-lg" required></div>
                <div class="mb-6"><label for="password" class="block text-gray-700">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg" required></div>
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Register</button>
            </form>
            <p class="text-center mt-4">Already have an account? <a href="#/login" class="text-blue-600 hover:underline">Login</a></p>
        </div>
    </div>`;

const renderDashboardPage = () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return window.location.hash = '/login', '';
    const username = decodeJwt(token)?.identity?.username || 'User';
    return `<div class="p-8"><h2 class="text-3xl font-bold mb-6">Welcome, ${username}!</h2>...</div>`; // Truncated for brevity
};

const renderCoursesPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">Courses</h2><div id="content-area"></div></div>`;
const renderModuleListPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">Modules</h2><div id="content-area"></div></div>`;
const renderTopicListPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">Topics</h2><div id="content-area"></div></div>`;
const renderTopicDetailPage = () => `<div class="p-8"><div id="content-area"></div></div>`;
const renderAboutPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">About Us</h2>...</div>`;
const renderContactPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">Contact Us</h2>...</div>`;
const render404Page = () => `<h2 class="text-3xl p-6 text-center text-red-500">404 - Page Not Found</h2>`;

// =================================================================================
// 4. ROUTER AND DATA FETCHING LOGIC
// =================================================================================
const fetchAndDisplayCourses = async () => {
    const courses = await fetchWithAuth(`${API_URL}/admin/courses`);
    document.getElementById('content-area').innerHTML = courses.map(course => `
        <a href="#/courses/${course.id}" class="block bg-white p-6 rounded-lg shadow-lg hover:bg-gray-50">
            <h3 class="text-xl font-bold mb-2">${course.name}</h3><p>${course.description || ''}</p>
        </a>`).join('');
};
const fetchAndDisplayModules = async (courseId) => {
    const modules = await fetchWithAuth(`${API_URL}/courses/${courseId}/modules`);
    document.getElementById('content-area').innerHTML = modules.map(module => `
        <a href="#/modules/${module.id}" class="block bg-white p-6 rounded-lg shadow-lg hover:bg-gray-50">
            <h3 class="text-xl font-bold mb-2">${module.name}</h3><p>${module.description || ''}</p>
        </a>`).join('');
};
const fetchAndDisplayTopics = async (moduleId) => {
    const topics = await fetchWithAuth(`${API_URL}/modules/${moduleId}/topics`);
    document.getElementById('content-area').innerHTML = topics.map(topic => `
        <a href="#/topics/${topic.id}" class="block bg-white p-4 rounded-lg shadow-md hover:bg-gray-50">
            <h4 class="font-semibold">${topic.name}</h4>
        </a>`).join('');
};
const fetchAndDisplayTopicDetails = async (topicId) => {
    const topic = await fetchWithAuth(`${API_URL}/topics/${topicId}`);
    document.getElementById('content-area').innerHTML = `
        <h2 class="text-4xl font-bold mb-4">${topic.name}</h2>
        <div class="prose max-w-none">${topic.content}</div>
        <h3 class="text-2xl font-bold mt-8 mb-4">Resources</h3>
        <ul>${topic.resources.map(r => `<li><a href="${r.path_or_url}" target="_blank" class="text-blue-600 hover:underline">${r.name}</a> (${r.resource_type})</li>`).join('')}</ul>`;
};

const routes = [
    { path: /^\/$/, view: renderDashboardPage },
    { path: /^\/login$/, view: renderLoginPage },
    { path: /^\/register$/, view: renderRegisterPage },
    { path: /^\/courses$/, view: renderCoursesPage, action: fetchAndDisplayCourses },
    { path: /^\/courses\/(\d+)$/, view: renderModuleListPage, action: (params) => fetchAndDisplayModules(params[0]) },
    { path: /^\/modules\/(\d+)$/, view: renderTopicListPage, action: (params) => fetchAndDisplayTopics(params[0]) },
    { path: /^\/topics\/(\d+)$/, view: renderTopicDetailPage, action: (params) => fetchAndDisplayTopicDetails(params[0]) },
    { path: /^\/about$/, view: renderAboutPage },
    { path: /^\/contact$/, view: renderContactPage },
];

const router = () => {
    const path = window.location.hash.substring(1) || '/';
    const match = routes.find(route => route.path.test(path));
    if (!match) {
        app.innerHTML = renderHeader() + render404Page();
        return;
    }
    const params = path.match(match.path).slice(1);
    app.innerHTML = renderHeader() + match.view(params);
    if (match.action) {
        try { match.action(params); } catch (e) { console.error(e); alert(e.message); }
    }
    handleAuthLink();
};

// =================================================================================
// 5. UTILS AND APP INITIALIZATION
// =================================================================================
const decodeJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
};
const logoutUser = () => {
    localStorage.removeItem('jwt_token');
    window.location.hash = '/login';
};
const handleAuthLink = () => {
    const link = document.getElementById('login-logout-link');
    if (!link) return;
    if (localStorage.getItem('jwt_token')) {
        link.textContent = 'Logout';
        link.href = '#';
        link.onclick = (e) => { e.preventDefault(); logoutUser(); };
    } else {
        link.textContent = 'Login';
        link.href = '#/login';
        link.onclick = null;
    }
};

const init = () => {
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
    app.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            if (e.target.id === 'login-form') {
                const { username, password } = e.target.elements;
                await loginUser(username.value, password.value);
            }
            if (e.target.id === 'register-form') {
                const { username, email, password } = e.target.elements;
                await registerUser(username.value, email.value, password.value);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });
};

init();
