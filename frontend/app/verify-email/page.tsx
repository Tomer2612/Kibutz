'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('טוקן אימות חסר');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email/${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('האימייל אומת בהצלחה!');
        } else {
          setStatus('error');
          setMessage(data.message || 'אימות נכשל');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('שגיאה באימות האימייל');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
      <div className="text-2xl font-extrabold font-[cursive] mb-4">Withly</div>

      <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col items-center gap-4 text-center">
        {status === 'loading' && (
          <>
            <FaSpinner className="w-16 h-16 animate-spin" style={{ color: '#A1A1AA' }} />
            <h1 className="text-xl font-bold">מאמת את האימייל...</h1>
            <p style={{ color: '#7A7A83' }}>אנא המתן</p>
          </>
        )}

        {status === 'success' && (
          <>
            <FaCheckCircle className="w-16 h-16" style={{ color: '#163300' }} />
            <h1 className="text-xl font-bold" style={{ color: '#163300' }}>אימות הושלם!</h1>
            <p style={{ color: '#52525B' }}>{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-black text-white py-2 px-6 rounded transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F3F46'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'black'}>
              להתחברות
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <FaTimesCircle className="w-16 h-16" style={{ color: '#B3261E' }} />
            <h1 className="text-xl font-bold" style={{ color: '#B3261E' }}>אימות נכשל</h1>
            <p style={{ color: '#52525B' }}>{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-black text-white py-2 px-6 rounded transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F3F46'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'black'}
            >
              חזרה להתחברות
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
