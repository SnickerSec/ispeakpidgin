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
    
    // Dictionary Manager State
    let adminDict = [];
    let adminDictFiltered = [];
    let adminDictPage = 1;
    const ADMIN_DICT_PER_PAGE = 20;
    let adminDictSearch = '';

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
        setupEventDelegation();

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
        document.getElementById('refreshGapsBtn')?.addEventListener('click', loadSearchGaps);
        document.getElementById('refreshSuggestionsBtn')?.addEventListener('click', loadSuggestions);
        document.getElementById('suggestionStatusSelect')?.addEventListener('change', loadSuggestions);
        document.getElementById('refreshQuestionsBtn')?.addEventListener('click', loadQuestionsAdmin);
        document.getElementById('questionStatusSelect')?.addEventListener('change', loadQuestionsAdmin);
        
        // Dictionary Manager listeners
        document.getElementById('admin-dict-search')?.addEventListener('input', (e) => {
            adminDictSearch = e.target.value.toLowerCase();
            adminDictPage = 1;
            filterAndRenderAdminDict();
        });
        document.getElementById('refreshAdminDictBtn')?.addEventListener('click', loadAdminDictionary);
        document.getElementById('prevAdminDictPage')?.addEventListener('click', () => {
            if (adminDictPage > 1) {
                adminDictPage--;
                renderAdminDict();
            }
        });
        document.getElementById('nextAdminDictPage')?.addEventListener('click', () => {
            const maxPage = Math.ceil(adminDictFiltered.length / ADMIN_DICT_PER_PAGE);
            if (adminDictPage < maxPage) {
                adminDictPage++;
                renderAdminDict();
            }
        });

        // Save all settings
        document.getElementById('saveAllSettingsBtn')?.addEventListener('click', saveAllSettings);

        // Audio upload change listener
        document.getElementById('audio-upload-input')?.addEventListener('change', handleAudioFileSelected);

        // Dashboard quick-access buttons
        document.getElementById('dash-view-suggestions')?.addEventListener('click', () => switchTab('suggestions'));
        document.getElementById('dash-view-questions')?.addEventListener('click', () => switchTab('questions'));
        document.getElementById('dash-view-gaps')?.addEventListener('click', () => switchTab('gaps'));
    }

    // Dictionary Manager Functions
    async function loadAdminDictionary() {
        const container = document.getElementById('adminDictContainer');
        if (!container) return;

        try {
            const response = await fetch('/api/dictionary/all');
            const data = await response.json();
            
            // The API returns { entries: [...], stats: {...} }
            adminDict = data.entries || [];
            filterAndRenderAdminDict();
        } catch (error) {
            console.error('Error loading admin dictionary:', error);
            container.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Error loading dictionary</td></tr>`;
        }
    }

    function filterAndRenderAdminDict() {
        if (!adminDict) return;
        
        adminDictFiltered = adminDict.filter(entry => {
            const pidgin = (entry.pidgin || '').toLowerCase();
            const english = Array.isArray(entry.english) ? entry.english.join(' ').toLowerCase() : (entry.english || '').toLowerCase();
            return pidgin.includes(adminDictSearch) || english.includes(adminDictSearch);
        });

        adminDictPage = 1;
        renderAdminDict();
    }

    function renderAdminDict() {
        const container = document.getElementById('adminDictContainer');
        const showingEl = document.getElementById('admin-dict-showing');
        const prevBtn = document.getElementById('prevAdminDictPage');
        const nextBtn = document.getElementById('nextAdminDictPage');

        if (!container) return;

        const start = (adminDictPage - 1) * ADMIN_DICT_PER_PAGE;
        const end = start + ADMIN_DICT_PER_PAGE;
        const pageItems = adminDictFiltered.slice(start, end);

        if (adminDictFiltered.length === 0) {
            container.innerHTML = `<tr><td colspan="4" class="px-6 py-12 text-center text-gray-500">No matching words found.</td></tr>`;
            if (showingEl) showingEl.textContent = 'Showing 0 of 0';
            return;
        }

        container.innerHTML = pageItems.map(entry => {
            const hasAudio = !!entry.audio_url || !!entry.audio;
            const pidgin = escapeHtml(entry.pidgin);
            const english = Array.isArray(entry.english) 
                ? entry.english.map(e => escapeHtml(e)).join(', ') 
                : escapeHtml(entry.english);
            const category = escapeHtml(entry.category || 'general');
            const audioUrl = escapeHtml(entry.audio_url || entry.audio || '');
            const entryId = escapeHtml(entry.id);

            return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-bold text-purple-700">${pidgin}</div>
                        <div class="text-[10px] text-gray-400 uppercase tracking-tighter">${category}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-600 line-clamp-1">${english}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${hasAudio ? 
                            `<span class="flex items-center gap-1 text-green-600 text-xs font-bold">
                                <i class="ti ti-circle-check"></i> Ready
                                <button data-action="play-audio" data-url="${audioUrl}" class="ml-1 text-blue-500 hover:text-blue-700">
                                    <i class="ti ti-player-play"></i>
                                </button>
                            </span>` : 
                            `<span class="text-red-400 text-xs font-medium italic">Missing Audio</span>`
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button data-action="upload-audio" data-id="${entryId}" data-pidgin="${pidgin}"
                                class="bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition flex items-center gap-1 ml-auto">
                            <i class="ti ti-upload"></i> ${hasAudio ? 'Replace' : 'Add Audio'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        if (showingEl) {
            showingEl.textContent = `Showing ${start + 1}-${Math.min(end, adminDictFiltered.length)} of ${adminDictFiltered.length}`;
        }

        if (prevBtn) prevBtn.disabled = adminDictPage === 1;
        if (nextBtn) nextBtn.disabled = end >= adminDictFiltered.length;
    }

    let currentUploadId = null;
    let currentUploadPidgin = null;

    function triggerAudioUpload(id, pidgin) {
        currentUploadId = id;
        currentUploadPidgin = pidgin;
        document.getElementById('audio-upload-input').click();
    }

    async function handleAudioFileSelected(e) {
        const file = e.target.files[0];
        if (!file || !currentUploadId) return;

        // Reset input
        e.target.value = '';

        const formData = new FormData();
        formData.append('audio', file);
        formData.append('pidgin', currentUploadPidgin);

        showToast(`Uploading audio for "${currentUploadPidgin}"...`, 'info');

        try {
            const response = await fetch(`/api/admin/dictionary/${currentUploadId}/audio`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            showToast('Audio uploaded successfully!', 'success');
            loadAdminDictionary(); // Refresh list
        } catch (error) {
            showToast('Error uploading audio: ' + error.message, 'error');
        }
    }

    function playAdminAudio(url) {
        if (!url) return;
        const audio = new Audio(url);
        audio.play().catch(e => console.error('Error playing audio:', e));
    }

    // Event delegation for dynamically created elements
    function setupEventDelegation() {
        // Gaps container - handle quick-add and suggest buttons
        document.getElementById('gapsContainer')?.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const pidgin = target.dataset.pidgin;
            const id = target.dataset.id;
            const row = target.closest('tr');

            if (target.dataset.action === 'add-gap-btn') {
                const english = row.querySelector('.gap-english-input')?.value;
                const category = row.querySelector('.gap-category-select')?.value;
                const example = row.querySelector('.gap-example-input')?.value;
                const pronunciation = target.dataset.pronunciation || '';

                if (!english) {
                    showToast('Please enter an English translation', 'warning');
                    return;
                }

                addGapToDictionary(pidgin, english, category, example, pronunciation, target, id);
            } else if (target.dataset.action === 'suggest-gap') {
                suggestGapData(pidgin, row, target);
            } else if (target.dataset.action === 'ignore-gap') {
                ignoreGap(id, target);
            }
        });

        // Suggestions container - handle approve and reject buttons
        document.getElementById('suggestionsContainer')?.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            const action = target.dataset.action;

            if (action === 'approve') {
                updateSuggestionStatus(id, 'approved', target);
            } else if (action === 'reject') {
                updateSuggestionStatus(id, 'rejected', target);
            }
        });

        // Questions container - handle answer/reject actions
        document.getElementById('questionsContainer')?.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            const action = target.dataset.action;

            if (action === 'answer') {
                promptAndAnswerQuestion(id, target);
            } else if (action === 'reject-question') {
                updateQuestionStatus(id, 'rejected', target);
            }
        });

        // Dictionary container - handle audio upload and play
        document.getElementById('adminDictContainer')?.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            const action = target.dataset.action;
            const pidgin = target.dataset.pidgin;

            if (action === 'upload-audio') {
                triggerAudioUpload(id, pidgin);
            } else if (action === 'play-audio') {
                playAdminAudio(target.dataset.url);
            }
        });

        // API Keys container - handle toggle visibility, test, and save buttons
        document.getElementById('apiKeysContainer')?.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const action = target.dataset.action;
            const key = target.dataset.key;

            if (action === 'toggle-visibility') {
                togglePasswordVisibility(key);
            } else if (action === 'test') {
                testApiKey(key);
            } else if (action === 'save') {
                saveApiKey(key);
            }
        });

        // Features container - handle toggle switches
        document.getElementById('featuresContainer')?.addEventListener('change', function(e) {
            const target = e.target;
            if (target.type === 'checkbox' && target.dataset.key) {
                toggleFeature(target.dataset.key, target.checked);
            }
        });

        // Toast container - handle close buttons
        toastContainer?.addEventListener('click', function(e) {
            const closeBtn = e.target.closest('[data-action="close-toast"]');
            if (closeBtn) {
                closeBtn.closest('.toast').remove();
            }
        });
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
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMsg = data.errors.map(err => err.msg || err.message).join(', ');
                    throw new Error(errorMsg);
                }
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

        switchTab('dashboard');
        loadSettings(); // Pre-load settings for other tabs
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
        } else if (tabId === 'gaps') {
            loadSearchGaps();
        } else if (tabId === 'suggestions') {
            loadSuggestions();
        } else if (tabId === 'questions') {
            loadQuestionsAdmin();
        } else if (tabId === 'dictionary') {
            loadAdminDictionary();
        } else if (tabId === 'dashboard') {
            loadDashboardStats();
        } else if (tabId === 'settings' || tabId === 'api-keys' || tabId === 'features') {
            loadSettings();
        }
    }

    // Dashboard Stats
    async function loadDashboardStats() {
        const suggEl = document.getElementById('dash-pending-suggestions');
        const questEl = document.getElementById('dash-pending-questions');
        const gapEl = document.getElementById('dash-pending-gaps');

        try {
            const response = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json();

            if (suggEl) suggEl.textContent = data.pendingSuggestions || 0;
            if (questEl) questEl.textContent = data.pendingQuestions || 0;
            if (gapEl) gapEl.textContent = data.pendingGaps || 0;

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    // User Suggestions
    async function loadSuggestions() {
        const container = document.getElementById('suggestionsContainer');
        const refreshBtn = document.getElementById('refreshSuggestionsBtn');
        const statusSelect = document.getElementById('suggestionStatusSelect');
        const status = statusSelect?.value || 'pending';

        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="spinner"></span> Loading...';
        }

        try {
            const response = await fetch(`/api/admin/suggestions?status=${status}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) throw new Error('Failed to fetch suggestions');

            const data = await response.json();

            if (!data.suggestions || data.suggestions.length === 0) {
                const escapedStatus = escapeHtml(status);
                container.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                            No ${escapedStatus} suggestions found.
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = data.suggestions.map(s => {
                const pidgin = escapeHtml(s.pidgin);
                const english = escapeHtml(s.english);
                const example = s.example ? escapeHtml(s.example) : null;
                const contributor = escapeHtml(s.contributor_name || 'Anonymous');

                return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-medium text-gray-900">${pidgin}</div>
                        <div class="text-xs text-gray-500">Added: ${formatDate(s.created_at)}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">${english}</div>
                        ${example ? `<div class="text-xs text-gray-500 italic mt-1">"${example}"</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${contributor}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${status === 'pending' ? `
                            <div class="flex justify-center gap-2">
                                <button data-action="approve" data-id="${s.id}"
                                        class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">
                                    Approve
                                </button>
                                <button data-action="reject" data-id="${s.id}"
                                        class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">
                                    Reject
                                </button>
                            </div>
                        ` : `
                            <span class="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }">
                                ${status}
                            </span>
                        `}
                    </td>
                </tr>
            `;}).join('');

        } catch (error) {
            const escapedMessage = escapeHtml(error.message);
            container.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-red-500">
                        Error loading suggestions: ${escapedMessage}
                    </td>
                </tr>
            `;
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = 'Refresh';
            }
        }
    }

    async function updateSuggestionStatus(id, status, button) {
        const originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<span class="spinner spinner-white"></span>';

        try {
            const response = await fetch(`/api/admin/suggestions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error(`Failed to ${status} suggestion`);

            showToast(`Suggestion ${status}`, 'success');
            
            // Remove the row
            const row = button.closest('tr');
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 300);

        } catch (error) {
            showToast('Error: ' + error.message, 'error');
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }

    // Local Questions (Admin)
    async function loadQuestionsAdmin() {
        const container = document.getElementById('questionsContainer');
        const refreshBtn = document.getElementById('refreshQuestionsBtn');
        const statusSelect = document.getElementById('questionStatusSelect');
        const status = statusSelect?.value || 'all';

        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="spinner"></span> Loading...';
        }

        try {
            const response = await fetch(`/api/questions?status=${status}&limit=100`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) throw new Error('Failed to fetch questions');

            const data = await response.json();

            if (!data.questions || data.questions.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-12 text-center text-gray-500">
                            No questions found.
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = data.questions.map(q => {
                const questionText = escapeHtml(q.question_text);
                const userName = escapeHtml(q.user_name);
                const responseText = q.responses && q.responses.length > 0 ? escapeHtml(q.responses[0].response_text) : null;
                const escapedStatus = escapeHtml(q.status);
                const escapedId = escapeHtml(q.id);
                const statusClass = q.status === 'answered' ? 'bg-green-100 text-green-700' : 
                                    q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

                return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                        <div class="text-sm font-bold text-gray-900">${questionText}</div>
                        <div class="text-xs text-gray-500 mt-1">By ${userName} • ${formatDate(q.created_at)}</div>
                        ${responseText ? `
                            <div class="mt-2 p-2 bg-green-50 rounded border border-green-100">
                                <div class="text-xs font-bold text-green-800">Answer:</div>
                                <div class="text-xs text-green-700">${responseText}</div>
                            </div>
                        ` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass}">
                            ${escapedStatus}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-center gap-2">
                            <button data-action="answer" data-id="${escapedId}"
                                    class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">
                                ${q.status === 'answered' ? 'Edit Answer' : 'Answer'}
                            </button>
                            ${q.status !== 'rejected' ? `
                                <button data-action="reject-question" data-id="${escapedId}"
                                        class="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition">
                                    Reject
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;}).join('');

        } catch (error) {
            const escapedMessage = escapeHtml(error.message);
            container.innerHTML = `
                <tr>
                    <td colspan="3" class="px-6 py-12 text-center text-red-500">
                        Error loading questions: ${escapedMessage}
                    </td>
                </tr>
            `;
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = 'Refresh';
            }
        }
    }

    async function promptAndAnswerQuestion(id, button) {
        const row = button.closest('tr');
        const questionText = row.querySelector('.text-sm.font-bold').textContent;
        const currentAnswer = row.querySelector('.text-xs.text-green-700')?.textContent || '';
        
        const answer = prompt(`Answer for: "${questionText}"`, currentAnswer);
        if (answer === null) return; // Cancelled
        if (!answer.trim()) return alert('Answer cannot be empty');

        button.disabled = true;
        const originalHtml = button.innerHTML;
        button.innerHTML = '<span class="spinner spinner-white"></span>';

        try {
            // We need a specific endpoint for answering questions
            const response = await fetch(`/api/admin/questions/${id}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ response_text: answer })
            });

            if (!response.ok) throw new Error('Failed to save answer');

            showToast('Answer saved successfully', 'success');
            loadQuestionsAdmin(); // Reload list

        } catch (error) {
            showToast('Error: ' + error.message, 'error');
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }

    async function updateQuestionStatus(id, status, button) {
        if (!confirm(`Are you sure you want to ${status} this question?`)) return;

        button.disabled = true;
        const originalHtml = button.innerHTML;
        button.innerHTML = '<span class="spinner spinner-white"></span>';

        try {
            const response = await fetch(`/api/admin/questions/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update status');

            showToast(`Question ${status}`, 'success');
            loadQuestionsAdmin();

        } catch (error) {
            showToast('Error: ' + error.message, 'error');
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }

    // Search Gaps
    async function loadSearchGaps() {
        const container = document.getElementById('gapsContainer');
        const refreshBtn = document.getElementById('refreshGapsBtn');

        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="spinner"></span> Scanning...';
        }

        try {
            const response = await fetch('/api/admin/gaps', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) throw new Error('Failed to fetch gaps');

            const data = await response.json();

            if (!data.gaps || data.gaps.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                            No search gaps found yet. Keep searching!
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = data.gaps.map(g => {
                const term = escapeHtml(g.term);
                const escapedStatus = escapeHtml(g.status);
                const escapedCount = escapeHtml(String(g.count));
                return `
                <tr class="hover:bg-gray-50" data-pidgin="${term}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-bold text-gray-900">${term}</div>
                        <div class="text-[10px] text-gray-500 mt-1 uppercase">Last searched: ${formatDate(g.last_searched_at)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-bold text-purple-600">${escapedCount} searches</div>
                        <div class="text-[10px] text-gray-400 uppercase">Status: ${escapedStatus}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col gap-2">
                            <div class="flex gap-2">
                                <input type="text" placeholder="English translation" 
                                       class="gap-english-input flex-1 px-2 py-1 text-xs border rounded outline-none focus:ring-1 focus:ring-purple-400">
                                <select class="gap-category-select px-2 py-1 text-xs border rounded outline-none focus:ring-1 focus:ring-purple-400">
                                    <option value="general">General</option>
                                    <option value="slang">Slang</option>
                                    <option value="food">Food</option>
                                    <option value="expressions">Expressions</option>
                                    <option value="culture">Culture</option>
                                </select>
                            </div>
                            <input type="text" placeholder="Example sentence" 
                                   class="gap-example-input w-full px-2 py-1 text-xs border rounded outline-none focus:ring-1 focus:ring-purple-400">
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex flex-col gap-2">
                            <div class="flex gap-2">
                                <button data-action="suggest-gap" data-pidgin="${term}"
                                        class="flex-1 bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 transition text-xs font-bold border border-purple-200">
                                    <i class="ti ti-wand"></i> Suggest
                                </button>
                                <button data-action="add-gap-btn" data-id="${g.id}" data-pidgin="${term}"
                                        class="flex-1 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition text-xs font-bold shadow-sm">
                                    <i class="ti ti-plus"></i> Add
                                </button>
                            </div>
                            <button data-action="ignore-gap" data-id="${g.id}"
                                    class="w-full bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition text-xs border border-gray-200">
                                <i class="ti ti-trash"></i> Ignore Gap
                            </button>
                        </div>
                    </td>
                </tr>
            `;}).join('');

            // Auto-trigger AI suggestions for top 5 gaps if they are empty
            const rows = container.querySelectorAll('tr[data-pidgin]');
            rows.forEach((row, index) => {
                if (index < 5) {
                    const pidgin = row.dataset.pidgin;
                    const englishInput = row.querySelector('.gap-english-input');
                    if (englishInput && !englishInput.value) {
                        const suggestBtn = row.querySelector('[data-action="suggest-gap"]');
                        if (suggestBtn) suggestGapData(pidgin, row, suggestBtn);
                    }
                }
            });

        } catch (error) {
            const escapedMessage = escapeHtml(error.message);
            container.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-red-500">
                        Error loading gaps: ${escapedMessage}
                    </td>
                </tr>
            `;
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = 'Scan for Gaps';
            }
        }
    }

    async function addGapToDictionary(pidgin, english, category, example, pronunciation, button, gapId) {
        button.disabled = true;
        const originalHtml = button.innerHTML;
        button.innerHTML = '<span class="spinner spinner-white"></span>';

        try {
            const response = await fetch('/api/admin/dictionary/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ 
                    pidgin, 
                    english, 
                    category, 
                    examples: example ? [example] : [],
                    pronunciation
                })
            });

            if (!response.ok) throw new Error('Failed to add entry');

            // Now update the gap status if a gapId was provided
            if (gapId) {
                await fetch(`/api/admin/gaps/${gapId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ status: 'added' })
                });
            }

            showToast(`Added "${pidgin}" to dictionary`, 'success');
            
            // Remove the row
            const row = button.closest('tr');
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 300);

            // Update dashboard count if visible
            const gapCountEl = document.getElementById('dash-pending-gaps');
            if (gapCountEl) {
                const current = parseInt(gapCountEl.textContent) || 0;
                gapCountEl.textContent = Math.max(0, current - 1);
            }

        } catch (error) {
            showToast('Error: ' + error.message, 'error');
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }

    async function ignoreGap(id, button) {
        button.disabled = true;
        const originalHtml = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span>';

        try {
            const response = await fetch(`/api/admin/gaps/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ status: 'ignored' })
            });

            if (!response.ok) throw new Error('Failed to ignore gap');

            showToast('Gap ignored', 'info');
            
            // Remove the row
            const row = button.closest('tr');
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 300);

            // Update dashboard count
            const gapCountEl = document.getElementById('dash-pending-gaps');
            if (gapCountEl) {
                const current = parseInt(gapCountEl.textContent) || 0;
                gapCountEl.textContent = Math.max(0, current - 1);
            }

        } catch (error) {
            showToast('Error: ' + error.message, 'error');
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }

    async function suggestGapData(pidgin, row, button) {
        button.disabled = true;
        const originalHtml = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span>';

        try {
            const response = await fetch('/api/admin/seo/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ pidgin })
            });

            if (!response.ok) throw new Error('AI suggestion failed');

            const data = await response.json();

            // Populate fields
            const englishInput = row.querySelector('.gap-english-input');
            const categorySelect = row.querySelector('.gap-category-select');
            const exampleInput = row.querySelector('.gap-example-input');
            const addBtn = row.querySelector('[data-action="quick-add"]');

            if (englishInput) englishInput.value = data.english || '';
            if (categorySelect) categorySelect.value = data.category || 'general';
            if (exampleInput) exampleInput.value = data.example || '';
            if (addBtn && data.pronunciation) addBtn.dataset.pronunciation = data.pronunciation;

            // Highlight changes
            [englishInput, categorySelect, exampleInput].forEach(el => {
                if (el) {
                    el.classList.add('border-purple-400', 'bg-purple-50');
                    setTimeout(() => el.classList.remove('border-purple-400', 'bg-purple-50'), 2000);
                }
            });

            showToast('AI suggestion applied', 'info');

        } catch (error) {
            showToast('AI Error: ' + error.message, 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = originalHtml;
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
        const escapedKey = escapeHtml(setting.key);
        const escapedValue = escapeHtml(String(setting.value || ''));
        const escapedDescription = escapeHtml(setting.description || '');
        const inputId = `setting-${escapedKey}`;
        let inputHtml = '';

        if (setting.type === 'boolean') {
            const checked = setting.value === 'true' || setting.value === true ? 'checked' : '';
            inputHtml = `
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="${inputId}" data-key="${escapedKey}" ${checked}
                           class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            `;
        } else if (setting.type === 'number') {
            inputHtml = `
                <input type="number" id="${inputId}" data-key="${escapedKey}" value="${escapedValue}"
                       step="any" class="w-32 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            `;
        } else {
            inputHtml = `
                <input type="text" id="${inputId}" data-key="${escapedKey}" value="${escapedValue}"
                       class="w-64 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            `;
        }

        return `
            <div class="setting-row flex items-center justify-between py-2 px-3 rounded-lg">
                <div class="flex-1">
                    <label for="${inputId}" class="text-sm font-medium text-gray-700">${formatSettingName(setting.key)}</label>
                    <p class="text-xs text-gray-500">${escapedDescription}</p>
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
            const escapedKey = escapeHtml(setting.key);
            const escapedValue = escapeHtml(String(setting.value || ''));
            const escapedDescription = escapeHtml(setting.description || '');
            const inputId = `api-${escapedKey}`;
            const isSecret = setting.isSecret;

            html += `
                <div class="setting-row p-4">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <label for="${inputId}" class="text-sm font-medium text-gray-700">${formatSettingName(setting.key)}</label>
                            <p class="text-xs text-gray-500">${escapedDescription}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="${isSecret ? 'password' : 'text'}" id="${inputId}" data-key="${escapedKey}"
                               value="${escapedValue}" placeholder="${isSecret ? '********' : ''}"
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono masked-input">
                        <button type="button" data-action="toggle-visibility" data-key="${inputId}"
                                class="text-gray-500 hover:text-gray-700 p-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                        <button type="button" data-action="test" data-key="${escapedKey}"
                                class="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                            Test
                        </button>
                        <button type="button" data-action="save" data-key="${escapedKey}"
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
            const escapedKey = escapeHtml(setting.key);
            const escapedDescription = escapeHtml(setting.description || '');
            const enabled = setting.value === 'true' || setting.value === true;
            const statusClass = enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
            const statusText = enabled ? 'Enabled' : 'Disabled';

            html += `
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-800">${formatSettingName(setting.key)}</h4>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${statusText}</span>
                    </div>
                    <p class="text-sm text-gray-500 mb-3">${escapedDescription}</p>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" data-key="${escapedKey}" ${enabled ? 'checked' : ''}
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

            container.innerHTML = data.logs.map(log => {
                const username = escapeHtml(log.username || 'Unknown');
                const action = escapeHtml(log.action);
                const resource = escapeHtml(log.resource || '-');
                const ip = escapeHtml(log.ip_address || '-');

                return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-600">${formatDate(log.created_at)}</td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-800">${username}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${action}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${resource}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">${ip}</td>
                </tr>
            `;}).join('');

        } catch (error) {
            const escapedMessage = escapeHtml(error.message);
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-red-500">
                        Failed to load audit log: ${escapedMessage}
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
        
        const messageEl = document.createElement('span');
        messageEl.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.dataset.action = 'close-toast';
        closeBtn.className = 'text-white/80 hover:text-white';
        closeBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
        
        toast.appendChild(messageEl);
        toast.appendChild(closeBtn);

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

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Action handlers (called via event delegation)
    function togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    async function testApiKey(key) {
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
    }

    async function saveApiKey(key) {
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
    }

    async function toggleFeature(key, enabled) {
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
    }
})();
