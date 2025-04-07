# Food Pantry Client Management System

A Progressive Web Application (PWA) for managing food pantry clients, orders, and phone interactions.

## Features

- Client Management (Add, Edit, View client profiles)
- Order Tracking (Record and update order statuses)
- Phone Log Integration (Log calls and update client information)

## Tech Stack

- React 18
- TypeScript
- Vite
- Material-UI
- PWA Support

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Modify the values in `.env` as needed

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

The application uses the following environment variables:

- `VITE_APP_NAME`: Application name
- `VITE_APP_DESCRIPTION`: Application description
- `VITE_API_URL`: API endpoint URL
- `VITE_ENABLE_ANALYTICS`: Enable/disable analytics
- `VITE_ENABLE_NOTIFICATIONS`: Enable/disable notifications
- `VITE_PWA_ENABLED`: Enable/disable PWA features
- `VITE_PWA_THEME_COLOR`: PWA theme color

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── features/      # Feature-specific components and logic
├── services/      # API and service functions
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── assets/        # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build 