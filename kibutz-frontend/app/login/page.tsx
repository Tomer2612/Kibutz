'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        router.push('/');
      } else {
        setMessage(data.message || 'ההתחברות נכשלה');
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('שגיאה בהתחברות');
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
          <FaLock className="absolute right-3 top-3 text-gray-400" />
          <input
            type="password"
            placeholder="סיסמה"
            className="w-full p-2 pr-10 border border-gray-300 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          התחברות
        </button>

        {message && <p className="text-center text-sm text-red-500">{message}</p>}

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
