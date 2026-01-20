<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Hero Cover Color Combinator

A React application for exploring and generating color combinations for hero sections using Tailwind CSS colors.

## Features

- Interactive color palette selection
- Real-time color combination generation
- WCAG contrast level validation (A, AA, AAA)
- Visual preview of color combinations
- Customizable distance and contrast filters
- Light and dark template modes

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

3. **Build for production:**
   ```bash
   npm run build
   ```
   The production build will be in the `dist/` directory.

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Deployment

The project is ready to deploy to any static hosting service:

- **Vercel:** Connect your repository and deploy automatically
- **Netlify:** Drag and drop the `dist` folder or connect your repository
- **GitHub Pages:** Use the `dist` folder contents
- **Any static host:** Upload the contents of the `dist` folder

## Project Structure

- `App.tsx` - Main application component
- `index.tsx` - Application entry point
- `index.html` - HTML template
- `constants.tsx` - Color definitions and constants
- `types.ts` - TypeScript type definitions
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## Technologies Used

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Font Awesome (via CDN)
