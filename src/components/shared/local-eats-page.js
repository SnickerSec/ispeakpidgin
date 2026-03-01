// Share guide functionality
var shareBtn = document.getElementById('share-guide-btn');
if (shareBtn) {
    shareBtn.addEventListener('click', async function() {
        var shareData = {
            title: 'Best Local Grinds on O\'ahu',
            text: 'Check out this guide to the best local food spots on O\'ahu! Skip the tourist traps and eat where the locals actually eat.',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                var textToShare = shareData.title + '\n\n' + shareData.text + '\n\n' + shareData.url;
                await navigator.clipboard.writeText(textToShare);

                var originalText = shareBtn.innerHTML;
                shareBtn.innerHTML = '✓ Link Copied!';
                setTimeout(function() {
                    shareBtn.innerHTML = originalText;
                }, 2000);
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    });
}

// Smooth scroll for region navigation
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            var offset = 150;
            var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
