import React from 'react';
import { Helmet } from 'react-helmet-async';

export const About: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>আমাদের সম্পর্কে - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাটের সংগ্রহকারী মৌয়াল, জেলে ও উপকূলের স্থানীয় কৃষকদের জীবন মান উন্নয়ন ও খাঁটি খাবার সরবরাহের গল্প।" />
        <meta name="keywords" content="সুন্দরবন হাট পরিচয়, সুন্দরবন মৌয়াল, শ্যামনগর সাতক্ষীরা" />
        <link rel="canonical" href="https://sundarbanhat.com/#/about" />
      </Helmet>
      <section style={{ backgroundColor: 'var(--color-sand-dark)', padding: '50px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.6rem', color: 'var(--color-forest-dark)' }}>আমাদের সম্পর্কে</h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-charcoal-light)', marginTop: '8px' }}>
            সুন্দরবনের জীববৈচিত্র্য ও শ্যামনগরের প্রান্তিক মানুষের ভালোবাসায় গড়া আমাদের গল্প।
          </p>
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          
          <div className="policy-card-holder">
            <h2 style={{ color: 'var(--color-mangrove)' }}>🌾 সুন্দরবন হাটের যাত্রা ও স্বপ্ন</h2>
            <p>
              সুন্দরবন হাট মূলত একটি প্রাকৃতিক ও নিরাপদ কোস্টাল ফুড ব্রান্ড। সাতক্ষীরা জেলার শ্যামনগর উপজেলা, যা বিশ্বখ্যাত ম্যানগ্রোভ বন সুন্দরবনের কোলে অবস্থিত, সেখান থেকে সরাসরি সংগৃহীত খাঁটি খাদ্যপণ্য আমরা দেশের প্রতিটি প্রান্তের মানুষের কাছে নিরাপদ উপায়ে পৌঁছে দিই।
            </p>
            <p>
              আমরা কোনো যান্ত্রিক রিফাইনারি বা রাসায়নিক ল্যাবের প্রক্রিয়াজাত খাদ্য বিক্রয় করি না। আমাদের লক্ষ্য সুন্দরবনের বৈচিত্র্যময় প্রাকৃতিক স্বাদ অক্ষুণ্ণ রেখে খাঁটি কাঁচা খাবার পরিবেশন করা।
            </p>

            <h2 style={{ color: 'var(--color-mangrove)' }}>🤝 প্রান্তিক সংগ্রাহক ও চাষীদের পাশে</h2>
            <p>
              সুন্দরবনের ভেতর থেকে বাঘ ও কুমিরের ভয় উপেক্ষা করে মৌয়ালরা যে মধু সংগ্রহ করে নিয়ে আসেন, জেলেরা যে চিংড়ি ও লোনা মাছ আহরণ করেন এবং কৃষকেরা যে তেল ও চাল উৎপাদন করেন, আমরা তাদের পাশে দাঁড়াই। 
            </p>
            <p>
              সুন্দরবন হাট সরাসরি তাদের থেকে ন্যায্য মূল্যে পণ্য ক্রয় করে থাকে। ফলে মধ্যস্বত্বভোগীদের দৌরাত্ম্য ছাড়াই তারা আর্থিকভাবে লাভবান হন এবং তাদের সন্তানেরা শিক্ষার সুযোগ পায়।
            </p>

            <h2 style={{ color: 'var(--color-mangrove)' }}>🛡️ গুণগত মান ও পরীক্ষা পলিসি</h2>
            <p>
              আমরা গুণগত মানে কোনো ধরনের আপস করি না। আমাদের প্রতিটি পণ্য:
            </p>
            <ul>
              <li><strong>১০০% খাঁটি ও কাঁচা:</strong> মধুতে অতিরিক্ত তাপ দেওয়া বা রাসায়নিক চিনি মেশানো হয় না।</li>
              <li><strong>ফরমালিন ও কেমিক্যাল মুক্ত:</strong> আমাদের মাছ ও ফলে কোনো প্রকার প্রিজারভেটিভ ব্যবহার করা হয় না।</li>
              <li><strong>উৎস-সদৃশ গ্যারান্টি:</strong> শ্যামনগর সুন্দরবন হাব থেকে কুরিয়ারের মাধ্যমে সরাসরি আপনার কাছে পাঠানো হয়।</li>
            </ul>

            <p style={{ marginTop: '30px', fontStyle: 'italic', fontWeight: '600', color: 'var(--color-forest-dark)', textAlign: 'center' }}>
              "সুন্দরবন হাট - উপকূলের সততা ও প্রকৃতির খাঁটি পুষ্টির এক পরম বন্ধন।"
            </p>
          </div>

        </div>
      </section>
    </>
  );
};
