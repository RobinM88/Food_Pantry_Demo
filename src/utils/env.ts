/**
 * Type-safe environment variable access
 */
import { config } from '../config';

// Application
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Food Pantry Client Management'
export const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || 'Client Management System for Food Pantry'

// API Configuration
export const API_URL = config?.app?.isDemoMode 
  ? 'http://localhost:0/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')

// Feature Flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
export const ENABLE_NOTIFICATIONS = import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false'

// PWA Configuration
export const PWA_ENABLED = import.meta.env.VITE_PWA_ENABLED !== 'false'
export const PWA_THEME_COLOR = import.meta.env.VITE_PWA_THEME_COLOR || '#ffffff' 