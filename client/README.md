# Trashlance Frontend

This is the React frontend for the Trashlance waste management platform.

- Built with React, Vite, and Tailwind CSS.
- Main features: user dashboard, booking, chat, notifications, admin panel, and more.

## Getting Started

```bash
pnpm install
pnpm run dev
```

For full documentation and project details, see the [root README](../README.md).

---

## Frontend-Specific Notes

### Environment Variables
- Most configuration is handled by Vite and does not require custom environment variables for local development.
- If you need to connect to a custom backend API, set `VITE_API_URL` in a `.env` file at the project root (defaults to `/api`).

### Tech Stack
- **React** (functional components, hooks)
- **Vite** (fast dev server and build tool)
- **Tailwind CSS** (utility-first styling)
- **React Router** (routing)
- **Context API** (auth, notifications, theme)
- **Socket.IO Client** (real-time chat and notifications)

### Folder Structure
- `src/pages/` – Main app pages (Dashboard, Bookings, Chat, etc.)
- `src/components/` – Reusable UI components (Navbar, Sidebar, etc.)
- `src/contexts/` – Context providers for auth, notifications, theme
- `src/services/` – API utilities
- `src/assets/` – Static assets

### Troubleshooting
- If you see CORS errors, ensure the backend is running and CORS is enabled for the frontend origin.
- If environment variables are not picked up, restart the dev server after editing `.env` files.
- For real-time features (chat, notifications), ensure the backend Socket.IO server is running.

### Linting & Formatting
- ESLint is configured for code quality. Run `pnpm lint` to check for issues.
- Prettier is recommended for consistent code formatting.

### Building for Production
```bash
pnpm run build
```
The output will be in the `dist/` folder.

---
