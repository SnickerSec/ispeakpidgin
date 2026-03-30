// Navigation JavaScript - automatically included on all pages
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    var mobileMenuBtn = document.getElementById('mobile-menu-btn');
    var mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Desktop dropdown menus
    var dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(function(dropdown) {
        var button = dropdown.querySelector('button');
        var menu = dropdown.querySelector('.dropdown-menu');

        if (button && menu) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                // Close other dropdowns
                dropdowns.forEach(function(otherDropdown) {
                    if (otherDropdown !== dropdown) {
                        var otherMenu = otherDropdown.querySelector('.dropdown-menu');
                        if (otherMenu) otherMenu.classList.add('hidden');
                    }
                });
                // Toggle this dropdown
                menu.classList.toggle('hidden');
            });

            // Close on outside click
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target)) {
                    menu.classList.add('hidden');
                }
            });
        }
    });

    // Mobile dropdown menus
    var mobileDropdowns = document.querySelectorAll('.mobile-dropdown');
    mobileDropdowns.forEach(function(dropdown) {
        var button = dropdown.querySelector('.mobile-dropdown-btn');
        var content = dropdown.querySelector('.mobile-dropdown-content');
        var arrow = button ? button.querySelector('svg') : null;

        if (button && content) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                content.classList.toggle('hidden');
                if (arrow) {
                    arrow.classList.toggle('rotate-180');
                }
            });
        }
    });

    // Global Stats Sync
    function syncGlobalStats() {
        try {
            var progress = JSON.parse(localStorage.getItem('learningHubProgress') || '{}');
            var streakCountEl = document.getElementById('nav-streak-count');
            var totalPointsEl = document.getElementById('nav-total-points');
            var statsBar = document.getElementById('nav-stats-bar');

            if (progress.streak || progress.totalPoints) {
                if (streakCountEl) streakCountEl.textContent = progress.streak || 0;
                if (totalPointsEl) totalPointsEl.textContent = (progress.totalPoints || 0).toLocaleString();
                if (statsBar) statsBar.classList.remove('hidden');
            }
        } catch (e) {
            console.warn('Failed to sync nav stats:', e);
        }
    }

    // Initial sync
    syncGlobalStats();

    // Re-sync when storage changes (from other tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'learningHubProgress') {
            syncGlobalStats();
        }
    });
});
