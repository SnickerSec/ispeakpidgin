// Bible page - button wiring for loadBook and searchVerse
document.addEventListener('DOMContentLoaded', function() {
    var loadBookBtn = document.querySelector('.load-book-btn');
    if (loadBookBtn) {
        loadBookBtn.addEventListener('click', function() {
            var book = this.getAttribute('data-book');
            if (typeof loadBook === 'function') {
                loadBook(book);
            }
        });
    }

    var searchVerseBtns = document.querySelectorAll('.search-verse-btn');
    searchVerseBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var verse = this.getAttribute('data-verse');
            if (typeof searchVerse === 'function') {
                searchVerse(verse);
            }
        });
    });
});
