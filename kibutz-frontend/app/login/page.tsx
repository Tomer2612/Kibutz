'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaEye, FaEyeSlash, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineKey } from 'react-icons/hi';
import Image from 'next/image';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('error');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check for Google auth error
    const errorParam = searchParams.get('error');
    if (errorParam === 'account_exists') {
      setMessage('חשבון עם כתובת האימייל הזו כבר קיים. אנא התחבר עם האימייל והסיסמא שלך.');
      setMessageType('error');
    } else if (errorParam === 'google_failed') {
      setMessage('שגיאה בהתחברות עם Google. אנא נסה שוב.');
      setMessageType('error');
    }

    // Check for expired session
    const expiredParam = searchParams.get('expired');
    if (expiredParam === 'true') {
      setMessage('פג תוקף ההתחברות. אנא התחבר מחדש.');
      setMessageType('info');
    }

    // Check URL param first, then localStorage
    const returnParam = searchParams.get('returnUrl');
    const redirectParam = searchParams.get('redirect');
    if (returnParam) {
      setReturnUrl(returnParam);
    } else if (redirectParam) {
      setReturnUrl(redirectParam);
    } else {
      // Check localStorage (set by signup page before email verification)
      const storedReturnUrl = localStorage.getItem('returnUrl');
      if (storedReturnUrl) {
        setReturnUrl(storedReturnUrl);
        localStorage.removeItem('returnUrl');
      }
    }
  }, [searchParams]);

  const scrollToField = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setEmailError('');
    setPasswordError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        // Set cookie for middleware auth
        document.cookie = `auth-token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
        
        // Check for pending community join
        const pendingJoinCommunity = localStorage.getItem('pendingJoinCommunity');
        if (pendingJoinCommunity) {
          localStorage.removeItem('pendingJoinCommunity');
          const pendingPayment = localStorage.getItem('pendingPayment');
          localStorage.removeItem('pendingPayment');
          
          if (pendingPayment) {
            router.push(`/communities/${pendingJoinCommunity}/preview?showPayment=true`);
          } else {
            // Try to join directly
            try {
              const joinRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${pendingJoinCommunity}/join`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${data.access_token}` },
              });
              if (joinRes.ok) {
                router.push(`/communities/${pendingJoinCommunity}/feed`);
              } else {
                router.push(`/communities/${pendingJoinCommunity}/preview`);
              }
            } catch {
              router.push(`/communities/${pendingJoinCommunity}/preview`);
            }
          }
        } else {
          router.push(returnUrl || '/');
        }
      } else {
        // Parse specific error messages and show inline
        const errorMsg = data.message || '';
        if (errorMsg.includes('User not found') || errorMsg.includes('not found')) {
          setEmailError('לא נמצא חשבון עם כתובת אימייל זו');
          scrollToField('login-email');
        } else if (errorMsg.includes('Incorrect password') || errorMsg.includes('password')) {
          setPasswordError('הסיסמה שגויה');
          scrollToField('login-password');
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
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
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
                <h1 className="text-[21px] text-center mb-2" style={{ fontWeight: 600 }}>התחברות</h1>

                {/* Google Button */}
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
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
                <div>
                  <div className="relative">
                    <HiOutlineMail className="absolute right-3 top-3.5 text-gray-400 pointer-events-none w-5 h-5" />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="כתובת אימייל"
                      className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-[14px] ${
                        emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-black'
                      }`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      required
                    />
                  </div>
                  {emailError && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <FaTimes className="w-3 h-3" />
                      <p>{emailError}</p>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <HiOutlineKey className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="סיסמה"
                      className={`w-full p-3 pr-10 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-[14px] ${
                        passwordError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-black'
                      }`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordError && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <FaTimes className="w-3 h-3" />
                      <p>{passwordError}</p>
                    </div>
                  )}
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
                  <a href={`/signup${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} className="text-black font-medium hover:underline">
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <LoginContent />
    </Suspense>
  );
}
