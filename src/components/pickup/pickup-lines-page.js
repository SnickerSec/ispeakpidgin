// Pickup lines page - load, display, favorites, shuffle
var pickupLines = [];

var categoryStyles = {
    romantic: { color: 'pink', emoji: '<i class="ti ti-hearts"></i>' },
    food: { color: 'orange', emoji: '🍜' },
    funny: { color: 'yellow', emoji: '😂' },
    bold: { color: 'red', emoji: '<i class="ti ti-flame"></i>' },
    sweet: { color: 'purple', emoji: '<i class="ti ti-flower"></i>' },
    classic: { color: 'green', emoji: '<i class="ti ti-palm-tree"></i>' },
    default: { color: 'blue', emoji: '<i class="ti ti-hand-love-you"></i>' }
};

var favorites = JSON.parse(localStorage.getItem('favoritePickupLines') || '[]');

function updateFavoritesCount() {
    var countEl = document.getElementById('favorites-count');
    if (countEl) countEl.textContent = favorites.length;
}

function toggleFavorite(id) {
    var idx = favorites.indexOf(id);
    if (idx > -1) {
        favorites.splice(idx, 1);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('favoritePickupLines', JSON.stringify(favorites));
    updateFavoritesCount();
}

function isFavorite(id) {
    return favorites.includes(id);
}

function createSlug(text) {
    return text.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function displayPickupLines(lines, showingFavorites) {
    var container = document.getElementById('pickup-lines-grid');
    var noFavorites = document.getElementById('no-favorites');

    if (showingFavorites && lines.length === 0) {
        container.innerHTML = '';
        if (noFavorites) noFavorites.classList.remove('hidden');
        return;
    } else {
        if (noFavorites) noFavorites.classList.add('hidden');
    }

    container.innerHTML = lines.map(function(line) {
        var style = categoryStyles[line.category] || categoryStyles.default;
        var isFav = isFavorite(line.id);
        var slug = createSlug(line.pidgin.substring(0, 50));
        return '<div class="pickup-card card-' + style.color + ' rounded-2xl shadow-xl p-6">' +
            '<div class="flex items-start justify-between mb-3">' +
                '<span class="text-4xl emoji-float">' + style.emoji + '</span>' +
                '<button class="favorite-btn text-2xl ' + (isFav ? 'active' : '') + '" data-id="' + line.id + '" title="' + (isFav ? 'Remove from favorites' : 'Add to favorites') + '">' +
                    (isFav ? '<i class="ti ti-heart-filled" style="color:#ef4444"></i>' : '<i class="ti ti-heart"></i>') +
                '</button>' +
            '</div>' +
            '<a href="/pickup/' + slug + '.html" class="block">' +
                '<p class="text-xl font-bold text-gray-800 mb-2">"' + line.pidgin + '"</p>' +
                '<p class="text-gray-600 italic text-sm mb-3">' + (line.pronunciation || '') + '</p>' +
                '<p class="text-gray-700 font-medium">' + line.english + '</p>' +
                '<span class="text-xs text-purple-500 mt-2 inline-block">Learn more <i class="ti ti-arrow-right"></i></span>' +
            '</a>' +
        '</div>';
    }).join('');

    document.querySelectorAll('.favorite-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = parseInt(this.getAttribute('data-id'));
            toggleFavorite(id);

            if (showingFavorites) {
                showFavorites();
            } else {
                var fav = isFavorite(id);
                this.innerHTML = fav ? '<i class="ti ti-heart-filled" style="color:#ef4444"></i>' : '<i class="ti ti-heart"></i>';
                this.classList.toggle('active', fav);
            }
        });
    });
}

function shuffleArray(array) {
    var shuffled = array.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

document.getElementById('shuffle-btn')?.addEventListener('click', function() {
    displayPickupLines(shuffleArray(pickupLines));
});

document.getElementById('show-all-btn')?.addEventListener('click', function() {
    displayPickupLines(pickupLines);
});

function showFavorites() {
    if (favorites.length === 0) {
        displayPickupLines([], true);
        return;
    }
    var favoriteLines = pickupLines.filter(function(line) { return favorites.includes(line.id); });
    displayPickupLines(favoriteLines, true);
}

document.getElementById('show-favorites-btn')?.addEventListener('click', showFavorites);

async function loadPickupLines() {
    try {
        var response = await fetch('/api/pickup-lines');
        if (!response.ok) throw new Error('Failed to fetch pickup lines');
        var data = await response.json();
        pickupLines = data.lines || data;
        displayPickupLines(pickupLines);
        updateFavoritesCount();
    } catch (error) {
        console.error('Failed to load pickup lines:', error);
        document.getElementById('pickup-lines-grid').innerHTML =
            '<div class="col-span-full text-center py-8 text-red-600">Failed to load pickup lines. Please refresh the page.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadPickupLines);
