import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/supabase';
import { Helmet } from 'react-helmet-async';
import { Lock, Phone, AlertTriangle, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [phoneInput, setPhoneInput] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect based on role
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: adminRecord } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (adminRecord) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/account', { replace: true });
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const inputVal = phoneInput.trim();
    if (!inputVal || !password) {
      setErrorMsg('মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      let loginEmail = inputVal;

      // Behind the scenes check: if it does NOT contain '@', map it as a customer phone
      if (!loginEmail.includes('@')) {
        const cleanPhone = loginEmail.replace(/\s+/g, '');
        if (!/^\d{11}$/.test(cleanPhone)) {
          setErrorMsg('মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে।');
          setLoading(false);
          return;
        }
        loginEmail = `${cleanPhone}@customer.sundarbanhat.com`;
      }

      // Log in with Supabase Auth
      const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      });

      if (loginError) {
        setErrorMsg('লগইন ব্যর্থ হয়েছে! মোবাইল নম্বর অথবা পাসওয়ার্ডটি সঠিক নয়।');
        setLoading(false);
        return;
      }

      if (!session) {
        setErrorMsg('কোনো অজানা সমস্যা দেখা দিয়েছে।');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      setSuccessMsg('লগইন সফল হয়েছে! আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...');

      setTimeout(() => {
        if (adminRecord) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/account', { replace: true });
        }
      }, 1200);

    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('লগইন প্রক্রিয়ায় ত্রুটি দেখা দিয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '80vh', display: 'flex', alignItems: 'center', paddingTop: '40px' }}>
      <Helmet>
        <title>লগইন করুন - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাটের কাস্টমার অ্যাকাউন্টে লগইন করুন।" />
      </Helmet>

      <div className="container" style={{ maxWidth: '420px', margin: '0 auto' }}>
        
        {/* Form Box */}
        <div style={{
          background: '#fff',
          padding: '40px 30px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 15px 35px var(--color-shadow)',
          textAlign: 'center'
        }}>
          
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
            <span style={{ fontSize: '2.5rem' }}>🍃</span>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>লগইন করুন</h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold' }}>আপনার অ্যাকাউন্টে প্রবেশ করুন</span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ffebee',
              border: '1px solid #ffcdd2',
              color: '#c62828',
              padding: '12px 15px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.85rem',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#e8f5e9',
              border: '1px solid #a5d6a7',
              color: '#2e7d32',
              padding: '12px 15px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.9rem',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
            
            {/* Phone Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মোবাইল নম্বর *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px 10px 40px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '0.95rem'
                  }}
                  placeholder="যেমন: 017xxxxxxxx"
                  disabled={loading}
                />
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পাসওয়ার্ড *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px 10px 40px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '0.95rem'
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1.02rem',
                fontWeight: 'bold',
                borderRadius: 'var(--border-radius-sm)',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? 'প্রবেশ করা হচ্ছে...' : 'লগইন করুন 🔑'}
            </button>
          </form>

          {/* Switch Register link */}
          <div style={{ marginTop: '25px', fontSize: '0.88rem', color: 'gray' }}>
            <p style={{ margin: 0 }}>
              কোনো অ্যাকাউন্ট নেই?{' '}
              <Link to="/register" style={{ color: 'var(--color-mangrove)', fontWeight: 'bold', textDecoration: 'underline' }}>
                নতুন অ্যাকাউন্ট তৈরি করুন
              </Link>
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
