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

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start the Vite development server        |
| `npm run build`         | Type-check and create a production build |
| `npm run preview`       | Preview the production build locally     |
| `npm run lint`          | Run ESLint                               |
| `npm run lint:fix`      | Run ESLint and apply automatic fixes     |
| `npm run format`        | Format files with Prettier               |
| `npm run format:check`  | Check Prettier formatting                |
| `npm run test`          | Run unit tests once                      |
| `npm run test:watch`    | Run unit tests in watch mode             |
| `npm run test:coverage` | Run unit tests and generate coverage     |

## Architecture

```text
src/
  app/           Router, providers, and theme
  components/    Shared UI (common, layout, feedback)
  features/      Domain screens and future feature logic
  pages/         Thin route wrappers
  hooks/         Shared hooks
  stores/        Global Zustand stores
  types/         Shared types
  utils/         Shared helpers
  constants/     App constants and routes
  data/          Static app data
  test/          Test setup and helpers
```

Pages stay thin and render feature screens. Feature-specific hooks, stores, and helpers belong next to the screen they support.

Path alias:

```ts
import { useAppStore } from '@/stores/appStore';
```

`@/` maps to `src/`.
