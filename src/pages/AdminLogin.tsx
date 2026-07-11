import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabase';
import { Helmet } from 'react-helmet-async';
import { Lock, Mail, AlertTriangle, CheckCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in as admin, redirect directly
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
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (loginError) {
        setErrorMsg('লগইন ব্যর্থ হয়েছে! ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।');
        setLoading(false);
        return;
      }

      if (!session) {
        setErrorMsg('কোনো অজানা সমস্যা দেখা দিয়েছে।');
        setLoading(false);
        return;
      }

      // 2. Verify admin rights against admin_users table
      const { data: adminRecord, error: dbError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (dbError || !adminRecord) {
        // Not an admin! Log them out immediately
        await supabase.auth.signOut();
        setErrorMsg('অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে! আপনি একজন রেজিস্টার্ড অ্যাডমিন নন।');
        setLoading(false);
        return;
      }

      setSuccessMsg('লগইন সফল হয়েছে! আপনাকে অ্যাডমিন ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...');
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1200);

    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMsg('লগইন প্রক্রিয়ায় ত্রুটি দেখা দিয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '80vh', display: 'flex', alignItems: 'center', paddingTop: '40px' }}>
      <Helmet>
        <title>অ্যাডমিন লগইন - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাটের অ্যাডমিন প্যানেলে প্রবেশ করুন।" />
      </Helmet>

      <div className="container" style={{ maxWidth: '420px', margin: '0 auto' }}>
        
        {/* Form Box */}
        <div style={{
          background: '#fff',
          padding: '40px 30px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1.5px solid var(--color-mud)',
          boxShadow: '0 15px 35px var(--color-shadow)',
          textAlign: 'center'
        }}>
          
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
            <span style={{ fontSize: '2.5rem' }}>🛡️</span>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>অ্যাডমিন লগইন</h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-honey-dark)', fontWeight: 'bold' }}>ম্যানেজমেন্ট পোর্টাল</span>
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
            
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ইমেইল ঠিকানা *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px 10px 40px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '0.95rem'
                  }}
                  placeholder="যেমন: admin@email.com"
                  disabled={loading}
                />
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
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
                gap: '8px',
                backgroundColor: 'var(--color-forest-dark)',
                borderColor: 'var(--color-forest-dark)'
              }}
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'অ্যাডমিন লগইন 🛡️'}
            </button>
          </form>

        </div>

      </div>
    </section>
  );
};
