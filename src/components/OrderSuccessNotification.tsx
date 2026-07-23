import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, CheckCircle2, X, Package, Home, Sparkles } from 'lucide-react';

interface OrderSuccessNotificationProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  autoCloseSeconds?: number;
}

export const OrderSuccessNotification: React.FC<OrderSuccessNotificationProps> = ({
  orderId,
  isOpen,
  onClose,
  autoCloseSeconds = 7
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Confetti Animation Effect
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      vx: number;
      vy: number;
      rotation: number;
      vRot: number;
      opacity: number;
    }> = [];

    const colors = ['#144A26', '#22c55e', '#D4AF37', '#F39C12', '#38bdf8', '#a855f7'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 - 100 + (Math.random() - 0.5) * 100,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -12 - 4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let animationFrameId: number;
    let startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vRot;

        if (elapsed > 1800) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (elapsed < 3000) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  // Auto-close countdown timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, onClose]);

  // Copy Order ID
  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Formatted Current Timestamp in Bengali
  const getFormattedTimestamp = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `আজ, ${timeStr}`;
  };

  if (!isOpen) return null;

  const progressPercentage = (timeLeft / autoCloseSeconds) * 100;

  return (
    <div
      className="sh-notification-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sh-notification-title"
    >
      {/* Confetti Canvas */}
      <canvas ref={canvasRef} className="sh-confetti-canvas" />

      <style>{`
        .sh-notification-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(7, 34, 17, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: shFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sh-confetti-canvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 100000;
        }

        .sh-notification-card {
          position: relative;
          z-index: 100001;
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(7, 34, 17, 0.25), 0 10px 20px -5px rgba(20, 74, 38, 0.12);
          border: 1px solid rgba(20, 74, 38, 0.12);
          overflow: hidden;
          animation: shSlideUpScale 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shSlideUpScale {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Countdown Progress Bar */
        .sh-progress-bar-track {
          width: 100%;
          height: 5px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .sh-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #144A26, #22c55e);
          transition: width 1s linear;
        }

        .sh-notification-body {
          padding: 32px 28px 28px;
          text-align: center;
        }

        /* Top Close Button */
        .sh-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sh-close-btn:hover {
          background: #fee2e2;
          color: #ef4444;
          border-color: #fca5a5;
          transform: rotate(90deg);
        }

        /* Success Icon Glow Ring */
        .sh-icon-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .sh-icon-bg {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #144A26);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(22, 163, 74, 0.35);
          animation: shPulseRing 2s infinite;
        }
        @keyframes shPulseRing {
          0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
          70% { box-shadow: 0 0 0 18px rgba(22, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }

        /* Title & Message */
        .sh-title {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.55rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px;
          line-height: 1.3;
        }
        .sh-subtitle {
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 1.05rem;
          color: #334155;
          margin: 0 0 20px;
          line-height: 1.6;
        }

        /* Order ID Chip */
        .sh-order-id-box {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          padding: 8px 16px;
          border-radius: 14px;
          margin-bottom: 20px;
        }
        .sh-order-id-label {
          font-size: 0.88rem;
          color: #64748b;
          font-weight: 600;
        }
        .sh-order-id-val {
          font-family: monospace;
          font-size: 1.1rem;
          font-weight: 800;
          color: #144A26;
        }
        .sh-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: none;
          background: rgba(20, 74, 38, 0.08);
          color: #144A26;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sh-copy-btn:hover {
          background: #144A26;
          color: #ffffff;
        }

        /* Information Cards */
        .sh-info-box {
          background: rgba(248, 250, 252, 0.9);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
          text-align: left;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.65;
        }

        .sh-timestamp-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 12px;
          background: #f1f5f9;
          padding: 3px 10px;
          border-radius: 99px;
        }

        /* Action Buttons Grid */
        .sh-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .sh-actions-grid {
            grid-template-columns: 1fr;
          }
        }

        .sh-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 20px;
          background: linear-gradient(135deg, #144A26, #072211);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(20, 74, 38, 0.25);
          text-decoration: none;
        }
        .sh-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(20, 74, 38, 0.35);
        }

        .sh-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 20px;
          background: #f8fafc;
          color: #334155;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none;
        }
        .sh-btn-secondary:hover {
          background: #ffffff;
          border-color: #144A26;
          color: #144A26;
          transform: translateY(-2px);
        }
      `}</style>

      <div
        className="sh-notification-card"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Progress Countdown Bar */}
        <div className="sh-progress-bar-track">
          <div
            className="sh-progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="sh-close-btn"
          onClick={onClose}
          title="বন্ধ করুন"
          aria-label="বন্ধ করুন"
        >
          <X size={20} />
        </button>

        <div className="sh-notification-body">
          {/* Animated Success Badge */}
          <div className="sh-icon-wrapper">
            <div className="sh-icon-bg">
              <CheckCircle2 size={46} strokeWidth={2.5} />
            </div>
          </div>

          {/* Title Header */}
          <h2 id="sh-notification-title" className="sh-title">
            ✅ অর্ডার সফলভাবে সম্পন্ন হয়েছে!
          </h2>

          {/* Subtitle Thank You */}
          <p className="sh-subtitle">
            ধন্যবাদ! আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।
          </p>

          {/* Timestamp Tag */}
          <div className="sh-timestamp-tag">
            <Sparkles size={13} style={{ color: '#D4AF37' }} />
            <span>{getFormattedTimestamp()}</span>
          </div>

          {/* Order ID Box with Copy Button */}
          <div className="sh-order-id-box">
            <span className="sh-order-id-label">অর্ডার আইডি:</span>
            <span className="sh-order-id-val">#{orderId}</span>
            <button
              type="button"
              className="sh-copy-btn"
              onClick={handleCopyOrderId}
              title="কপি করুন"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>কপি</span>
                </>
              )}
            </button>
          </div>

          {/* Explanatory Message Box */}
          <div className="sh-info-box">
            <p style={{ margin: '0 0 8px 0' }}>
              📞 <strong>আমাদের টিম খুব শীঘ্রই আপনার অর্ডার যাচাই করে আপনার সঙ্গে যোগাযোগ করবে।</strong>
            </p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              আপনার অর্ডারের সর্বশেষ অবস্থা জানতে <strong>"আমার অর্ডার"</strong> অথবা <strong>ড্যাশবোর্ড</strong> থেকে ট্র্যাক করতে পারবেন।
            </p>
          </div>

          {/* Primary & Secondary Buttons */}
          <div className="sh-actions-grid">
            <button
              type="button"
              className="sh-btn-primary"
              onClick={() => {
                onClose();
                navigate('/account?tab=orders');
              }}
            >
              <Package size={18} />
              <span>আমার অর্ডার দেখুন</span>
            </button>

            <button
              type="button"
              className="sh-btn-secondary"
              onClick={() => {
                onClose();
                navigate('/');
              }}
            >
              <Home size={18} />
              <span>হোমে ফিরে যান</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
