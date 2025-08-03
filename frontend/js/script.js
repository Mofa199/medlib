const API_URL = 'http://127.0.0.1:5000'; // Assuming the backend runs here

const app = document.getElementById('app');

// --- UI Templates / Components ---

const renderHeader = () => {
    return `
        <header class="bg-white shadow-md p-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-blue-600">TAMSA Digital Library</h1>
            <nav>
                <a href="#/" class="text-gray-600 hover:text-blue-600 px-3">Home</a>
                <a href="#/courses" class="text-gray-600 hover:text-blue-600 px-3">Courses</a>
                <a href="#/about" class="text-gray-600 hover:text-blue-600 px-3">About</a>
                <a href="#/contact" class="text-gray-600 hover:text-blue-600 px-3">Contact</a>
                <a href="#/login" id="login-logout-link" class="text-gray-600 hover:text-blue-600 px-3 border-l-2 ml-3 pl-6">Login</a>
            </nav>
        </header>
    `;
};

const renderLoginPage = () => {
    return `
        <div class="flex items-center justify-center h-screen">
            <div class="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
                <form id="login-form">
                    <div class="mb-4">
                        <label for="username" class="block text-gray-700">Username</label>
                        <input type="text" id="username" class="w-full px-3 py-2 border rounded-lg" required>
                    </div>
                    <div class="mb-6">
                        <label for="password" class="block text-gray-700">Password</label>
                        <input type="password" id="password" class="w-full px-3 py-2 border rounded-lg" required>
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Login</button>
                </form>
            </div>
        </div>
    `;
};

const decodeJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};

const renderDashboardPage = () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.hash = '/login';
        return ''; // Return empty string because the redirect will happen
    }

    const userData = decodeJwt(token);
    const username = userData ? userData.identity.username : 'User';

    return `
        <div class="p-8">
            <h2 class="text-3xl font-bold mb-6">Welcome, ${username}!</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- My Progress Card -->
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-xl font-bold mb-4">My Progress</h3>
                    <p class="text-gray-700">You have completed <strong>3 of 10</strong> modules this week.</p>
                </div>
                <!-- Suggested Topics Card -->
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-xl font-bold mb-4">Suggested for you</h3>
                    <ul class="list-disc list-inside text-gray-700">
                        <li>Advanced Pharmacology</li>
                        <li>Cardiology Basics</li>
                    </ul>
                </div>
                <!-- Bookmarked Items Card -->
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-xl font-bold mb-4">My Bookmarks</h3>
                    <p class="text-gray-700">You have <strong>5</strong> bookmarked items.</p>
                </div>
            </div>
        </div>
    `;
};

const renderCoursesPage = () => {
    return `<h2 class="text-3xl p-6">Courses</h2><div id="course-list" class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>`;
};

const render404Page = () => {
    return `<h2 class="text-3xl p-6 text-center text-red-500">404 - Page Not Found</h2>`;
}

// --- Router ---

const renderAboutPage = () => {
    return `
        <div class="p-8">
            <h2 class="text-3xl font-bold mb-6">About Us</h2>
            <div class="bg-white p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-bold mb-4">Our Mission</h3>
                <p class="text-gray-700">To provide a world-class digital library experience for medical students, fostering learning and innovation.</p>
                <h3 class="text-xl font-bold mt-6 mb-4">Our History</h3>
                <p class="text-gray-700">Founded in 2024, the TAMSA Digital Library was created to address the growing need for accessible and high-quality digital academic resources.</p>
            </div>
        </div>
    `;
};

const renderContactPage = () => {
    return `
        <div class="p-8">
            <h2 class="text-3xl font-bold mb-6">Contact Us</h2>
            <div class="bg-white p-6 rounded-lg shadow-lg">
                <form>
                    <div class="mb-4">
                        <label for="name" class="block text-gray-700">Name</label>
                        <input type="text" id="name" class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div class="mb-4">
                        <label for="email" class="block text-gray-700">Email</label>
                        <input type="email" id="email" class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div class="mb-4">
                        <label for="message" class="block text-gray-700">Message</label>
                        <textarea id="message" rows="4" class="w-full px-3 py-2 border rounded-lg"></textarea>
                    </div>
                    <button type="submit" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Send Message</button>
                </form>
                <div class="mt-8">
                    <p><strong>Email:</strong> contact@tamsalibrary.com</p>
                    <p><strong>Phone:</strong> +123 456 7890</p>
                </div>
            </div>
        </div>
    `;
};

const routes = {
    '/': renderDashboardPage,
    '/login': renderLoginPage,
    '/courses': renderCoursesPage,
    '/about': renderAboutPage,
    '/contact': renderContactPage,
};

const router = () => {
    const path = window.location.hash.substring(1) || '/';
    const renderFunction = routes[path] || render404Page;

    // Always render the header, then the page content
    app.innerHTML = renderHeader();
    app.innerHTML += renderFunction();

    // Call page-specific logic after rendering
    if (path === '/courses') {
        fetchAndDisplayCourses();
    }
};

// --- UI Templates / Components ---
// ... (keep existing templates)

// --- API Communication ---

const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.hash = '/login';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) { // Unauthorized or Token expired
        logoutUser();
        return;
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An API error occurred');
    }

    return response.json();
};


const fetchAndDisplayCourses = async () => {
    try {
        const courses = await fetchWithAuth(`${API_URL}/admin/courses`);
        const courseList = document.getElementById('course-list');
        if (courses && courseList) {
            courseList.innerHTML = courses.map(course => `
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-xl font-bold mb-2">${course.name}</h3>
                    <p class="text-gray-700">${course.description || ''}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        alert(`Error fetching courses: ${error.message}`);
    }
};

const loginUser = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        localStorage.setItem('jwt_token', data.access_token);
        window.location.hash = '/'; // Redirect to dashboard
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};

const logoutUser = () => {
    localStorage.removeItem('jwt_token');
    window.location.hash = '/login';
};

// --- App Initialization & Event Handling ---

const handleAuthLink = () => {
    const loginLogoutLink = document.getElementById('login-logout-link');
    if (localStorage.getItem('jwt_token')) {
        loginLogoutLink.textContent = 'Logout';
        loginLogoutLink.href = '#';
        loginLogoutLink.onclick = (e) => {
            e.preventDefault();
            logoutUser();
        };
    } else {
        loginLogoutLink.textContent = 'Login';
        loginLogoutLink.href = '#/login';
        loginLogoutLink.onclick = null;
    }
}

const init = () => {
    // Listen for page changes
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);

    // Use event delegation for the login form
    app.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const username = e.target.elements.username.value;
            const password = e.target.elements.password.value;
            loginUser(username, password);
        }
    });

    // Update auth link on every route change
    window.addEventListener('hashchange', handleAuthLink);
    window.addEventListener('load', handleAuthLink);
};

init();
