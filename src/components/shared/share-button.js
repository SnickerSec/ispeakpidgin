// Share website button functionality
document.getElementById('share-website-btn')?.addEventListener('click', function() {
    if (navigator.share) {
        navigator.share({
            title: 'ChokePidgin.com - Hawaiian Pidgin Dictionary',
            text: 'Check out this awesome Hawaiian Pidgin dictionary and translator!',
            url: 'https://chokepidgin.com'
        }).catch(function() {});
    } else {
        navigator.clipboard.writeText('https://chokepidgin.com');
        alert('Link copied to clipboard!');
    }
});
