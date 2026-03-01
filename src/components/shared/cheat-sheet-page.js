// Cheat sheet page - PDF download, print, share, scroll tracking
document.addEventListener('DOMContentLoaded', function() {
    var downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', window.downloadPDF);
    }

    var printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }

    var shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', window.shareCheatSheet);
    }

    var skipEmailBtn = document.getElementById('skip-email-btn');
    if (skipEmailBtn) {
        skipEmailBtn.addEventListener('click', window.skipEmailCapture);
    }

    var closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', window.closeEmailModal);
    }

    var emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('email-input').value;

            if (typeof gtag === 'function') {
                gtag('event', 'submit_email', {
                    event_category: 'lead_generation',
                    event_label: 'Cheat Sheet PDF Email Capture'
                });
            }

            closeEmailModal();
            alert('Thanks! Check your email for the PDF. Meanwhile, here\'s a direct download option:');
            window.print();
            emailForm.reset();
        });
    }
});

// Track cheat sheet views
if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
        page_title: 'Hawaiian Pidgin Cheat Sheet',
        page_location: window.location.href,
        page_path: '/cheat-sheet.html'
    });
}

// Track print action
window.addEventListener('beforeprint', function() {
    if (typeof gtag === 'function') {
        gtag('event', 'print_cheat_sheet', {
            event_category: 'engagement',
            event_label: 'Hawaiian Pidgin Cheat Sheet',
            value: 1
        });
    }
});

window.downloadPDF = function() {
    if (typeof gtag === 'function') {
        gtag('event', 'click_download_pdf', {
            event_category: 'engagement',
            event_label: 'Download PDF Button'
        });
    }
    document.getElementById('email-modal').classList.remove('hidden');
};

window.closeEmailModal = function() {
    document.getElementById('email-modal').classList.add('hidden');
};

window.skipEmailCapture = function() {
    if (typeof gtag === 'function') {
        gtag('event', 'skip_email_capture', {
            event_category: 'engagement',
            event_label: 'Direct PDF Download'
        });
    }
    closeEmailModal();
    alert('Tip: In the print dialog, select "Save as PDF" as your destination to download the cheat sheet!');
    window.print();
};

window.shareCheatSheet = function() {
    if (typeof gtag === 'function') {
        gtag('event', 'share', {
            method: navigator.share ? 'native_share' : 'clipboard',
            content_type: 'cheat_sheet',
            item_id: 'pidgin_cheat_sheet'
        });
    }

    if (navigator.share) {
        navigator.share({
            title: 'Hawaiian Pidgin Cheat Sheet - ChokePidgin.com',
            text: 'Check out this awesome Hawaiian Pidgin quick reference guide! 75+ phrases, grammar rules, and examples on one page.',
            url: window.location.href
        }).catch(function() {});
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard! Share it with your friends!');
    }
};

// Track scroll depth
var scrollTracked = {25: false, 50: false, 75: false, 100: false};
window.addEventListener('scroll', function() {
    var scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

    Object.keys(scrollTracked).forEach(function(threshold) {
        if (scrollPercent >= threshold && !scrollTracked[threshold]) {
            scrollTracked[threshold] = true;
            if (typeof gtag === 'function') {
                gtag('event', 'scroll', {
                    event_category: 'engagement',
                    event_label: 'Cheat Sheet Scroll Depth',
                    value: parseInt(threshold)
                });
            }
        }
    });
});
