/**
 * Admin Panel JavaScript
 * Handles authentication, settings management, and admin UI interactions
 */

(function() {
    'use strict';

    // State
    let authToken = localStorage.getItem('adminToken');
    let currentUser = null;
    let settings = {};
    let pendingChanges = {};

    // DOM Elements
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const currentUserEl = document.getElementById('currentUser');
    const toastContainer = document.getElementById('toastContainer');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        setupEventListeners();

        if (authToken) {
            try {
                await verifySession();
                showDashboard();
            } catch (error) {
                logout();
            }
        } else {
            showLogin();
        }
    }

    function setupEventListeners() {
        // Login form
        loginForm.addEventListener('submit', handleLogin);

        // Logout
        logoutButton.addEventListener('click', logout);

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        // Refresh buttons
        document.getElementById('refreshSettingsBtn')?.addEventListener('click', refreshSettings);
        document.getElementById('refreshAuditLogBtn')?.addEventListener('click', loadAuditLog);

        // Save all settings
        document.getElementById('saveAllSettingsBtn')?.addEventListener('click', saveAllSettings);
    }

    // Authentication
    async function handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="spinner"></span> Signing in...';
        hideLoginError();

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', authToken);

            showDashboard();
            showToast('Logged in successfully', 'success');

        } catch (error) {
            showLoginError(error.message);
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Sign In';
        }
    }

    async function verifySession() {
        const response = await fetch('/api/admin/settings', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Session expired');
        }

        // Token is valid, get user info from token
        const payload = parseJwt(authToken);
        currentUser = { username: payload.username, role: payload.role };
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch {
            return {};
        }
    }

    async function logout() {
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        authToken = null;
        currentUser = null;
        localStorage.removeItem('adminToken');
        showLogin();
        showToast('Logged out', 'info');
    }

    // UI State
    function showLogin() {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        loginForm.reset();
    }

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');

        if (currentUser) {
            currentUserEl.textContent = currentUser.username;
        }

        loadSettings();
    }

    function showLoginError(message) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
    }

    function hideLoginError() {
        loginError.classList.add('hidden');
    }

    // Tab Switching
    function switchTab(tabId) {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });

        // Load tab-specific data
        if (tabId === 'audit-log') {
            loadAuditLog();
        }
    }

    // Settings Management
    async function loadSettings() {
        try {
            const response = await fetch('/api/admin/settings', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    return;
                }
                throw new Error('Failed to load settings');
            }

            settings = await response.json();
            renderSettings();
            renderApiKeys();
            renderFeatures();

        } catch (error) {
            showToast('Failed to load settings: ' + error.message, 'error');
        }
    }

    async function refreshSettings() {
        try {
            await fetch('/api/admin/settings/refresh', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            await loadSettings();
            showToast('Settings refreshed', 'success');
        } catch (error) {
            showToast('Failed to refresh settings', 'error');
        }
    }

    function renderSettings() {
        const container = document.getElementById('settingsContainer');
        const categoriesToShow = ['voice_settings', 'model_config', 'rate_limits', 'cache_settings', 'site'];

        let html = '';

        categoriesToShow.forEach(category => {
            if (!settings[category]) return;

            const categoryTitle = formatCategoryName(category);
            html += `
                <div class="p-4">
                    <h3 class="text-md font-medium text-gray-700 mb-3">${categoryTitle}</h3>
                    <div class="space-y-3">
            `;

            settings[category].forEach(setting => {
                html += renderSettingInput(setting);
            });

            html += '</div></div>';
        });

        container.innerHTML = html || '<p class="p-4 text-gray-500">No settings available</p>';

        // Add event listeners for inputs
        container.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => trackChange(input));
        });
    }

    function renderSettingInput(setting) {
        const inputId = `setting-${setting.key}`;
        let inputHtml = '';

        if (setting.type === 'boolean') {
            const checked = setting.value === 'true' || setting.value === true ? 'checked' : '';
            inputHtml = `
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="${inputId}" data-key="${setting.key}" ${checked}
                           class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            `;
        } else if (setting.type === 'number') {
            inputHtml = `
                <input type="number" id="${inputId}" data-key="${setting.key}" value="${setting.value || ''}"
                       step="any" class="w-32 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            `;
        } else {
            inputHtml = `
                <input type="text" id="${inputId}" data-key="${setting.key}" value="${setting.value || ''}"
                       class="w-64 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            `;
        }

        return `
            <div class="setting-row flex items-center justify-between py-2 px-3 rounded-lg">
                <div class="flex-1">
                    <label for="${inputId}" class="text-sm font-medium text-gray-700">${formatSettingName(setting.key)}</label>
                    <p class="text-xs text-gray-500">${setting.description || ''}</p>
                </div>
                <div class="ml-4">
                    ${inputHtml}
                </div>
            </div>
        `;
    }

    function renderApiKeys() {
        const container = document.getElementById('apiKeysContainer');

        if (!settings.api_keys) {
            container.innerHTML = '<p class="p-4 text-gray-500">No API keys configured</p>';
            return;
        }

        let html = '<div class="divide-y">';

        settings.api_keys.forEach(setting => {
            const inputId = `api-${setting.key}`;
            const isSecret = setting.isSecret;
            const maskedValue = isSecret ? setting.value : setting.value;

            html += `
                <div class="setting-row p-4">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <label for="${inputId}" class="text-sm font-medium text-gray-700">${formatSettingName(setting.key)}</label>
                            <p class="text-xs text-gray-500">${setting.description || ''}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="${isSecret ? 'password' : 'text'}" id="${inputId}" data-key="${setting.key}"
                               value="${maskedValue || ''}" placeholder="${isSecret ? '********' : ''}"
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono masked-input">
                        <button type="button" onclick="togglePasswordVisibility('${inputId}')"
                                class="text-gray-500 hover:text-gray-700 p-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                        <button type="button" onclick="testApiKey('${setting.key}')"
                                class="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                            Test
                        </button>
                        <button type="button" onclick="saveApiKey('${setting.key}')"
                                class="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            Save
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function renderFeatures() {
        const container = document.getElementById('featuresContainer');

        if (!settings.features) {
            container.innerHTML = '<p class="p-4 text-gray-500">No features configured</p>';
            return;
        }

        let html = '<div class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">';

        settings.features.forEach(setting => {
            const enabled = setting.value === 'true' || setting.value === true;
            const statusClass = enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
            const statusText = enabled ? 'Enabled' : 'Disabled';

            html += `
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-800">${formatSettingName(setting.key)}</h4>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${statusText}</span>
                    </div>
                    <p class="text-sm text-gray-500 mb-3">${setting.description || ''}</p>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" data-key="${setting.key}" ${enabled ? 'checked' : ''}
                               onchange="toggleFeature('${setting.key}', this.checked)"
                               class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function trackChange(input) {
        const key = input.dataset.key;
        let value;

        if (input.type === 'checkbox') {
            value = input.checked ? 'true' : 'false';
        } else {
            value = input.value;
        }

        pendingChanges[key] = value;

        // Visual feedback
        input.classList.add('border-yellow-400', 'bg-yellow-50');
    }

    async function saveAllSettings() {
        if (Object.keys(pendingChanges).length === 0) {
            showToast('No changes to save', 'info');
            return;
        }

        const saveBtn = document.getElementById('saveAllSettingsBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span> Saving...';

        try {
            const response = await fetch('/api/admin/settings/bulk', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(pendingChanges)
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            const result = await response.json();
            pendingChanges = {};

            // Remove visual feedback
            document.querySelectorAll('.border-yellow-400').forEach(el => {
                el.classList.remove('border-yellow-400', 'bg-yellow-50');
            });

            showToast(`Saved ${result.updated} settings`, 'success');
            await loadSettings();

        } catch (error) {
            showToast('Failed to save settings: ' + error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save All Changes';
        }
    }

    // Audit Log
    async function loadAuditLog() {
        const container = document.getElementById('auditLogBody');

        try {
            const response = await fetch('/api/admin/audit-log?limit=50', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load audit log');
            }

            const data = await response.json();

            if (!data.logs || data.logs.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                            No audit log entries
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = data.logs.map(log => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-600">${formatDate(log.created_at)}</td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-800">${log.username || 'Unknown'}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${log.action}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${log.resource || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">${log.ip_address || '-'}</td>
                </tr>
            `).join('');

        } catch (error) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-red-500">
                        Failed to load audit log: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    // Toast Notifications
    function showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => toast.remove(), 5000);
    }

    // Utility Functions
    function formatCategoryName(category) {
        return category
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    function formatSettingName(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace('Api', 'API')
            .replace('Tts', 'TTS')
            .replace('Ttl', 'TTL');
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Global functions for onclick handlers
    window.togglePasswordVisibility = function(inputId) {
        const input = document.getElementById(inputId);
        input.type = input.type === 'password' ? 'text' : 'password';
    };

    window.testApiKey = async function(key) {
        const input = document.querySelector(`[data-key="${key}"]`);
        const value = input.value;

        if (!value || value === '********' || value.includes('********')) {
            showToast('Please enter a valid API key to test', 'warning');
            return;
        }

        let endpoint = '';
        if (key === 'elevenlabs_api_key') {
            endpoint = '/api/admin/test/elevenlabs';
        } else if (key === 'gemini_api_key') {
            endpoint = '/api/admin/test/gemini';
        } else {
            showToast('Testing not available for this key', 'info');
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ apiKey: value })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showToast(`API key is valid: ${result.message || 'Test passed'}`, 'success');
            } else {
                showToast(`API key test failed: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showToast('Failed to test API key: ' + error.message, 'error');
        }
    };

    window.saveApiKey = async function(key) {
        const input = document.querySelector(`[data-key="${key}"]`);
        const value = input.value;

        if (!value || value === '********' || value.includes('********')) {
            showToast('Please enter a valid API key to save', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ key, value })
            });

            if (!response.ok) {
                throw new Error('Failed to save API key');
            }

            showToast('API key saved successfully', 'success');
            input.classList.remove('border-yellow-400', 'bg-yellow-50');

        } catch (error) {
            showToast('Failed to save API key: ' + error.message, 'error');
        }
    };

    window.toggleFeature = async function(key, enabled) {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ key, value: enabled ? 'true' : 'false' })
            });

            if (!response.ok) {
                throw new Error('Failed to update feature');
            }

            showToast(`Feature ${enabled ? 'enabled' : 'disabled'}`, 'success');
            await loadSettings();

        } catch (error) {
            showToast('Failed to toggle feature: ' + error.message, 'error');
            // Revert checkbox
            const checkbox = document.querySelector(`[data-key="${key}"]`);
            if (checkbox) checkbox.checked = !enabled;
        }
    };
})();
