import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loading } from '../components/common/Loading';

export const PublicRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/chat';

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <Loading size="lg" message="Connecting to Nexus AI..." />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
