import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/supabase';
import { Helmet } from 'react-helmet-async';
import { Lock, Phone, User, AlertTriangle, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/account', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !phone || !password || !confirmPassword) {
      setErrorMsg('অনুগ্রহ করে সব ঘর পূরণ করুন।');
      return;
    }

    // Phone validation (11 digits Bangladeshi format)
    const cleanPhone = phone.trim();
    if (!/^\d{11}$/.test(cleanPhone)) {
      setErrorMsg('মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('পাসওয়ার্ডটি অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('পাসওয়ার্ড দুটি মেলেনি। আবার চেষ্টা করুন।');
      return;
    }

    setLoading(true);

    try {
      // Map phone to dummy email format for Supabase Auth
      const dummyEmail = `${cleanPhone}@customer.sundarbanhat.com`;

      // 1. Sign up the customer user with full name metadata
      const { data: { user }, error: signupError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
        options: {
          data: {
            full_name: name.trim()
          }
        }
      });

      if (signupError) {
        if (signupError.message.includes('User already registered') || signupError.message.includes('already exists')) {
          setErrorMsg('এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।');
        } else {
          setErrorMsg(`সাইন-আপ ব্যর্থ হয়েছে: ${signupError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!user) {
        setErrorMsg('কোনো অজানা সমস্যা দেখা দিয়েছে।');
        setLoading(false);
        return;
      }

      setSuccessMsg('অ্যাকাউন্ট তৈরি সফল হয়েছে! আপনাকে লগইন পেজে নিয়ে যাওয়া হচ্ছে...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Customer registration error:', err);
      setErrorMsg('রেজিস্ট্রেশন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '80vh', display: 'flex', alignItems: 'center', paddingTop: '40px' }}>
      <Helmet>
        <title>সাইন-আপ / অ্যাকাউন্ট তৈরি - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাটে নতুন কাস্টমার অ্যাকাউন্ট তৈরি করুন সহজে মোবাইল নম্বর দিয়ে।" />
      </Helmet>

      <div className="container" style={{ maxWidth: '420px', margin: '0 auto' }}>
        
        {/* Form box */}
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
            <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>নতুন অ্যাকাউন্ট তৈরি</h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold' }}>সুন্দরবন হাটের সাথে যুক্ত হোন সহজে</span>
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

          {/* Registration Form */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>আপনার নাম *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px 10px 40px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '0.95rem'
                  }}
                  placeholder="যেমন: আসিফুর রহমান"
                  disabled={loading}
                />
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মোবাইল নম্বর *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *</label>
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

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পাসওয়ার্ড নিশ্চিত করুন *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন 👥'}
            </button>
          </form>

          {/* Toggle Login link */}
          <div style={{ marginTop: '25px', fontSize: '0.88rem', color: 'gray' }}>
            <p style={{ margin: 0 }}>
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link to="/login" style={{ color: 'var(--color-mangrove)', fontWeight: 'bold', textDecoration: 'underline' }}>
                লগইন করুন
              </Link>
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
