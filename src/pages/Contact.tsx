import React from 'react';
import { Helmet } from 'react-helmet-async';

export const Contact: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>যোগাযোগ - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাটের সাথে সরাসরি যোগাযোগ করুন। মোবাইল নম্বর: ০১৮৭৩-৫২০১৮১, উপজেলা মোড়, শ্যামনগর, সাতক্ষীরা শাখা অফিস।" />
        <meta name="keywords" content="সুন্দরবন হাট ঠিকানা, সুন্দরবন হাট ফোন নাম্বার, শ্যামনগর সাতক্ষীরা অফিস" />
        <link rel="canonical" href="https://mhashiq.github.io/sundarbanhat/#/contact" />
      </Helmet>
      <section style={{ backgroundColor: 'var(--color-sand-dark)', padding: '50px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.6rem', color: 'var(--color-forest-dark)' }}>আমাদের সাথে যোগাযোগ</h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-charcoal-light)', marginTop: '8px' }}>
            যেকোনো জিজ্ঞাসা, বিশেষ বাল্ক অর্ডার কিংবা পরামর্শ দিতে সরাসরি আমাদের কার্যালয়ের ঠিকানায় বা মোবাইলে যোগাযোগ করুন।
          </p>
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container">
          
          <div className="delivery-split-row">
            {/* Direct contact lists */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <a href="tel:+8801873520181" style={{ display: 'block' }}>
                <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '2rem' }}>📞</div>
                  <div>
                    <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.2rem', marginBottom: '4px' }}>মোবাইল হেল্পলাইন</h3>
                    <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem' }}>01873-520181 (কল করুন যেকোনো প্রয়োজনে)</p>
                  </div>
                </div>
              </a>

              <a href="https://wa.me/8801873520181" target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '2rem' }}>💬</div>
                  <div>
                    <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.2rem', marginBottom: '4px' }}>WhatsApp লাইভ চ্যাট</h3>
                    <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem' }}>01873-520181 (সরাসরি মেসেজ দিন)</p>
                  </div>
                </div>
              </a>

              <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '2rem' }}>📍</div>
                <div>
                  <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.2rem', marginBottom: '4px' }}>শ্যামনগর শাখা অফিস</h3>
                  <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem' }}>উপজেলা মোড়, শ্যামনগর, সাতক্ষীরা, বাংলাদেশ</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '2rem' }}>📧</div>
                <div>
                  <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.2rem', marginBottom: '4px' }}>ইমেল যোগাযোগ</h3>
                  <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.92rem' }}>support@sundarbanhat.com</p>
                </div>
              </div>
            </div>

            {/* Embedded Google map iframe */}
            <div style={{ height: '420px', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 15px 35px var(--color-shadow)' }}>
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

        </div>
      </section>
    </>
  );
};
