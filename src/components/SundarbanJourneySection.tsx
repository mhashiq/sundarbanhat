import { Snowflake, Users, Truck, Sparkles, CheckCircle2, FlaskConical } from 'lucide-react';
import { getImageUrl } from '../services/dataService';

interface JourneyStep {
  step: string;
  title: string;
  icon: string;
  description: string;
  image: string;
  fallbackImage?: string;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    step: '01',
    title: 'গহীন সুন্দরবনে যাত্রা',
    icon: '🛶',
    description: 'অভিজ্ঞ মৌয়ালরা কাঠের নৌকা নিয়ে সুন্দরবনের গভীরে প্রবেশ করে খলিশা, গরান ও কেওড়া ফুলের অঞ্চলে প্রাকৃতিক চাক খুঁজে বের করেন।',
    image: getImageUrl('/sundarbanboat.jpg'),
    fallbackImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
  },
  {
    step: '02',
    title: 'প্রাকৃতিকভাবে মধু সংগ্রহ',
    icon: '🍯',
    description: 'মৌমাছির কোনো ক্ষতি না করে ধোঁয়ার সাহায্যে চাক থেকে কাঁচা মধু সংগ্রহ করা হয়। কোনো তাপ, চিনি বা কৃত্রিম উপাদান ব্যবহার করা হয় না।',
    image: getImageUrl('/honey.webp'),
    fallbackImage: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=800&q=80'
  },
  {
    step: '03',
    title: 'তাজা লোনা পানির চিংড়ি',
    icon: '🦐',
    description: 'সাতক্ষীরা ও সুন্দরবন সংলগ্ন উপকূল থেকে প্রতিদিন ভোরে সতেজ বাগদা ও গলদা চিংড়ি সংগ্রহ করা হয়।',
    image: getImageUrl('/prawn.jpg'),
    fallbackImage: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80'
  },
  {
    step: '04',
    title: 'বিশুদ্ধতা ও মান পরীক্ষা',
    icon: '🔬',
    description: 'প্রতিটি ব্যাচে বিশুদ্ধতা, নিরাপত্তা ও গুণগত মান নিশ্চিত করতে আধুনিক পরীক্ষাগারে মান যাচাই করা হয়।',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    fallbackImage: getImageUrl('/honeypack.png')
  },
  {
    step: '05',
    title: 'নিরাপদ প্যাকেজিং',
    icon: '📦',
    description: 'মধু ফুড-গ্রেড বোতলে এবং চিংড়ি কোল্ড-চেইন প্রযুক্তিতে নিরাপদভাবে প্যাক করে পাঠানো হয়।',
    image: getImageUrl('/honeypack.png'),
    fallbackImage: getImageUrl('/honey-box.png')
  },
  {
    step: '06',
    title: 'আপনার পরিবারের টেবিলে',
    icon: '🏡',
    description: 'সরাসরি সংগ্রহস্থল থেকে দ্রুত ডেলিভারির মাধ্যমে বিশুদ্ধ, নিরাপদ এবং সতেজ খাদ্য পৌঁছে যায় আপনার ঘরে।',
    image: getImageUrl('/mango.JPG'),
    fallbackImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
  }
];

interface TrustFeature {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const TRUST_FEATURES: TrustFeature[] = [
  {
    icon: <Sparkles size={24} />,
    title: '১০০% প্রাকৃতিক',
    subtitle: 'কোনো কৃত্রিম উপাদান নয়'
  },
  {
    icon: <FlaskConical size={24} />,
    title: 'ফরমালিনমুক্ত',
    subtitle: 'নিরাপদ ও স্বাস্থ্যসম্মত'
  },
  {
    icon: <Users size={24} />,
    title: 'সরাসরি সংগ্রহ',
    subtitle: 'মৌয়াল ও স্থানীয় জেলেদের কাছ থেকে'
  },
  {
    icon: <Snowflake size={24} />,
    title: 'কোল্ড-চেইন ডেলিভারি',
    subtitle: 'সতেজতা অক্ষুণ্ণ রাখা হয়'
  },
  {
    icon: <CheckCircle2 size={24} />,
    title: 'গুণগত মান নিশ্চিত',
    subtitle: 'প্রতিটি ব্যাচ পরীক্ষা করা হয়'
  },
  {
    icon: <Truck size={24} />,
    title: 'দ্রুত ডেলিভারি',
    subtitle: 'বাংলাদেশজুড়ে নিরাপদ হোম ডেলিভারি'
  }
];

export const SundarbanJourneySection: React.FC = () => {
  return (
    <section className="sundarban-journey-root">
      <style>{`
        .sundarban-journey-root {
          background-color: #FFF9F2;
          padding: 90px 20px;
          color: #1e293b;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .sj-container {
          max-width: 1320px;
          margin: 0 auto;
        }

        /* Hero Header */
        .sj-header-center {
          text-align: center;
          max-width: 820px;
          margin: 0 auto 55px;
        }

        .sj-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(46, 107, 62, 0.08);
          border: 1px solid rgba(46, 107, 62, 0.18);
          border-radius: 99px;
          color: #2E6B3E;
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 20px;
          letter-spacing: 0.02em;
        }

        .sj-title {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 2.75rem;
          font-weight: 800;
          color: #072211;
          line-height: 1.25;
          margin: 0 0 20px;
        }
        @media (max-width: 768px) {
          .sj-title { font-size: 2rem; }
        }

        .sj-subtitle {
          font-size: 1.12rem;
          color: #5A4325;
          line-height: 1.75;
          margin: 0;
          font-weight: 500;
        }

        /* Hero Sundarbans Banner */
        .sj-hero-banner {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 40px -10px rgba(7, 34, 17, 0.18);
          margin-bottom: 70px;
          min-height: 380px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 48px 56px;
          background: linear-gradient(135deg, rgba(7, 34, 17, 0.88), rgba(20, 74, 38, 0.75)), url('/sundarbanboat.jpg') center/cover no-repeat;
        }
        @media (max-width: 992px) {
          .sj-hero-banner {
            flex-direction: column;
            text-align: center;
            padding: 36px 24px;
            min-height: 320px;
          }
        }

        .sj-banner-content {
          max-width: 580px;
          color: #ffffff;
          z-index: 2;
        }
        .sj-banner-tag {
          color: #D4AF37;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
          display: block;
        }
        .sj-banner-title {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #FCFAF5;
          line-height: 1.3;
          margin: 0 0 16px;
        }
        .sj-banner-desc {
          font-size: 1.05rem;
          color: rgba(252, 250, 245, 0.9);
          line-height: 1.7;
          margin: 0;
        }

        .sj-banner-badge-box {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 24px 28px;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 2;
          max-width: 320px;
        }
        @media (max-width: 992px) {
          .sj-banner-badge-box {
            margin-top: 24px;
            width: 100%;
            max-width: 100%;
          }
        }
        .sj-banner-badge-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.98rem;
          font-weight: 600;
        }

        /* Timeline Grid */
        .sj-timeline-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 80px;
          position: relative;
        }
        @media (max-width: 1024px) {
          .sj-timeline-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .sj-timeline-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Journey Step Card */
        .sj-step-card {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(7, 34, 17, 0.06), 0 4px 12px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(46, 107, 62, 0.08);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .sj-step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -10px rgba(46, 107, 62, 0.15), 0 8px 20px rgba(0, 0, 0, 0.06);
          border-color: rgba(46, 107, 62, 0.25);
        }

        .sj-step-img-box {
          position: relative;
          height: 220px;
          overflow: hidden;
        }
        .sj-step-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sj-step-card:hover .sj-step-img {
          transform: scale(1.08);
        }

        /* Circular Green Step Number */
        .sj-step-num-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #2E6B3E;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(46, 107, 62, 0.4);
          border: 2px solid #ffffff;
        }

        /* Icon Badge */
        .sj-icon-badge {
          position: absolute;
          bottom: 14px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .sj-step-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .sj-step-title {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #072211;
          margin: 0 0 10px;
          line-height: 1.35;
        }
        .sj-step-desc {
          font-size: 0.98rem;
          color: #475569;
          line-height: 1.7;
          margin: 0;
        }

        /* Bottom Trust Features Bar */
        .sj-trust-section {
          background: #ffffff;
          border-radius: 24px;
          padding: 40px 32px;
          box-shadow: 0 12px 35px -5px rgba(7, 34, 17, 0.08);
          border: 1px solid rgba(46, 107, 62, 0.1);
        }

        .sj-trust-header {
          text-align: center;
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
          color: #072211;
          margin: 0 0 30px;
        }

        .sj-trust-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 20px;
        }
        @media (max-width: 1200px) {
          .sj-trust-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .sj-trust-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .sj-trust-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 14px;
          background: #FFF9F2;
          border-radius: 18px;
          border: 1px solid rgba(46, 107, 62, 0.1);
          transition: all 0.3s ease;
        }
        .sj-trust-card:hover {
          transform: translateY(-4px);
          background: #ffffff;
          box-shadow: 0 8px 20px rgba(46, 107, 62, 0.12);
          border-color: #2E6B3E;
        }

        .sj-trust-icon-ring {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid #2E6B3E;
          color: #2E6B3E;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }
        .sj-trust-card:hover .sj-trust-icon-ring {
          background: #2E6B3E;
          color: #ffffff;
        }

        .sj-trust-title {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #072211;
          margin: 0 0 4px;
        }
        .sj-trust-subtitle {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
      `}</style>

      <div className="sj-container">
        {/* Hero Header */}
        <div className="sj-header-center">
          <div className="sj-badge">
            <span>🌿</span>
            <span>খাঁটি খাদ্য সংগ্রহের জীবনযাত্রা</span>
          </div>

          <h2 className="sj-title">
            সুন্দরবন থেকে আপনার টেবিল পর্যন্ত
          </h2>

          <p className="sj-subtitle">
            মধু সংগ্রাহক (মৌয়াল) থেকে শুরু করে আপনার পরিবারের রান্নাঘর পর্যন্ত প্রতিটি ধাপে আমরা নিশ্চিত করি বিশুদ্ধতা, সতেজতা এবং আস্থার গল্প।
          </p>
        </div>

        {/* Hero Sundarbans Banner */}
        <div className="sj-hero-banner">
          <div className="sj-banner-content">
            <span className="sj-banner-tag">প্রাকৃতিক উৎসের অনন্য যাত্রা</span>
            <h3 className="sj-banner-title">
              বাঘের রাজ্য সুন্দরবনের গহীন থেকে আপনার পরিবারের পাতে
            </h3>
            <p className="sj-banner-desc">
              সুন্দরবনের ম্যানগ্রোভ বনের গভীরে নৌকায় চড়ে মৌয়ালদের মধু সংগ্রহ থেকে শুরু করে উপকূলীয় তাজা চিংড়ি মাছ আপনার ডাইনিং টেবিলে পরিবেশন—প্রতিটি পদক্ষেপে আমাদের অঙ্গীকার শতভাগ বিশুদ্ধতা।
            </p>
          </div>

          <div className="sj-banner-badge-box">
            <div className="sj-banner-badge-item">
              <span>🛶</span>
              <span>কাঠের ঐতিহ্যবাহী নৌকায় যাত্রা</span>
            </div>
            <div className="sj-banner-badge-item">
              <span>🍯</span>
              <span>শতভাগ প্রাকৃতিকভাবে চাক থেকে চিপা মধু</span>
            </div>
            <div className="sj-banner-badge-item">
              <span>🦐</span>
              <span>প্রতি ভোরে সংগৃহীত লোনা পানির তাজা মাছ</span>
            </div>
          </div>
        </div>

        {/* 6-Step Journey Timeline Grid */}
        <div className="sj-timeline-grid">
          {JOURNEY_STEPS.map((stepItem) => (
            <div key={stepItem.step} className="sj-step-card">
              {/* Photo Box */}
              <div className="sj-step-img-box">
                <img
                  src={stepItem.image}
                  alt={stepItem.title}
                  className="sj-step-img"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (stepItem.fallbackImage && target.src !== stepItem.fallbackImage) {
                      target.src = stepItem.fallbackImage;
                    }
                  }}
                />
                <div className="sj-step-num-badge">
                  {stepItem.step}
                </div>
                <div className="sj-icon-badge">
                  {stepItem.icon}
                </div>
              </div>

              {/* Card Body */}
              <div className="sj-step-body">
                <h3 className="sj-step-title">{stepItem.title}</h3>
                <p className="sj-step-desc">{stepItem.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Features Bar */}
        <div className="sj-trust-section">
          <h3 className="sj-trust-header">
            🛡️ কেন আমাদের খাদ্যপণ্য শতভাগ বিশ্বস্ত ও নিরাপদ?
          </h3>

          <div className="sj-trust-grid">
            {TRUST_FEATURES.map((feature, idx) => (
              <div key={idx} className="sj-trust-card">
                <div className="sj-trust-icon-ring">
                  {feature.icon}
                </div>
                <h4 className="sj-trust-title">{feature.title}</h4>
                <p className="sj-trust-subtitle">{feature.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
