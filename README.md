# Spinflow

React + TypeScript application built with Vite.

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

```text
src/
  app/           App shell, providers, and routing
  features/      Domain features
  pages/         Route-level screens
  shared/        Reusable components, hooks, stores, theme, and libraries
  test/          Test setup and helpers
```

Shared code lives in `src/shared`. Domain work belongs in `src/features/<feature-name>`.

Path alias:

```ts
import { useAppStore } from '@/shared/stores';
```

`@/` maps to `src/`.
