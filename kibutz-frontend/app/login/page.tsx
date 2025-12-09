'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineKey } from 'react-icons/hi';
import Image from 'next/image';
import Link from 'next/link';

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
    <main className="min-h-screen flex flex-col" dir="rtl" style={{ backgroundColor: '#F4F4F5' }}>
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div></div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <form
              onSubmit={handleLogin}
              className="w-full flex flex-col gap-4 text-right"
            >
                <h1 className="text-[21px] font-semibold text-center mb-2">התחברות</h1>

                {/* Google Button */}
                <a
                  href="http://localhost:4000/auth/google"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg text-[16px] hover:opacity-80 transition"
                  style={{ backgroundColor: '#F4F4F5' }}
                >
                  התחברות מהירה עם Google
                  <Image src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width={600} height={300} className="w-5 h-5" />
                </a>

                <div className="relative my-3 text-center text-[12px] text-gray-400">
                  <span className="bg-white px-3 relative z-10">או באמצעות מייל</span>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative">
                  <HiOutlineMail className="absolute right-3 top-3.5 text-gray-400 pointer-events-none w-5 h-5" />
                  <input
                    type="email"
                    placeholder="כתובת אימייל"
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-[14px]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <HiOutlineKey className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="סיסמה"
                    className="w-full p-3 pr-10 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-[14px]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="text-left">
                  <a href="/forgot-password" className="text-[14px] text-gray-600 hover:underline">
                    שכחת סיסמה?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? 'מתחבר...' : 'התחברות'}
                </button>

                {message && (
                  <div className={`flex items-center gap-2 text-[14px] p-2 rounded-lg ${
                    messageType === 'error' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
                  }`}>
                    <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                    <p>{message}</p>
                  </div>
                )}

                <p className="text-center text-[14px] mt-2">
                  עדיין לא הצטרפת?{' '}
                  <a href="/signup" className="text-black font-medium hover:underline">
                    הירשמו כאן
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
    </main>
  );
}
