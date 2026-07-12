import React, { useEffect, useState } from 'react';
import { createChallenge } from '../pages/adminOrderUtils';

interface AdminDeleteDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

export const AdminDeleteDialog: React.FC<AdminDeleteDialogProps> = ({
  open,
  title = 'Are you sure you want to permanently delete this order?',
  description = 'This action cannot be undone. Related order items, payments, and history will be removed through database cascade rules.',
  onCancel,
  onConfirm
}) => {
  const [question, setQuestion] = useState({ question: '', answer: 0 });
  const [answer, setAnswer] = useState('');
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQuestion(createChallenge());
      setAnswer('');
      setVerified(false);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const canVerify = Number(answer) === question.answer;

  const handleVerify = () => {
    if (canVerify) setVerified(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '18px', border: '1px solid rgba(148, 163, 184, 0.22)', boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #fff7ed, #ffffff)' }}>
          <div style={{ fontSize: '0.84rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a3412', fontWeight: 800 }}>Danger Zone</div>
          <h3 style={{ margin: '8px 0 0', color: '#7c2d12', fontSize: '1.2rem' }}>{title}</h3>
        </div>
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{description}</p>
          {!verified ? (
            <>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Human verification</div>
                <div style={{ fontSize: '1.05rem', color: '#334155', marginBottom: '10px' }}>{question.question}</div>
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  inputMode="numeric"
                  placeholder="Enter the answer"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={onCancel} className="btn btn-outline" style={{ minWidth: '120px' }}>Cancel</button>
                <button onClick={handleVerify} disabled={!canVerify} className="btn btn-primary" style={{ minWidth: '160px', opacity: canVerify ? 1 : 0.55 }}>
                  Verify answer
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px', color: '#166534', fontWeight: 700 }}>
                Verification complete. Click delete again to permanently remove this order.
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={onCancel} className="btn btn-outline" style={{ minWidth: '120px' }}>Cancel</button>
                <button onClick={handleConfirm} disabled={submitting} className="btn btn-primary" style={{ minWidth: '180px', background: '#b91c1c', borderColor: '#b91c1c', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Deleting...' : 'Delete permanently'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
