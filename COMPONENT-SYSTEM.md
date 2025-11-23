# Component-Based Template System

This project uses a build-time component injection system to ensure **consistent navigation and footer across all pages**.

## How It Works

### 1. Shared Components

**Location:** `src/components/shared/`

- **`navigation.html`** - Complete navigation header with desktop/mobile menus
- **`footer.html`** - Site-wide footer

These files contain the **single source of truth** for navigation and footer markup.

### 2. Build System Integration

**Build Script:** `build.js`

During the build process (`npm run build`), the script:

1. Loads the navigation and footer templates
2. Processes each HTML page in `src/pages/`
3. Injects templates where placeholders are found
4. Outputs processed pages to `public/`

### 3. Using Placeholders in Pages

To use the shared components, add these placeholders in your HTML files:

```html
<body>
    <!-- NAVIGATION_PLACEHOLDER -->

    <!-- Your page content here -->

    <!-- FOOTER_PLACEHOLDER -->
</body>
```

**Example page structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Your Page Title</title>
    <!-- Head content -->
</head>
<body class="min-h-screen bg-gray-50">
    <!-- NAVIGATION_PLACEHOLDER -->

    <!-- Page Content -->
    <section class="py-12 px-4">
        <h1>Your Content Here</h1>
    </section>

    <!-- FOOTER_PLACEHOLDER -->

    <!-- Scripts -->
    <script src="js/main.js"></script>
</body>
</html>
```

## Updating Navigation or Footer

### ✅ DO THIS (Recommended)

**Edit the shared component files:**

1. Open `src/components/shared/navigation.html`
2. Make your changes (add menu items, update links, change styling, etc.)
3. Run `npm run build`
4. All pages will automatically use the updated navigation!

**Example: Adding a new menu item**

```html
<!-- In src/components/shared/navigation.html -->
<a href="new-feature.html" class="nav-link text-gray-700 hover:text-green-600 transition">New Feature</a>
```

### ❌ DON'T DO THIS

- **Don't edit navigation/footer directly in `src/pages/*.html` files** - Changes will be lost on next build if using placeholders
- **Don't edit files in `public/`** - These are generated files that get overwritten

## Migration Guide

### Converting Existing Pages to Use Components

**Before (Duplicated HTML):**
```html
<body>
    <nav class="shadow-lg sticky top-0 z-50 bg-white">
        <!-- 120+ lines of navigation code -->
    </nav>

    <!-- Content -->

    <footer class="bg-gradient-to-r from-purple-900 to-blue-900">
        <!-- Footer code -->
    </footer>
</body>
```

**After (Component Placeholders):**
```html
<body>
    <!-- NAVIGATION_PLACEHOLDER -->

    <!-- Content -->

    <!-- FOOTER_PLACEHOLDER -->
</body>
```

**Steps to convert a page:**

1. Open the page file (e.g., `src/pages/translator.html`)
2. Find the `<nav>` block (usually starts around line 150-250)
3. Replace the entire `<nav>...</nav>` block with `<!-- NAVIGATION_PLACEHOLDER -->`
4. Find the `<footer>` block (usually near the end)
5. Replace the entire `<footer>...</footer>` block with `<!-- FOOTER_PLACEHOLDER -->`
6. Run `npm run build`
7. Test the page in `public/translator.html`

## Benefits

✅ **Single Source of Truth** - Edit navigation once, update everywhere
✅ **Consistency** - All pages guaranteed to have identical navigation
✅ **Maintainability** - No more updating 20+ files for one menu change
✅ **Reduced Errors** - Can't accidentally create navigation inconsistencies
✅ **Smaller Source Files** - Pages are cleaner without duplicated markup

## Current Status

### ✅ Components Created
- `src/components/shared/navigation.html` - Complete navigation
- `src/components/shared/footer.html` - Complete footer

### ✅ Build System Updated
- `build.js` now supports template injection
- Placeholders: `<!-- NAVIGATION_PLACEHOLDER -->` and `<!-- FOOTER_PLACEHOLDER -->`

### 🔄 Migration Needed
The following pages still have **duplicated navigation/footer** and should be converted to use placeholders:

- All files in `src/pages/` (20+ pages)

**To migrate all pages at once:**
```bash
# This will be a scripted task to replace navigation/footer blocks
# with placeholders across all HTML files
```

## Technical Details

### Build Process Flow

```
src/pages/
  ├── index.html (with placeholders)
  ├── translator.html (with placeholders)
  └── ...

src/components/shared/
  ├── navigation.html (template)
  └── footer.html (template)

             ↓  npm run build

build.js:
  1. Load navigation.html
  2. Load footer.html
  3. For each page:
     - Read page content
     - Replace <!-- NAVIGATION_PLACEHOLDER --> with navigation template
     - Replace <!-- FOOTER_PLACEHOLDER --> with footer template
     - Update asset paths
     - Write to public/

             ↓

public/
  ├── index.html (complete, with injected components)
  ├── translator.html (complete, with injected components)
  └── ...
```

### Path Mappings

The build system also handles path updates for:
- JavaScript component paths
- CSS file paths
- Data file paths

See `pathMappings` object in `build.js` for full list.

## Development Workflow

1. **Edit source files** in `src/pages/` or `src/components/shared/`
2. **Run build** with `npm run build`
3. **Test locally** with `npm run dev` (serves from `public/`)
4. **Deploy** - The `public/` directory contains production-ready files

## JavaScript & Interactivity

Navigation interactivity (dropdowns, mobile menu) is handled by:
- `src/components/shared/main.js`
- Functions: `initNavigation()`, mobile dropdown handling
- This JavaScript file is already centralized and doesn't need duplication

## Questions?

- **Q: Can I have different navigation on some pages?**
  A: Yes! Just don't use the placeholder and write custom nav. But this defeats the purpose of consistency.

- **Q: What if I need to highlight the active page?**
  A: Use JavaScript to detect current page and add active class. See `main.js` for examples.

- **Q: Do I need to rebuild after every change?**
  A: Yes, during development. In production, you only build once before deployment.

## Future Enhancements

Potential improvements:
- [ ] Automated migration script to convert all existing pages
- [ ] Support for page-specific nav highlighting via data attributes
- [ ] Hot reload during development (watch mode for auto-rebuild)
- [ ] Additional component types (breadcrumbs, CTAs, etc.)
