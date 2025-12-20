'use client';

import { useState } from 'react';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:4000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.message || 'שגיאה בשליחת הבקשה');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('שגיאה בשליחת הבקשה');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
        <div className="text-2xl font-extrabold font-[cursive] mb-4">Kibutz</div>

        <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <FaCheckCircle className="w-16 h-16 text-green-500" />
          <h1 className="text-xl font-bold">נשלח בהצלחה!</h1>
          <p className="text-gray-600">
            אם כתובת האימייל קיימת במערכת, תקבל קישור לאיפוס הסיסמה.
          </p>
          <p className="text-sm text-gray-500">
            בדוק גם את תיקיית הספאם
          </p>
          <a
            href="/login"
            className="mt-4 bg-black text-white py-2 px-6 rounded hover:bg-gray-800"
          >
            חזרה להתחברות
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
      <div className="text-2xl font-extrabold font-[cursive] mb-4">Kibutz</div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col gap-4 text-right"
      >
        <h1 className="text-xl font-bold text-center">שכחתי סיסמה</h1>
        
        <p className="text-sm text-gray-600 text-center">
          הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
        </p>

        <div>
          <div className="relative">
            <FaEnvelope className="absolute right-3 top-3 text-gray-400" />
            <input
              id="forgot-email"
              type="email"
              placeholder="כתובת אימייל"
              className={`w-full p-2 pr-10 border rounded ${
                error ? 'border-red-400' : 'border-gray-300'
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-400"
        >
          {loading ? 'שולח...' : 'שלח קישור איפוס'}
        </button>

        <p className="text-center text-sm mt-2">
          <a href="/login" className="text-black underline">
            חזרה להתחברות
          </a>
        </p>
      </form>
    </main>
  );
}
