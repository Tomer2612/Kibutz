'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('error');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        router.push('/');
      } else {
        // Parse specific error messages
        const errorMsg = data.message || '';
        if (errorMsg.includes('User not found') || errorMsg.includes('not found')) {
          setMessage('לא נמצא חשבון עם כתובת אימייל זו');
          setMessageType('error');
        } else if (errorMsg.includes('Incorrect password') || errorMsg.includes('password')) {
          setMessage('הסיסמה שגויה');
          setMessageType('error');
        } else {
          setMessage('ההתחברות נכשלה. אנא בדוק את הפרטים ונסה שוב');
          setMessageType('error');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('שגיאה בהתחברות. אנא נסה שוב מאוחר יותר');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
      {/* Kibutz logo */}
      <div className="text-2xl font-extrabold font-[cursive] mb-4 mt-4">Kibutz</div>

      <form
        onSubmit={handleLogin}
        className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col gap-4 text-right"
      >
        <h1 className="text-xl font-bold text-center">התחברות</h1>

        {/* Google Button */}
        <a
          href="http://localhost:4000/auth/google"
          className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          <Image src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width={600} height={300} className="w-5 h-5" />
          התחברות מהירה עם Google
        </a>

        <div className="relative my-2 text-center text-sm text-gray-400">או באמצעות מייל</div>

        {/* Email Field */}
        <div className="relative">
          <FaEnvelope className="absolute right-3 top-3 text-gray-400" />
          <input
            type="email"
            placeholder="כתובת אימייל"
            className="w-full p-2 pr-10 border border-gray-300 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Field */}
        <div className="relative">
          <FaLock className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="סיסמה"
            className="w-full p-2 pr-10 pl-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <div className="text-left">
          <a href="/forgot-password" className="text-sm text-gray-600 hover:underline">
            שכחת סיסמה?
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'מתחבר...' : 'התחברות'}
        </button>

        {message && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            messageType === 'error' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
          }`}>
            <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
            <p>{message}</p>
          </div>
        )}

        <p className="text-center text-sm mt-2">
          עדיין לא רשומים?{' '}
          <a href="/signup" className="text-black-600 underline">
            הירשמו כאן
          </a>
        </p>
      </form>
    </main>
  );
}
