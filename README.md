# Schemify

A modern full-stack application built inside a [pnpm workspace](https://pnpm.io/workspaces) monorepo.

## 🚀 Tech Stack

- **Monorepo Tooling**: pnpm workspaces
- **Frontend (`apps/web`)**: React, Vite, Tailwind CSS, TypeScript
- **Backend (`apps/api`)**: Node.js, Express, Prisma ORM, TypeScript
- **Shared Code (`packages/*`)**: Common types and utilities

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/installation) (v8 or higher)

## 📦 Getting Started

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd schemify
   ```

2. **Install dependencies**
   Install all dependencies across the entire monorepo in one command:

   ```bash
   pnpm install
   ```

3. **Configure the Database (API)**
   The backend uses Prisma. Before running the API, ensure your database is set up:

   ```bash
   cd apps/api
   # Setup your .env file with your DATABASE_URL
   pnpm prisma generate
   pnpm prisma db push
   # Return to root
   cd ../..
   ```

4. **Run Development Servers**
   Start both the frontend and backend in parallel from the project root:
   ```bash
   pnpm run dev
   ```

   - **Web App**: Usually available at `http://localhost:5173`
   - **REST API**: Usually available at `http://localhost:3000` (or your configured port)

## 📂 Project Structure

```text
schemify/
├── apps/
│   ├── api/       # Express backend handling REST routes and Prisma logic
│   └── web/       # React SPA frontend
├── packages/
│   ├── types/     # Shared TypeScript interfaces and DTOs
│   └── utils/     # Shared utility functions
└── package.json   # Root workspace and scripts
```

## 📜 Available Root Scripts

- `pnpm run dev` - Starts all development servers in parallel.
- `pnpm run build` - Builds all applications and packages for production.
- `pnpm run lint` - Runs linting checks across the entire codebase.
