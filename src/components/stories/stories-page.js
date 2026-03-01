// Stories page - load, display, and filter stories
var storiesData = { stories: [] };

function createSlug(text) {
    return text.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function displayStories(filter) {
    filter = filter || 'all';
    var container = document.getElementById('stories-container');
    var noResults = document.getElementById('no-results');

    if (!container || !storiesData.stories || storiesData.stories.length === 0) {
        return;
    }

    var filteredStories = storiesData.stories;

    if (filter !== 'all') {
        filteredStories = storiesData.stories.filter(function(story) {
            if (filter === 'beginner' || filter === 'intermediate' || filter === 'advanced') {
                return story.difficulty === filter;
            } else {
                return story.tags && story.tags.includes(filter);
            }
        });
    }

    if (filteredStories.length === 0) {
        container.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    } else {
        noResults.classList.add('hidden');
    }

    container.innerHTML = filteredStories.map(function(story) {
        var slug = createSlug(story.title);
        return '<div class="story-card bg-white rounded-2xl shadow-xl overflow-hidden" data-story-id="' + story.id + '">' +
            '<div class="p-6 md:p-8">' +
                '<div class="flex justify-between items-start mb-4">' +
                    '<h2 class="text-2xl md:text-3xl font-bold text-gray-800 flex-1">' +
                        '<a href="/story/' + slug + '.html" class="hover:text-purple-600 transition">' + story.title + '</a>' +
                    '</h2>' +
                    '<span class="difficulty-badge difficulty-' + story.difficulty + ' ml-4">' + story.difficulty + '</span>' +
                '</div>' +
                '<div class="flex flex-wrap gap-2 mb-4">' +
                    story.tags.map(function(tag) {
                        return '<span class="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full">' + tag + '</span>';
                    }).join('') +
                '</div>' +
                '<div class="story-content-wrapper">' +
                    '<div class="story-content collapsed mb-4" id="content-' + story.id + '">' +
                        '<div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">' +
                            '<h3 class="text-lg font-bold text-purple-700 mb-2"><i class="ti ti-book"></i> Pidgin Story</h3>' +
                            '<p class="text-gray-800 text-base leading-relaxed">' + story.pidginText + '</p>' +
                        '</div>' +
                        '<div class="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">' +
                            '<h3 class="text-lg font-bold text-green-700 mb-2"><i class="ti ti-note"></i> English Translation</h3>' +
                            '<p class="text-gray-700 text-base leading-relaxed">' + story.englishTranslation + '</p>' +
                        '</div>' +
                        '<div class="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">' +
                            '<h3 class="text-lg font-bold text-orange-700 mb-2"><i class="ti ti-flower"></i> Cultural Context</h3>' +
                            '<p class="text-gray-700 text-base leading-relaxed">' + story.culturalNotes + '</p>' +
                        '</div>' +
                        '<div class="mb-4">' +
                            '<h3 class="text-lg font-bold text-gray-800 mb-3"><i class="ti ti-books"></i> Key Vocabulary</h3>' +
                            '<div class="flex flex-wrap gap-2">' +
                                story.vocabulary.map(function(word) {
                                    return '<div class="vocab-item"><strong class="text-purple-700">' + word.pidgin + '</strong>' +
                                        '<span class="text-gray-600"> (' + word.pronunciation + ')</span>' +
                                        '<span class="text-gray-800"> - ' + word.english + '</span></div>';
                                }).join('') +
                            '</div>' +
                        '</div>' +
                        (story.audioExample ? '<div class="p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl">' +
                            '<h3 class="text-lg font-bold text-red-700 mb-2"><i class="ti ti-volume"></i> Listen & Learn</h3>' +
                            '<p class="text-gray-800 text-base italic">"' + story.audioExample + '"</p>' +
                        '</div>' : '') +
                    '</div>' +
                    '<div class="flex gap-3 mt-4">' +
                        '<a href="/story/' + slug + '.html" class="flex-1 text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg">' +
                            '<i class="ti ti-book"></i> Read Full Story</a>' +
                        '<button class="read-more-btn px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition" data-story-id="' + story.id + '">' +
                            '<i class="ti ti-chevron-down"></i> Preview</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    // Add event listeners for read more buttons
    document.querySelectorAll('.read-more-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var storyId = this.getAttribute('data-story-id');
            var content = document.getElementById('content-' + storyId);

            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                this.textContent = '📕 Show Less';
            } else {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                this.innerHTML = '<i class="ti ti-chevron-down"></i> Preview';
                document.querySelector('[data-story-id="' + storyId + '"]').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Filter functionality
document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        displayStories(this.getAttribute('data-filter'));
    });
});

// Initial load
async function initStories() {
    try {
        if (window.supabaseAPI) {
            storiesData = await window.supabaseAPI.loadStories();
        } else {
            throw new Error('Supabase API loader not available');
        }
    } catch (error) {
        console.warn('API load failed, using local data:', error.message);
        if (typeof pidginStories !== 'undefined') {
            storiesData = {
                stories: pidginStories.stories || pidginStories,
                metadata: pidginStories.metadata
            };
        }
    }
    displayStories();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStories);
} else {
    initStories();
}
