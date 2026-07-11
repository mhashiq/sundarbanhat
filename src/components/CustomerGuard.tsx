import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabase/supabase';

export const CustomerGuard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isCustomer, setIsCustomer] = useState(false);

  useEffect(() => {
    const checkCustomerStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsCustomer(false);
          setLoading(false);
          return;
        }

        // Check if the user is an admin
        const { data: isAdminUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        // If they are not in admin_users, they are a customer
        setIsCustomer(!isAdminUser);
      } catch (err) {
        console.error('Error verifying customer permissions:', err);
        setIsCustomer(false);
      } finally {
        setLoading(false);
      }
    };

    checkCustomerStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsCustomer(false);
        setLoading(false);
      } else {
        checkCustomerStatus();
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
        অ্যাকাউন্ট ভেরিফিকেশন করা হচ্ছে...
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isCustomer ? <Outlet /> : <Navigate to="/login" replace />;
};
