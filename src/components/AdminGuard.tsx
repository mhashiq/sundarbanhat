import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabase/supabase';

export const AdminGuard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // 1. Get active session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // 2. Check if uid exists in admin_users table
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error verifying admin permissions:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error('Authentication checking failed:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
      } else {
        checkAdminStatus();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-sand)',
        color: 'var(--color-mangrove)',
        fontFamily: 'var(--font-heading)',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        gap: '15px'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--color-sand-dark)',
          borderTop: '4px solid var(--color-mangrove)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        অ্যাডমিন প্যানেল যাচাই করা হচ্ছে...
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};
