/**
 * User Authentication Client
 * Handles Google Sign-In and session management
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

    // credential: the ID token Google Identity Services hands to the button callback
    async loginWithGoogle(credential) {
        try {
            const response = await fetch('/api/user/google-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
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

    // Loads Google Identity Services once per page and initializes it with the site's
    // client ID. Every Google button on the page shares this single initialization.
    loadGoogle() {
        if (!this._googleReady) {
            this._googleReady = (async () => {
                const res = await fetch('/api/user/auth-config');
                const { googleClientId } = await res.json();
                if (!googleClientId) throw new Error('Sign-in is temporarily unavailable. Please try again later.');

                if (!window.google?.accounts?.id) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://accounts.google.com/gsi/client';
                        script.async = true;
                        script.onload = resolve;
                        script.onerror = () => reject(new Error('Could not load Google Sign-In. Check your connection or disable blockers for this site.'));
                        document.head.appendChild(script);
                    });
                }

                google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: (response) => this.handleGoogleCredential(response),
                    ux_mode: 'popup'
                });
            })().catch(error => {
                this._googleReady = null; // allow a retry on the next render
                throw error;
            });
        }
        return this._googleReady;
    },

    async renderGoogleButton(element, options) {
        await this.loadGoogle();
        element.innerHTML = '';
        google.accounts.id.renderButton(element, options);
    },

    // Pages listen for 'googleSignIn' / 'googleSignInError' to react (e.g. redirect, show errors)
    async handleGoogleCredential(response) {
        try {
            const data = await this.loginWithGoogle(response.credential);
            if (window.favoritesManager) await window.favoritesManager.syncFromCloud();
            window.dispatchEvent(new CustomEvent('googleSignIn', { detail: data }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('googleSignInError', { detail: error }));
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
                // The Login link stays as the fallback if Google's script is blocked or fails
                container.innerHTML = `
                    <a href="/login.html" class="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                        Login
                    </a>
                `;
                const swapInGoogleButton = () => {
                    if (this.isLoggedIn()) return;
                    this.renderGoogleButton(container, {
                        type: 'standard',
                        size: 'small',
                        theme: 'filled_black',
                        shape: 'pill',
                        text: 'signin'
                    }).catch(() => {});
                };
                // Defer the third-party script so it never competes with page load
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(swapInGoogleButton, { timeout: 3000 });
                } else {
                    setTimeout(swapInGoogleButton, 1500);
                }
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
