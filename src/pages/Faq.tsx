import React, { useState, useEffect } from 'react';
import { getFaqs } from '../data/db';
import type { Faq } from '../data/db';

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  useEffect(() => {
    getFaqs().then(setFaqs);
  }, []);

  const toggleFaq = (id: string) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  return (
    <>
      <section style={{ backgroundColor: 'var(--color-sand-dark)', padding: '50px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.6rem', color: 'var(--color-forest-dark)' }}>জিজ্ঞাসা ও ব্লগ</h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-charcoal-light)', marginTop: '8px' }}>
            সচরাচর জিজ্ঞাসিত প্রশ্নের উত্তর এবং উপকূলীয় জীবনের নানা শিক্ষামূলক নিবন্ধসমূহ।
          </p>
        </div>
      </section>

      {/* Accordions */}
      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          
          <div className="section-header">
            <span className="section-subtitle">জিজ্ঞাসা ও উত্তর</span>
            <h2 className="section-title">সচরাচর জিজ্ঞাসা</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '80px' }}>
            {faqs.map((faq) => (
              <div
                key={faq.id}
                style={{
                  background: 'var(--color-white)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--color-forest-dark)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>❓ {faq.question}</span>
                  <span style={{ fontSize: '1.4rem', color: 'var(--color-honey)' }}>
                    {activeFaq === faq.id ? '−' : '+'}
                  </span>
                </button>

                {activeFaq === faq.id && (
                  <div style={{ padding: '0 24px 20px', fontSize: '0.98rem', color: 'var(--color-charcoal-light)', lineHeight: '1.7', borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '15px' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Educational Articles */}
          <div className="section-header">
            <span className="section-subtitle">উপকূলীয় ব্লগ</span>
            <h2 className="section-title">শিক্ষামূলক প্রবন্ধসমূহ</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Article 1 */}
            <article style={{ background: 'var(--color-white)', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <span style={{ fontSize: '0.85rem', background: 'var(--color-sand)', padding: '4px 10px', borderRadius: '4px', color: 'var(--color-mangrove)', fontWeight: 'bold' }}>মধু শিক্ষা</span>
              <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.4rem', margin: '12px 0' }}>১. সুন্দরবনের খাঁটি মধু চেনার সহজ উপায়</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)', lineHeight: '1.7' }}>
                বাজারে অনেক রকম ভেজাল মধু পাওয়া যায়। কিন্তু সুন্দরবনের খলিশা ফুলের মধুর কিছু বিশেষ প্রাকৃতিক বৈশিষ্ট্য রয়েছে যা দিয়ে আপনি খাঁটি মধু শনাক্ত করতে পারেন। প্রথমত, খলিশা ফুলের খাঁটি মধু একটু হালকা টক-মিষ্টি স্বাদের হবে এবং এর সোনালী রঙ থাকবে। এতে কোনো তীব্র মিষ্টির ঝাঁঝ থাকবে না। দ্বিতীয়ত, এক গ্লাস পানিতে এক চামচ মধু ঢাললে খাঁটি মধু সরাসরি পানির নিচে তলানি হিসেবে জমা হবে, সাথে সাথে দ্রবীভূত হবে না।
              </p>
            </article>

            {/* Article 2 */}
            <article style={{ background: 'var(--color-white)', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <span style={{ fontSize: '0.85rem', background: 'var(--color-sand)', padding: '4px 10px', borderRadius: '4px', color: 'var(--color-mangrove)', fontWeight: 'bold' }}>মাছ ও চিংড়ি</span>
              <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.4rem', margin: '12px 0' }}>২. লোনা পানির বাগদা চিংড়ির পুষ্টিগুণ</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)', lineHeight: '1.7' }}>
                শ্যামনগরের লোনা পানির ঘের থেকে উৎপাদিত প্রাকৃতিক বাগদা চিংড়ি অত্যন্ত পুষ্টিকর। এতে রয়েছে প্রচুর পরিমাণে প্রোটিন এবং ওমেগা-৩ ফ্যাটি এসিড, যা হৃদযন্ত্র ভালো রাখতে এবং কোলেস্টেরল নিয়ন্ত্রণে সাহায্য করে। চিংড়ির মাথায় অবস্থিত পুষ্টিকর ঘিলু প্রাকৃতিকভাবে জিংক ও আয়রন সমৃদ্ধ। রাসায়নিক ফরমালিন ছাড়া তাজা বরফ দেওয়া চিংড়ি নিয়মিত খেলে হাড়ের গঠন শক্ত হয় এবং রক্তশূন্যতা দূর হয়।
              </p>
            </article>

            {/* Article 3 */}
            <article style={{ background: 'var(--color-white)', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <span style={{ fontSize: '0.85rem', background: 'var(--color-sand)', padding: '4px 10px', borderRadius: '4px', color: 'var(--color-mangrove)', fontWeight: 'bold' }}>সংগ্রাহকদের গল্প</span>
              <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.4rem', margin: '12px 0' }}>৩. সুন্দরবনের মৌয়ালদের জীবনযাত্রার অজানা তথ্য</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)', lineHeight: '1.7' }}>
                মৌয়াল হচ্ছেন সুন্দরবনের সেই সাহসী মানুষগুলো যারা বছরের নির্দিষ্ট সময়ে মধু সংগ্রহ করতে গভীর বনে পাড়ি জমান। বাঘের থাবা এবং কুমিরের আক্রমণ তো আছেই, সাথে বনের ডাকাত দলের ভয়। তারা বনে ঢোকার আগে বনবিভাগের কাছ থেকে পাস (বিএলসি) গ্রহণ করেন এবং ঐতিহ্যবাহী নিয়মে বনের রক্ষা কর্তা গাজী কালুর নাম ডেকে বনে প্রবেশ করেন। প্রাকৃতিকভাবে শুধুমাত্র ধোঁয়া দিয়ে তারা মৌমাছি তাড়ান এবং কখনো পুরো চাকটি কেটে ফেলেন না, পরবর্তী মৌসুমে আবার যাতে মধু পাওয়া যায় তার জন্য চাকের কিছু অংশ রেখে দেওয়া হয়।
              </p>
            </article>
          </div>

        </div>
      </section>
    </>
  );
};
