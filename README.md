# HashHouse

A 4Chan clone built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- Anonymous discussion platform
- Board-based organization
- Thread and post viewing
- Modern, responsive UI with orange/pink gradient theme
- Custom scrollbar styling

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

Developer Experience Improvements
- Added common DX scripts: lint:fix, format, typecheck, build:prod
- Introduced design tokens and gradient-friendly Tailwind palette (brand colors)
- Added environment example (.env.example) and GitHub Actions CI workflow
- Strengthened TS linting and type-safety options in tsconfig.json
- Added basic environment guidance for local development
- Set up Vitest for testing with upload API test
- Improved Storacha space DID configuration for uploads
- Enhanced error visibility for upload failures (detailed error messages)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── src/
│   ├── components/        # React components
│   ├── data/             # Mock data
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── index.css         # Global styles
└── public/               # Static assets
```

## Migration Notes

This project was migrated from Vite to Next.js while preserving all frontend styling and functionality. The migration included:

- Converting from Vite to Next.js build system
- Moving from `src/App.tsx` to `app/page.tsx`
- Updating configuration files for Next.js compatibility
- Preserving all Tailwind CSS styling and custom colors
- Maintaining the same component structure and functionality
