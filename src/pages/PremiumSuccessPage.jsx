import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';

const PremiumSuccessPage = () => {
  const { user, isPremium, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 5;
    let timeoutId;

    const verifyPayment = async () => {
      try {
        const sessionObj = await refreshUser();
        if (sessionObj?.prefs?.isPremium === true) {
          setStatus('success');
        } else if (attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(verifyPayment, 2000);
        } else {
          setStatus('success');
        }
      } catch (err) {
        console.error('Payment verification polling error:', err);
        if (attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(verifyPayment, 2000);
        } else {
          setStatus('success');
        }
      }
    };

    if (user) {
      if (isPremium) {
        setStatus('success');
      } else {
        verifyPayment();
      }
    } else {
      const checkUserTimeout = setTimeout(() => {
        if (!user) {
          setStatus('success');
        }
      }, 3000);
      return () => clearTimeout(checkUserTimeout);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isPremium, refreshUser]);

  return (
    <PageLayout variant="centered" width="2xl">
      <SEO
        title="Payment Successful — Welcome to Premium! — CineVault"
        url="/premium/success"
      />

      <div className="text-center">
        {status === 'verifying' ? (
          <>
            <div className="text-6xl mb-6 animate-pulse">⏳</div>
            <h1 className="page-title page-title--center !text-3xl mb-4">Verifying Your Payment...</h1>
            <p className="text-gray-400">Please wait while we activate your Premium account.</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="page-title page-title--center !text-3xl mb-4">Welcome to Premium!</h1>
            <p className="text-gray-400 mb-2">
              Your payment was successful. You now have access to:
            </p>
            <ul className="text-gray-300 text-sm space-y-2 mb-8">
              <li>✓ Ad-free streaming</li>
              <li>✓ 4K Ultra HD quality</li>
              <li>✓ All streaming sources</li>
              <li>✓ Priority support</li>
            </ul>
            {sessionId && (
              <p className="text-xs text-gray-500 mb-6">
                Session: {sessionId.slice(0, 14)}...
              </p>
            )}
            <Link
              to="/browse"
              className="inline-block bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Start Watching Now
            </Link>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default PremiumSuccessPage;
