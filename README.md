# Spinflow

Production-ready React + TypeScript application foundation built with Vite.

Business features are not implemented yet. This repository contains the application shell, shared architecture, and development tooling.

## Tech stack

- React
- TypeScript
- Vite
- React Router
- MUI and MUI Icons
- Zustand
- React Hook Form
- Zod
- Framer Motion
- Recharts
- @dnd-kit
- Vitest
- React Testing Library
- ESLint
- Prettier

## Prerequisites

- Node.js 22.12 or later
- npm 11 or later

## Setup

```bash
npm install
```

## Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the Vite development server        |
| `npm run build`        | Type-check and create a production build |
| `npm run preview`      | Preview the production build locally     |
| `npm run lint`         | Run ESLint                               |
| `npm run lint:fix`     | Run ESLint and apply automatic fixes     |
| `npm run format`       | Format files with Prettier               |
| `npm run format:check` | Check Prettier formatting                |
| `npm run test`         | Run unit tests once                      |
| `npm run test:watch`   | Run unit tests in watch mode             |

## Architecture

The project uses a feature-based source layout:

```text
src/
  app/           App shell, providers, and routing
  features/      Domain features (empty until business work begins)
  pages/         Route-level screens
  shared/        Reusable components, hooks, stores, theme, and libraries
  test/          Test setup and helpers
```

Shared code lives in `src/shared`. Upcoming domain work should go in `src/features/<feature-name>` with feature-specific components, hooks, and stores.

Path alias:

```ts
import { useAppStore } from '@/shared/stores';
```

`@/` maps to `src/`.
"# react-spin-wheel" 
