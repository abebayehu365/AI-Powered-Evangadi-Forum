import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

/**
 * Route protection wrapper for administrators only.
 */
export default function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={36} className='animate-spin' color='#0284c7' />
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/auth' replace />;
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={48} color='#dc2626' style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          This page is restricted to platform administrators only. If you believe this is an error, please contact support.
        </p>
      </div>
    );
  }

  return children;
}
