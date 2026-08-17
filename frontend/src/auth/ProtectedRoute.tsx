import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loading } from '../components/common/Loading';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <Loading size="lg" message="Loading Nexus AI Workspace..." />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <>{children}</>;
};
