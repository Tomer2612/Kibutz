'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('http://localhost:4000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.access_token);
      router.push('/');
    } else {
      setMessage(data.message || 'ההרשמה נכשלה');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
      <div className="flex flex-col items-center w-full max-w-sm">
        <div className="text-2xl font-extrabold font-[cursive] mb-6">Kibutz</div>

        <form
          onSubmit={handleSignup}
          className="bg-white rounded-xl p-8 shadow-md w-full flex flex-col gap-4 text-right"
        >
          <h1 className="text-xl font-bold text-center">הרשמה</h1>

          {/* Google Button */}
          <a
            href="http://localhost:4000/auth/google"
            className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            הצטרפות מהירה עם Google
          </a>

          <div className="relative my-2 text-center text-sm text-gray-400">או באמצעות מייל</div>

          {/* Name Field */}
          <div className="relative">
            <FaUser className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="שם מלא"
              className="w-full p-2 pr-10 border border-gray-300 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            הרשמה
          </button>

          {message && <p className="text-center text-sm text-red-500">{message}</p>}

          {/* Login Redirect */}
          <p className="text-center text-sm mt-2">
            כבר רשומים?{' '}
            <a href="/login" className="text-black-600 underline">
              התחברו כאן
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
