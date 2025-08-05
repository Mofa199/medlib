// =================================================================================
// 1. STATE AND CONFIGURATION
// =================================================================================
const API_URL = 'http://127.0.0.1:5000';

// =================================================================================
// 2. API COMMUNICATION
// =================================================================================
const fetchWithAuth = async (url, options = {}) => {
    let token;
    try {
        token = localStorage.getItem('jwt_token');
    } catch (e) {
        console.error("Could not access localStorage.", e);
        logoutUser();
        throw new Error('Storage access failed.');
    }

    if (!token) {
        logoutUser();
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

    try {
        localStorage.setItem('jwt_token', data.access_token);
    } catch (e) {
        console.error("Could not access localStorage.", e);
        alert("Could not save session. Please ensure cookies and site data are enabled in your browser settings.");
        return;
    }

    await fetchUserProgress();
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

const logoutUser = () => {
    try {
        localStorage.removeItem('jwt_token');
    } catch (e) {
        console.error("Could not access localStorage.", e);
    }
    window.location.hash = '/login';
};

const getAIChatResponse = async (message) => {
    console.log(`Getting AI response for: ${message}`);
    return new Promise(resolve => setTimeout(() => resolve("This is a mocked AI response."), 500));
};

const fetchUserProgress = async () => {
    console.log("Fetching user progress (dummy).");
    return Promise.resolve();
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
            <a href="#/" class="text-gray-600 dark:text-gray-300 hover:text-blue-600">Home</a>
            <a href="#/courses" class="text-gray-600 dark:text-gray-300 hover:text-blue-600">Courses</a>
            <a href="#/about" class="text-gray-600 dark:text-gray-300 hover:text-blue-600">About</a>
            <a href="#/login" id="login-logout-link" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 border-l-2 ml-2 pl-4">Login</a>
        </nav>
    </header>`;

const renderFooter = () => `<footer class="bg-gray-800 text-white mt-12 py-8 px-4 text-center text-gray-500">© 2024 TAMSA Digital Library. All Rights Reserved.</footer>`;
const renderLoginPage = () => `<div class="flex items-center justify-center h-screen bg-gray-100"><div class="bg-white p-8 rounded-lg shadow-lg w-96"><h2 class="text-2xl font-bold mb-6 text-center">Login</h2><form id="login-form"><div class="mb-4"><label for="username" class="block">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg" required></div><div class="mb-6"><label for="password" class="block">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg" required></div><button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Login</button></form><p class="text-center mt-4">Don't have an account? <a href="#/register" class="text-blue-600 hover:underline">Sign up</a></p></div></div>`;
const renderRegisterPage = () => `<div class="flex items-center justify-center h-screen bg-gray-100"><div class="bg-white p-8 rounded-lg shadow-lg w-96"><h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2><form id="register-form"><div class="mb-4"><label for="username" class="block">Username</label><input type="text" id="username" class="w-full px-3 py-2 border rounded-lg" required></div><div class="mb-4"><label for="email" class="block">Email</label><input type="email" id="email" class="w-full px-3 py-2 border rounded-lg" required></div><div class="mb-6"><label for="password" class="block">Password</label><input type="password" id="password" class="w-full px-3 py-2 border rounded-lg" required></div><button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Register</button></form><p class="text-center mt-4">Already have an account? <a href="#/login" class="text-blue-600 hover:underline">Login</a></p></div></div>`;
const renderDashboardPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">Welcome!</h2><div id="dashboard-content"><p>Here is your dashboard.</p></div></div>`;
const renderCoursesPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">Courses</h2><div id="content-area"><p>Here are the available courses.</p></div></div>`;
const renderAboutPage = () => `<div class="p-8"><h2 class="text-3xl font-bold mb-6">About Us</h2><p>This is the TAMSA Digital Library.</p></div>`;
const render404Page = () => `<h2 class="text-3xl p-6 text-center text-red-500">404 - Page Not Found</h2>`;

// =================================================================================
// 4. ROUTER
// =================================================================================
const routes = [
    { path: /^\/$/, view: renderDashboardPage },
    { path: /^\/login$/, view: renderLoginPage },
    { path: /^\/register$/, view: renderRegisterPage },
    { path: /^\/courses$/, view: renderCoursesPage },
    { path: /^\/about$/, view: renderAboutPage },
];

const router = () => {
    const app = document.getElementById('app');
    if (!app) {
        console.error("Fatal Error: #app element not found.");
        return;
    }

    let token = null;
    try {
        token = localStorage.getItem('jwt_token');
    } catch (e) {
        console.error("Could not access localStorage.", e);
    }

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

    if (publicPages.includes(path)) {
        app.innerHTML = match.view();
    } else {
        app.innerHTML = renderHeader() + match.view() + renderFooter();
        handleAuthLink();
    }
};

// =================================================================================
// 5. UTILS AND APP INITIALIZATION
// =================================================================================
const handleAuthLink = () => {
    let token = null;
    try {
        token = localStorage.getItem('jwt_token');
    } catch (e) {
        console.error("Could not access localStorage.", e);
    }

    const link = document.getElementById('login-logout-link');
    if (!link) return;

    if (token) {
        link.textContent = 'Logout';
        link.href = '#/logout';
        link.onclick = (e) => {
            e.preventDefault();
            logoutUser();
        };
    } else {
        link.textContent = 'Login';
        link.href = '#/login';
        link.onclick = null;
    }
};

const initializeChatbot = () => {
    const chatOpenButton = document.getElementById('chat-open-button');
    const chatCloseButton = document.getElementById('chat-close-button');
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatOpenButton || !chatCloseButton || !chatWindow || !chatForm || !chatInput || !chatMessages) {
        console.warn("Chatbot UI elements not found.");
        return;
    }

    chatOpenButton.addEventListener('click', () => chatWindow.classList.remove('hidden'));
    chatCloseButton.addEventListener('click', () => chatWindow.classList.add('hidden'));

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        const userMessageDiv = document.createElement('div');
        userMessageDiv.textContent = message;
        userMessageDiv.className = 'p-2 rounded-lg bg-blue-100 self-end text-right mb-2 max-w-xs break-words';
        chatMessages.appendChild(userMessageDiv);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const thinkingDiv = document.createElement('div');
        thinkingDiv.textContent = '...';
        thinkingDiv.className = 'p-2 rounded-lg bg-gray-200 self-start mb-2';
        chatMessages.appendChild(thinkingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const aiResponse = await getAIChatResponse(message);
            thinkingDiv.textContent = aiResponse;
        } catch (error) {
            thinkingDiv.textContent = 'Sorry, I couldn\'t get a response.';
            console.error('AI Chat Error:', error);
        }
    });
};

const initializeApp = () => {
    window.addEventListener('hashchange', router);
    window.addEventListener('DOMContentLoaded', () => {
        router();
        initializeChatbot();

        document.body.addEventListener('submit', async (e) => {
            if (e.target.matches('#login-form')) {
                e.preventDefault();
                const username = e.target.querySelector('#username').value;
                const password = e.target.querySelector('#password').value;
                try {
                    await loginUser(username, password);
                } catch (error) {
                    alert(`Login Failed: ${error.message}`);
                }
            } else if (e.target.matches('#register-form')) {
                e.preventDefault();
                const username = e.target.querySelector('#username').value;
                const email = e.target.querySelector('#email').value;
                const password = e.target.querySelector('#password').value;
                try {
                    await registerUser(username, email, password);
                } catch (error) {
                    alert(`Registration Failed: ${error.message}`);
                }
            }
        });
    });
};

// Start the application
initializeApp();
