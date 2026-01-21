'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaCheckCircle, FaCheck, FaTimes, FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineKey } from 'react-icons/hi';
import Image from 'next/image';
import Link from 'next/link';

// Minimum requirements (must have all)
const passwordRequirements = [
  { id: 'length', label: 'לפחות 6 תווים', test: (p: string) => p.length >= 6 },
  { id: 'letter', label: 'לפחות אות אחת', test: (p: string) => /[a-zA-Z]/.test(p) },
  { id: 'number', label: 'לפחות מספר אחד', test: (p: string) => /[0-9]/.test(p) },
];

// Suggestions for stronger password (optional but recommended)
const passwordSuggestions = [
  { id: 'length10', label: '10 תווים או יותר', test: (p: string) => p.length >= 10 },
  { id: 'uppercase', label: 'אות גדולה באנגלית (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'אות קטנה באנגלית (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'special', label: 'תו מיוחד (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

// Email validation
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check URL param first, then localStorage
    const returnParam = searchParams.get('returnUrl');
    if (returnParam) {
      setReturnUrl(returnParam);
    } else {
      // Check localStorage (set by pricing page etc.)
      const storedReturnUrl = localStorage.getItem('returnUrl');
      if (storedReturnUrl) {
        setReturnUrl(storedReturnUrl);
      }
    }
  }, [searchParams]);

  // Check password strength (based on suggestions met)
  const requirementsMet = passwordRequirements.filter(req => req.test(password)).length;
  const suggestionsMet = passwordSuggestions.filter(sug => sug.test(password)).length;
  const isPasswordValid = requirementsMet === passwordRequirements.length;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  
  // Strength is based on requirements + suggestions (total 7 items)
  const totalStrength = requirementsMet + suggestionsMet;

  // Email validation on blur - also triggers check
  const validateEmail = async () => {
    setEmailTouched(true);
    setEmailChecking(true);
    
    if (!email) {
      setEmailError('');
      setEmailChecking(false);
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('כתובת אימייל לא תקינה');
      setEmailChecking(false);
      return;
    }
    
    // Check if email exists
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setEmailError('כתובת האימייל כבר רשומה במערכת');
        } else {
          setEmailError('');
        }
      }
    } catch (error) {
      // Silently fail
    } finally {
      setEmailChecking(false);
    }
  };

  const getStrengthColor = () => {
    if (totalStrength <= 2) return 'bg-red-500';
    if (totalStrength <= 4) return 'bg-orange-500';
    if (totalStrength <= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (password.length === 0) return '';
    if (totalStrength <= 2) return 'חלשה';
    if (totalStrength <= 4) return 'בינונית';
    if (totalStrength <= 5) return 'טובה';
    return 'חזקה מאוד';
  };

  const scrollToFirstError = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate all fields with inline errors
    if (!name.trim()) {
      setNameError('יש להזין שם מלא');
      scrollToFirstError('signup-name');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('כתובת אימייל לא תקינה');
      scrollToFirstError('signup-email');
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('הסיסמה לא עומדת בדרישות');
      scrollToFirstError('signup-password');
      return;
    }

    if (!passwordsMatch) {
      setConfirmPasswordError('הסיסמאות אינן תואמות');
      scrollToFirstError('signup-confirm-password');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message?.includes('Unique constraint') || data.message?.includes('already exists')) {
          setMessage('כתובת האימייל כבר רשומה במערכת');
          setEmailError('כתובת האימייל כבר רשומה במערכת. אולי תרצה להתחבר או לאפס סיסמה?');
        } else {
          setMessage(data.message || 'ההרשמה נכשלה');
        }
        return;
      }

      localStorage.setItem('token', data.access_token);
      // Set cookie for middleware auth
      document.cookie = `auth-token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
      
      // Check if user was creating a community - skip email verification and go straight to pricing
      const isCreatingCommunity = searchParams.get('createCommunity') === 'true';
      if (isCreatingCommunity) {
        router.push('/pricing?step=create');
        return;
      }
      
      // Check if user was joining a community from preview page
      const pendingJoinCommunity = localStorage.getItem('pendingJoinCommunity');
      if (pendingJoinCommunity) {
        const pendingPayment = localStorage.getItem('pendingPayment');
        localStorage.removeItem('pendingJoinCommunity');
        localStorage.removeItem('pendingPayment');
        
        if (pendingPayment) {
          // Paid community - redirect back to preview to show payment modal
          router.push(`/communities/${pendingJoinCommunity}/preview?showPayment=true`);
        } else {
          // Free community - join directly then redirect to community
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
        return;
      }
      
      // Save returnUrl for after email verification
      if (returnUrl) {
        localStorage.setItem('returnUrl', returnUrl);
      }
      setShowVerificationMessage(true);
    } catch (error) {
      console.error('Signup error:', error);
      setMessage('שגיאה בהרשמה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setMessage('מייל אימות נשלח שוב!');
      } else {
        setMessage('שגיאה בשליחת מייל');
      }
    } catch (error) {
      setMessage('שגיאה בשליחת מייל');
    } finally {
      setResending(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-white" dir="rtl">
        <div className="flex flex-col items-center w-full max-w-sm">
          <div className="text-2xl font-extrabold mb-6">Kibutz</div>
          
          <div className="bg-white rounded-xl p-8 shadow-md w-full flex flex-col items-center gap-4 text-center border border-gray-100">
            <FaCheckCircle className="w-16 h-16 text-green-500" />
            <h1 className="text-xl font-bold">ההרשמה הושלמה!</h1>
            <p className="text-gray-600">
              שלחנו לך מייל אימות לכתובת:
            </p>
            <p className="font-semibold text-black">{email}</p>
            <p className="text-sm text-gray-500">
              אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאימות.
            </p>
            
            <div className="border-t border-gray-200 w-full pt-4 mt-2">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-sm text-gray-600 hover:underline disabled:text-gray-400"
              >
                {resending ? 'שולח...' : 'לא קיבלת? שלח שוב'}
              </button>
            </div>
            
            {message && (
              <p className={`text-sm ${message.includes('שגיאה') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
            )}
            
            <button
              onClick={() => router.push('/')}
              className="mt-2 bg-black text-white py-2 px-6 rounded hover:bg-gray-800"
            >
              המשך לאתר
            </button>
          </div>
        </div>
      </main>
    );
  }

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
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-5xl w-full">
          
          {/* Right Side - Marketing Content */}
          <div className="hidden lg:block w-full lg:w-1/2 text-right">
            <h2 className="text-[32px] font-bold text-gray-900 mb-8 leading-tight">
              פותחים קהילה ומתחילים להרוויח
            </h2>
            
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaCheck className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-gray-700 text-[16px]">
                  מערכת פשוטה ליצור הכנסה וניהול מנויים מהרגע הראשון
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaCheck className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-gray-700 text-[16px]">
                  פלטפורמה שמרכזת קורסים, צ'אט וקהילה במקום אחד
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaCheck className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-gray-700 text-[16px]">
                  הקמת קהילה פעילה ומעוצבת בדקות, ללא ידע טכני
                </p>
              </div>
            </div>
          </div>

          {/* Left Side - Registration Form */}
          <div className="w-full lg:w-1/2 max-w-md">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <form
                onSubmit={handleSignup}
                className="w-full flex flex-col gap-4 text-right"
              >
                <h1 className="text-[21px] font-semibold text-center mb-2">מתחילים כאן</h1>

                {/* Google Button */}
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg text-[16px] hover:opacity-80 transition"
                  style={{ backgroundColor: '#F4F4F5' }}
                >
                  הצטרפות מהירה עם Google
                  <Image src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width={600} height={300} className="w-5 h-5" />
                </a>

                <div className="relative my-3 text-center text-[12px] text-gray-400">
                  <span className="bg-white px-3 relative z-10">או באמצעות מייל</span>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                </div>

            {/* Name Field */}
            <div>
              <div className="relative">
                <FaUser className="absolute right-3 top-3.5 text-gray-400" />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="שם מלא *"
                  className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-[14px] ${
                    nameError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-black'
                  }`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  required
                />
              </div>
              {nameError && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaTimes className="w-3 h-3" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <div className="relative">
                <HiOutlineMail className="absolute right-3 top-3.5 text-gray-400 pointer-events-none w-5 h-5" />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="כתובת אימייל *"
                  className={`w-full p-3 pr-10 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-[14px] ${
                    emailError 
                      ? 'border-red-400 focus:ring-red-400' 
                      : emailTouched && email && isValidEmail(email) && !emailError && !emailChecking
                      ? 'border-green-400 focus:ring-green-400'
                      : 'border-gray-300 focus:ring-black'
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTouched(false);
                    setEmailError('');
                  }}
                  onBlur={validateEmail}
                  required
                />
                <div className="absolute left-3 top-3.5 pointer-events-none">
                  {emailChecking ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : emailTouched && email ? (
                    emailError ? (
                      <FaTimes className="text-red-500" />
                    ) : isValidEmail(email) ? (
                      <FaCheck className="text-green-500" />
                    ) : null
                  ) : null}
                </div>
              </div>
              {emailError && (
                <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <FaExclamationTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{emailError}</p>
                    {emailError.includes('כבר רשומה') && (
                      <div className="mt-1 flex gap-3">
                        <a href="/login" className="text-blue-600 hover:underline">התחברות</a>
                        <a href="/forgot-password" className="text-blue-600 hover:underline">איפוס סיסמה</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <HiOutlineKey className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="סיסמה *"
                  className={`w-full p-3 pr-10 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-[14px] ${
                    passwordError
                      ? 'border-red-400 focus:ring-red-400'
                      : password && isPasswordValid 
                      ? 'border-green-400 focus:ring-green-400' 
                      : password && !isPasswordValid
                      ? 'border-orange-400 focus:ring-orange-400'
                      : 'border-gray-300 focus:ring-black'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(totalStrength / 7) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      totalStrength >= 6 ? 'text-green-600' : 
                      totalStrength >= 4 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>

                  {/* Requirements List (must have) */}
                  {(passwordFocused || !isPasswordValid) && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1 mb-2">
                      <p className="text-xs font-semibold text-gray-700 mb-1">דרישות חובה:</p>
                      {passwordRequirements.map(req => (
                        <div key={req.id} className="flex items-center gap-2 text-sm">
                          {req.test(password) ? (
                            <FaCheck className="w-3 h-3 text-green-500" />
                          ) : (
                            <FaTimes className="w-3 h-3 text-red-400" />
                          )}
                          <span className={req.test(password) ? 'text-green-600' : 'text-gray-500'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions List (optional) */}
                  {passwordFocused && isPasswordValid && (
                    <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-semibold text-blue-700 mb-1">המלצות לסיסמה חזקה יותר:</p>
                      {passwordSuggestions.map(sug => (
                        <div key={sug.id} className="flex items-center gap-2 text-sm">
                          {sug.test(password) ? (
                            <FaCheck className="w-3 h-3 text-green-500" />
                          ) : (
                            <span className="w-3 h-3 rounded-full border border-blue-300" />
                          )}
                          <span className={sug.test(password) ? 'text-green-600' : 'text-blue-600'}>
                            {sug.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {passwordError && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaTimes className="w-3 h-3" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="relative">
                <HiOutlineKey className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="אימות סיסמה *"
                  className={`w-full p-3 pr-10 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-[14px] ${
                    confirmPasswordError
                      ? 'border-red-400 focus:ring-red-400'
                      : confirmPassword && passwordsMatch 
                      ? 'border-green-400 focus:ring-green-400' 
                      : confirmPassword && !passwordsMatch
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-black'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaTimes className="w-3 h-3" />
                  הסיסמאות אינן תואמות
                </p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="mt-1 text-sm text-green-500 flex items-center gap-1">
                  <FaCheck className="w-3 h-3" />
                  הסיסמאות תואמות
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid || !passwordsMatch || !name.trim() || !isValidEmail(email) || !!emailError}
              className="bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'נרשם...' : 'הרשמה'}
            </button>

            {message && <p className="text-center text-[14px] text-red-500">{message}</p>}

            {/* Login Redirect */}
            <p className="text-center text-[14px] mt-2">
             יש לך כבר חשבון?{' '}
              <a href={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} className="text-black font-medium hover:underline">
                התחברו כאן
              </a>
            </p>
          </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <SignupContent />
    </Suspense>
  );
}
