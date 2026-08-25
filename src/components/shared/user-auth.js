/**
 * User Authentication Client
 * Handles user login, registration, Google authentication, and session management
 */
const UserAuth = {
    token: localStorage.getItem('userToken'),
    user: null,

    init() {
        try {
            const rawUser = localStorage.getItem('userData');
            this.user = rawUser ? JSON.parse(rawUser) : null;
        } catch (e) {
            this.user = null;
        }

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

    async loginWithGoogle(googleData) {
        try {
            const response = await fetch('/api/user/google-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(typeof googleData === 'string' ? { credential: googleData } : googleData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Google authentication failed');

            this.setSession(data.token, data.user);
            return data;
        } catch (error) {
            console.error('Google Auth error:', error);
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
                const displayName = this.user?.display_name || 'My Account';
                container.innerHTML = `
                    <div class="flex items-center gap-3">
                        <a href="/my-collection.html" class="text-sm font-bold text-slate-200 hover:text-blue-400 transition flex items-center gap-1">
                            <iconify-icon icon="lucide:bookmark" class="text-amber-400"></iconify-icon> ${escapeHtml(displayName)}
                        </a>
                        <button onclick="UserAuth.logout()" class="text-xs text-slate-400 hover:text-red-400 transition">Logout</button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <a href="/login.html" class="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                        Login
                    </a>
                `;
            }
        });
    }
};

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => UserAuth.init());
window.UserAuth = UserAuth;
