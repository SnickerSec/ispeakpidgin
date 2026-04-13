/**
 * User Authentication Client
 * Handles user login, registration, and session management
 */
const UserAuth = {
    token: localStorage.getItem('userToken'),
    user: JSON.parse(localStorage.getItem('userData')),

    init() {
        this.updateUI();
        window.addEventListener('userStatusChanged', () => this.updateUI());
    },

    async login(email, password) {
        try {
            const response = await fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            this.setSession(data.token, data.user);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async register(email, password, display_name) {
        try {
            const response = await fetch('/api/user/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, display_name })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');

            this.setSession(data.token, data.user);
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.dispatchEvent(new CustomEvent('userStatusChanged', { detail: null }));
        window.location.href = '/';
    },

    setSession(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('userStatusChanged', { detail: user }));
    },

    isLoggedIn() {
        return !!this.token;
    },

    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    },

    updateUI() {
        // Shared UI elements like "Login" vs "My Account" in header
        const authContainers = document.querySelectorAll('.auth-nav-container');
        authContainers.forEach(container => {
            if (this.isLoggedIn()) {
                container.innerHTML = `
                    <div class="flex items-center gap-3">
                        <a href="/my-collection.html" class="text-sm font-bold text-gray-700 hover:text-blue-600 transition flex items-center gap-1">
                            <i class="ti ti-bookmarks"></i> Collection
                        </a>
                        <button onclick="UserAuth.logout()" class="text-xs text-gray-400 hover:text-red-500 transition">Logout</button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <a href="/login.html" class="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition">
                        Login
                    </a>
                `;
            }
        });
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => UserAuth.init());
window.UserAuth = UserAuth;
