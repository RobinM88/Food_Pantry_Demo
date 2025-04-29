import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVolunteer?: boolean;
}

export function ProtectedRoute({ children, requireVolunteer = true }: ProtectedRouteProps) {
  const { isAuthenticated, isVolunteer, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireVolunteer && !isVolunteer) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
} 