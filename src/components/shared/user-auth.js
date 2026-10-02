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

    // shadcn/ui Avatar + DropdownMenu, ported to plain markup with the same Tailwind classes
    // (Avatar / AvatarImage / AvatarFallback, DropdownMenuContent / Label / Separator / Item).
    renderAccountMenu(container) {
        const user = this.user || {};
        const displayName = user.display_name || 'My Account';
        const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2)
            .map(word => word[0].toUpperCase()).join('') || (user.email || '?')[0].toUpperCase();
        const avatarUrl = /^https:\/\//.test(user.avatar_url || '') ? user.avatar_url : '';
        const itemClass = 'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-slate-200 outline-none transition-colors hover:bg-slate-800 hover:text-slate-50 focus:bg-slate-800 focus:text-slate-50';

        container.innerHTML = `
            <div class="relative">
                <button type="button" class="account-menu-trigger flex items-center justify-center rounded-full"
                        aria-haspopup="menu" aria-expanded="false" data-state="closed" aria-label="Account menu for ${escapeHtml(displayName)}">
                    <span class="account-avatar relative flex size-8 shrink-0 overflow-hidden rounded-full transition-shadow">
                        ${avatarUrl ? `<img class="account-avatar-image aspect-square size-full object-cover" src="${escapeHtml(avatarUrl)}" alt="" referrerpolicy="no-referrer">` : ''}
                        <span class="account-avatar-fallback ${avatarUrl ? 'hidden' : 'flex'} size-full items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-100">${escapeHtml(initials)}</span>
                    </span>
                </button>
                <div class="account-menu-content hidden absolute right-0 top-full z-50 mt-2 min-w-56 overflow-hidden rounded-md border border-slate-700 bg-slate-950 p-1 text-slate-100 shadow-md" role="menu">
                    <div class="px-2 py-1.5">
                        <p class="truncate text-sm font-medium text-slate-100">${escapeHtml(displayName)}</p>
                        ${user.email ? `<p class="truncate text-xs text-slate-400">${escapeHtml(user.email)}</p>` : ''}
                    </div>
                    <div class="-mx-1 my-1 h-px bg-slate-800" role="separator"></div>
                    <a href="/my-collection.html" class="${itemClass}" role="menuitem">
                        <iconify-icon icon="lucide:bookmark" class="text-amber-400"></iconify-icon> My Collection
                    </a>
                    <div class="-mx-1 my-1 h-px bg-slate-800" role="separator"></div>
                    <button type="button" class="account-logout ${itemClass}" role="menuitem">
                        <iconify-icon icon="lucide:log-out" class="text-slate-400"></iconify-icon> Log out
                    </button>
                </div>
            </div>
        `;

        const trigger = container.querySelector('.account-menu-trigger');
        const menu = container.querySelector('.account-menu-content');
        const image = container.querySelector('.account-avatar-image');

        // AvatarFallback behavior: show initials until (or unless) the photo loads
        if (image) {
            image.addEventListener('error', () => {
                image.remove();
                container.querySelector('.account-avatar-fallback').classList.replace('hidden', 'flex');
            });
        }

        const setOpen = (open) => {
            menu.classList.toggle('hidden', !open);
            menu.style.transform = '';
            if (open) {
                // right-aligned to the avatar, but never past the left edge on narrow screens
                const overflow = 8 - menu.getBoundingClientRect().left;
                if (overflow > 0) menu.style.transform = `translateX(${overflow}px)`;
            }
            trigger.setAttribute('aria-expanded', String(open));
            trigger.dataset.state = open ? 'open' : 'closed';
        };
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            setOpen(menu.classList.contains('hidden'));
        });
        menu.addEventListener('click', (e) => e.stopPropagation());
        container.querySelector('.account-logout').addEventListener('click', () => this.logout());

        if (!this._accountMenuDismissBound) {
            this._accountMenuDismissBound = true;
            const closeAll = () => document.querySelectorAll('.account-menu-content').forEach(el => {
                el.classList.add('hidden');
                const t = el.parentElement.querySelector('.account-menu-trigger');
                t.setAttribute('aria-expanded', 'false');
                t.dataset.state = 'closed';
            });
            document.addEventListener('click', closeAll);
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
        }
    },

    updateUI() {
        // Shared UI elements like "Login" vs "My Account" in header
        const authContainers = document.querySelectorAll('.auth-nav-container');
        authContainers.forEach(container => {
            if (this.isLoggedIn()) {
                this.renderAccountMenu(container);
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
