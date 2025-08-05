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

const getAIChatResponse = async (message) => {
    // --- How to Integrate a Real AI Service (e.g., OpenAI) ---
    // 1. Get an API Key from your AI provider.
    // 2. This should ideally be handled via a backend proxy to protect your key.
    // 3. Replace the mock function below with a real fetch call.
    /*
    const API_KEY = 'YOUR_OPENAI_API_KEY';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "system", content: "You are a helpful library assistant." }, { role: "user", content: message }] })
    });
    const data = await response.json();
    return data.choices[0].message.content;
    */
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
            <div class="flex-1">
                <form id="search-form" class="w-full max-w-sm">
                    <input type="search" id="search-input" placeholder="Search..." class="w-full px-3 py-1.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </form>
            </div>
            <a href="#/" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Home</a>
            <a href="#/courses" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Courses</a>
            <a href="#/pharmacology" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Pharmacology</a>
            <a href="#/news" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">News</a>
            <a href="#/events" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Events</a>
            <a href="#/about" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">About</a>
            <a href="#/faq" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">FAQ</a>
            <a href="#/contact" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
            <button id="theme-toggle" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            </button>
            <a href="#/login" id="login-logout-link" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-l-2 dark:border-gray-600 ml-2 pl-4">Login</a>
            <div id="admin-link-container"></div>
        </nav>
    </header>`;

const renderSearchResultsPage = (params) => `<div class="p-8"><h2 class="text-3xl font-bold mb-6 dark:text-white">Search Results for "${params[0]}"</h2><div id="content-area" class="space-y-4"></div></div>`;
// ... (other render functions)

// =================================================================================
// 4. ROUTER AND DATA FETCHING LOGIC
// =================================================================================
const fetchAndDisplaySearchResults = async (query) => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    contentArea.innerHTML = `<p class="dark:text-white">Searching...</p>`;
    const results = await fetchWithAuth(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    if (results.length === 0) {
        contentArea.innerHTML = `<p class="dark:text-white">No results found for "${query}".</p>`;
        return;
    }
    contentArea.innerHTML = results.map(result => `
        <a href="${result.url}" class="block bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700">
            <h4 class="font-semibold dark:text-white">${result.name} <span class="text-sm text-gray-500 dark:text-gray-400">(${result.type})</span></h4>
        </a>`).join('');
};

const routes = [
    // ... (other routes)
    { path: /^\/search\?q=(.+)$/, view: (p) => renderSearchResultsPage(p), action: (p) => fetchAndDisplaySearchResults(p[0]) },
];

// =================================================================================
// 5. UTILS AND APP INITIALIZATION
// =================================================================================
const init = () => {
    // ... (other init logic)
    app.addEventListener('submit', async (e) => {
        // ... (other form logic)
        if (e.target.id === 'search-form') {
            const query = e.target.elements['search-input'].value.trim();
            if (query) {
                window.location.hash = `/search?q=${encodeURIComponent(query)}`;
            }
        }
    });
    // ...
};

init();
// NOTE: This is not the full file, but a representation of the changes to be made.
// I will construct the full file before overwriting.
