# MDX Documentation Setup Guide

This guide explains the MDX documentation system that has been set up for Starfocus.

## What Was Done

I've configured your Next.js app to support MDX documentation with the following changes:

### 1. Configuration Files

**next.config.js** - Updated to support MDX:
- Added `withMDX()` wrapper
- Added `.mdx` and `.md` to `pageExtensions`

**mdx-components.tsx** (NEW) - Custom MDX component styles:
- Configured default HTML elements with Tailwind styling
- Provides a clean, readable documentation style
- Allows you to add custom React components

### 2. Documentation Structure

```
app/docs/
├── layout.tsx              # Docs layout with sidebar navigation
├── page.mdx                # Main docs homepage
├── getting-started/
│   └── page.mdx           # Getting started guide
└── advanced/
    └── page.mdx           # Advanced features (demonstrates custom components)

components/docs/
└── Callout.tsx            # Example custom component for docs
```

### 3. Example Custom Component

Created `Callout.tsx` as an example of how to create reusable React components for your docs. It supports different types (info, warning, success, error).

## Installation Steps

Since the MDX packages couldn't be installed due to network restrictions, you'll need to install them locally:

```bash
bun add @next/mdx @mdx-js/react @types/mdx
```

After installation, you can:

1. **Start the dev server:**
   ```bash
   bun run dev
   ```

2. **Visit your docs:**
   - Homepage: http://localhost:6603/docs
   - Getting Started: http://localhost:6603/docs/getting-started
   - Advanced: http://localhost:6603/docs/advanced

3. **Build for production:**
   ```bash
   bun run build
   ```

## How to Use MDX

### Creating New Doc Pages

1. Create a new file in `app/docs/` with a `.mdx` extension
2. Write markdown content
3. Optionally import React components
4. Add the route to the sidebar in `app/docs/layout.tsx`

Example:
```mdx
import Callout from '@/components/docs/Callout'

# My New Page

Regular markdown content here...

<Callout type="info" title="Note">
  This is a custom React component!
</Callout>
```

### Using Custom Components

1. Create your component in `components/docs/`
2. Import it at the top of your MDX file
3. Use it like JSX: `<ComponentName prop="value">content</ComponentName>`

### Styling

- All docs pages inherit the dark theme from the layout
- The `mdx-components.tsx` file defines default styles for HTML elements
- Add custom Tailwind classes to your components
- The layout provides responsive sidebar navigation

## File Structure Reference

### Static Docs vs. App Docs

- `/docs/` - Internal development documentation (markdown files, not rendered)
- `/app/docs/` - User-facing documentation website (MDX, rendered via App Router)

### Routes

The App Router creates these routes automatically:
- `/docs` → `app/docs/page.mdx`
- `/docs/getting-started` → `app/docs/getting-started/page.mdx`
- `/docs/advanced` → `app/docs/advanced/page.mdx`

## Customization

### Layout

Edit `app/docs/layout.tsx` to:
- Add/remove sidebar navigation links
- Modify the header
- Change colors and spacing
- Add breadcrumbs or search

### Styling

Edit `mdx-components.tsx` to:
- Change how headings, paragraphs, links, etc. are rendered
- Add syntax highlighting for code blocks
- Customize list styles
- Add default components

### Components

Create new components in `components/docs/`:
- Tables
- Diagrams
- Interactive demos
- Video embeds
- Tabbed content
- Anything React can do!

## Advanced Features

### Metadata

Add metadata to any MDX page:

```mdx
export const metadata = {
  title: 'Page Title - Starfocus Docs',
  description: 'Description for SEO',
}

# Your Content
```

### Dynamic Content

MDX supports JavaScript expressions:

```mdx
export const year = new Date().getFullYear()

Copyright {year} Starfocus
```

### Syntax Highlighting

For better code highlighting, you can add:
```bash
bun add rehype-highlight
```

Then configure it in `next.config.js`.

## Next Steps

1. Install the MDX packages
2. Test the docs locally
3. Create additional documentation pages as needed
4. Customize the styling to match your preferences
5. Add more custom components for your specific needs

## Resources

- [Next.js MDX Documentation](https://nextjs.org/docs/pages/building-your-application/configuring/mdx)
- [MDX Documentation](https://mdxjs.com/)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
