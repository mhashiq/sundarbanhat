import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { dataService } from '../services/dataService';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      setErrorMsg('অনুগ্রহ করে প্রয়োজনীয় ক্ষেত্রগুলো (নাম, মোবাইল নম্বর ও বার্তা) পূরণ করুন।');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      await dataService.createContactMessage({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        subject: subject.trim() || undefined,
        message: message.trim()
      });

      setSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setErrorMsg('বার্তা পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন বা সরাসরি কল করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>যোগাযোগ - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাটের সাথে সরাসরি যোগাযোগ করুন। মোবাইল নম্বর: ০১৮৭৩-৫২০১৮১, উপজেলা মোড়, শ্যামনগর, সাতক্ষীরা শাখা অফিস।" />
        <meta name="keywords" content="সুন্দরবন হাট ঠিকানা, সুন্দরবন হাট ফোন নাম্বার, শ্যামনগর সাতক্ষীরা অফিস" />
        <link rel="canonical" href="https://sundarbanhat.com/#/contact" />
      </Helmet>
      
      {/* Banner */}
      <section style={{ backgroundColor: 'var(--color-sand-dark)', padding: '50px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.6rem', color: 'var(--color-forest-dark)' }}>আমাদের সাথে যোগাযোগ</h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-charcoal-light)', marginTop: '8px' }}>
            যেকোনো জিজ্ঞাসা, বিশেষ বাল্ক অর্ডার কিংবা পরামর্শ দিতে সরাসরি আমাদের কার্যালয়ের ঠিকানায় বা মোবাইলে যোগাযোগ করুন।
          </p>
        </div>
      </section>

      {/* Main Section */}
      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container">
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
            
            {/* Left Column: Direct Info & Map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Direct Info List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <a href="tel:+8801873520181" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '1.8rem' }}>📞</div>
                    <div>
                      <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.15rem', marginBottom: '4px', margin: 0 }}>মোবাইল হেল্পলাইন</h3>
                      <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem', margin: 0 }}>01873-520181 (কল করুন যেকোনো প্রয়োজনে)</p>
                    </div>
                  </div>
                </a>

                <a href="https://wa.me/8801873520181" target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '1.8rem' }}>💬</div>
                    <div>
                      <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.15rem', marginBottom: '4px', margin: 0 }}>WhatsApp লাইভ চ্যাট</h3>
                      <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem', margin: 0 }}>01873-520181 (সরাসরি মেসেজ দিন)</p>
                    </div>
                  </div>
                </a>

                <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1.8rem' }}>📍</div>
                  <div>
                    <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.15rem', marginBottom: '4px', margin: 0 }}>শ্যামনগর শাখা অফিস</h3>
                    <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem', margin: 0 }}>উপজেলা মোড়, শ্যামনগর, সাতক্ষীরা, বাংলাদেশ</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1.8rem' }}>📧</div>
                  <div>
                    <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.15rem', marginBottom: '4px', margin: 0 }}>ইমেল যোগাযোগ</h3>
                    <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem', margin: 0 }}>support@sundarbanhat.com</p>
                  </div>
                </div>
              </div>

              {/* Embedded Google map iframe */}
              <div style={{ height: '280px', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
                <iframe
                  src="https://maps.google.com/maps?q=Ishwaripur,+Shyamnagar,+Satkhira&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

            </div>

            {/* Right Column: Contact Message Form */}
            <div style={{
              background: '#fff',
              padding: '35px',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 15px 35px var(--color-shadow)'
            }}>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--color-forest-dark)', fontWeight: '800', marginBottom: '8px', marginTop: 0 }}>যোগাযোগ করুন</h2>
              <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.9rem', marginBottom: '25px' }}>
                আপনার বার্তাটি লিখুন, আমাদের টিম খুব দ্রুত আপনার সাথে যোগাযোগ করবে।
              </p>

              {success && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32',
                  padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem', marginBottom: '20px'
                }}>
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  <span>আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে! ধন্যবাদ।</span>
                </div>
              )}

              {errorMsg && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828',
                  padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem', marginBottom: '20px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitMessage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '5px' }}>আপনার নাম *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="যেমন: আসিফুর রহমান"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem' }} 
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '5px' }}>মোবাইল নম্বর *</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="যেমন: 01xxxxxxxxx"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem' }} 
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '5px' }}>ইমেইল ঠিকানা (ঐচ্ছিক)</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="যেমন: name@example.com"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem' }} 
                  />
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '5px' }}>বিষয় (ঐচ্ছিক)</label>
                  <input 
                    type="text" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    placeholder="যেমন: বাল্ক অর্ডার / মতামত"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem' }} 
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '5px' }}>বার্তাটি লিখুন *</label>
                  <textarea 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="আপনার বার্তা বা প্রশ্ন বিস্তারিত লিখুন..."
                    rows={4}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem', fontFamily: 'inherit' }} 
                  />
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    padding: '12px', fontSize: '1rem', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px'
                  }}
                >
                  <Send size={18} /> {loading ? 'বার্তা পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
                </button>

              </form>
            </div>

          </div>

        </div>
      </section>
    </>
  );
};
