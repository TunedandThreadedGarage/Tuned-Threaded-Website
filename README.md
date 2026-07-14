# Tuned & Threaded

Official website project for **Tuned & Threaded**.

This repository currently contains the application scaffold only. Marketing UI and content will be added in a later phase.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- ESLint

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```text
src/
├── app/           # App Router routes and layouts
├── components/    # Shared UI and layout components
│   ├── layout/
│   └── ui/
├── features/      # Feature-oriented modules
├── hooks/         # Shared React hooks
├── lib/           # Utilities and shared helpers
├── styles/        # Shared styles beyond globals
└── types/         # Shared TypeScript types
```

## Environment

Copy `.env.example` to `.env.local` and fill in values as needed:

```bash
cp .env.example .env.local
```

## Repository

https://github.com/TunedandThreadedGarage/Tuned-Threaded-Website
