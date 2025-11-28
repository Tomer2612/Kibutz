'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function VerifyEmailPage() {
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
        const res = await fetch(`http://localhost:4000/auth/verify-email/${token}`);
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
      <div className="text-2xl font-extrabold font-[cursive] mb-4">Kibutz</div>

      <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col items-center gap-4 text-center">
        {status === 'loading' && (
          <>
            <FaSpinner className="w-16 h-16 text-gray-400 animate-spin" />
            <h1 className="text-xl font-bold">מאמת את האימייל...</h1>
            <p className="text-gray-500">אנא המתן</p>
          </>
        )}

        {status === 'success' && (
          <>
            <FaCheckCircle className="w-16 h-16 text-green-500" />
            <h1 className="text-xl font-bold text-green-600">אימות הושלם!</h1>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-black text-white py-2 px-6 rounded hover:bg-gray-800"
            >
              להתחברות
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <FaTimesCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-xl font-bold text-red-600">אימות נכשל</h1>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-black text-white py-2 px-6 rounded hover:bg-gray-800"
            >
              חזרה להתחברות
            </button>
          </>
        )}
      </div>
    </main>
  );
}
