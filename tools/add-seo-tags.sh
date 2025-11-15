#!/bin/bash

# Script to add missing SEO tags to ask-local.html and learning-hub.html

echo "Adding comprehensive SEO tags to remaining pages..."

# Note: Manual updates needed for ask-local.html and learning-hub.html
# Add the following tags before </head>:

cat << 'EOF'
Pages to update manually:
1. ask-local.html - Add QAPage schema, social images, mobile tags
2. learning-hub.html - Add Course schema, social images, mobile tags

Add these meta tags to BOTH files after existing OG tags:

    <meta property="og:site_name" content="ChokePidgin.com">
    <meta property="og:locale" content="en_US">
    <meta property="og:locale:alternate" content="hwc">
    <meta property="og:image" content="https://chokepidgin.com/assets/images/og-[page].png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="[Page Title]">

    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="[Page Title]">
    <meta name="twitter:description" content="[Page Description]">
    <meta name="twitter:image" content="https://chokepidgin.com/assets/images/og-[page].png">
    <meta name="twitter:image:alt" content="[Page Title]">

    <!-- Mobile Optimization -->
    <meta name="theme-color" content="#667eea">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="[Short Title]">
    <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">

    <!-- Performance Optimization -->
    <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://fonts.gstatic.com">

EOF

echo "✅ Instructions printed above"
