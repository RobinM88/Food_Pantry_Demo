import { useState, useEffect } from 'react';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      console.log('App is offline');
    };

    const handleOnline = () => {
      setIsOffline(false);
      console.log('App is online');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return { isOffline };
}; 