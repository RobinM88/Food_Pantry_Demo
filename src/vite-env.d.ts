/// <reference types="vite/client" />

// Declare missing/incomplete types here

// React Router + Location State extensions
declare module 'react-router-dom' {
  export interface ClientAddLocationState {
    phoneNumber?: string;
    nameSearch?: string;
    fromPhoneLog?: boolean;
  }
  
  // Add missing exports
  export const BrowserRouter: React.ComponentType<{
    children?: React.ReactNode;
    window?: Window;
  }>;
  
  export const Routes: React.ComponentType<{
    children?: React.ReactNode;
  }>;
  
  export const Route: React.ComponentType<{
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
    index?: boolean;
  }>;
  
  export const Navigate: React.ComponentType<{
    to: string;
    replace?: boolean;
    state?: any;
  }>;
  
  export const Link: React.ComponentType<{
    to: string;
    replace?: boolean;
    state?: any;
    children?: React.ReactNode;
  }>;
  
  export function useNavigate(): (to: string, options?: { replace?: boolean; state?: any }) => void;
  export function useLocation(): {
    pathname: string;
    search: string;
    hash: string;
    state: any;
    key: string;
  };
}

// Service Worker related types
interface ServiceWorkerGlobalScope {
  skipWaiting(): void;
  clientsClaim(): void;
  __WB_MANIFEST: Array<{
    revision: string | null;
    url: string;
  }>;
}

interface WorkboxPlugin {
  cacheWillUpdate?: ({
    request,
    response,
    event,
    state
  }: {
    request: Request;
    response: Response;
    event?: Event;
    state?: any;
  }) => Promise<Response | null>;
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

interface Navigator {
  standalone?: boolean;
} 