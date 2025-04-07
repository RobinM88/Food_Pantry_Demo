/**
 * Type-safe environment variable access
 */

// Application
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Food Pantry Client Management'
export const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || 'Client Management System for Food Pantry'

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Feature Flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
export const ENABLE_NOTIFICATIONS = import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false'

// PWA Configuration
export const PWA_ENABLED = import.meta.env.VITE_PWA_ENABLED !== 'false'
export const PWA_THEME_COLOR = import.meta.env.VITE_PWA_THEME_COLOR || '#ffffff'

// Type definitions for environment variables
declare global {
  interface ImportMetaEnv {
    VITE_APP_NAME: string
    VITE_APP_DESCRIPTION: string
    VITE_API_URL: string
    VITE_ENABLE_ANALYTICS: string
    VITE_ENABLE_NOTIFICATIONS: string
    VITE_PWA_ENABLED: string
    VITE_PWA_THEME_COLOR: string
  }
} 