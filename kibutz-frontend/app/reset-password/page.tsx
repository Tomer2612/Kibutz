'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import LockIcon from '../components/icons/LockIcon';

// Password requirements
const passwordRequirements = [
  { id: 'length', label: 'לפחות 8 תווים', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'אות גדולה באנגלית', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'אות קטנה באנגלית', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'מספר אחד לפחות', test: (p: string) => /[0-9]/.test(p) },
];

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Check password strength
  const passwordStrength = passwordRequirements.filter(req => req.test(password)).length;
  const isPasswordValid = passwordStrength === passwordRequirements.length;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const getStrengthColor = () => {
    if (passwordStrength === 0) return '#E1E1E2';
    if (passwordStrength === 1) return '#B3261E';
    if (passwordStrength === 2) return '#F59E0B';
    if (passwordStrength === 3) return '#F59E0B';
    return '#163300';
  };

  const getStrengthText = () => {
    if (password.length === 0) return '';
    if (passwordStrength === 1) return 'חלשה מאוד';
    if (passwordStrength === 2) return 'חלשה';
    if (passwordStrength === 3) return 'בינונית';
    return 'חזקה';
  };

  const scrollToField = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!isPasswordValid) {
      setPasswordError('הסיסמה לא עומדת בדרישות');
      scrollToField('reset-password');
      return;
    }

    if (!passwordsMatch) {
      setConfirmPasswordError('הסיסמאות אינן תואמות');
      scrollToField('reset-confirm-password');
      return;
    }

    if (!token) {
      setError('טוקן איפוס חסר');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else {
        setError(data.message || 'איפוס הסיסמה נכשל');
        if (data.message?.includes('expired') || data.message?.includes('Invalid')) {
          setStatus('error');
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
        <div className="text-2xl font-extrabold font-[cursive] mb-4">Kibutz</div>

        <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <FaTimesCircle className="w-16 h-16" style={{ color: '#B3261E' }} />
          <h1 className="text-xl font-bold" style={{ color: '#B3261E' }}>קישור לא תקין</h1>
          <p style={{ color: '#52525B' }}>
            הקישור לאיפוס הסיסמה אינו תקין או פג תוקפו
          </p>
          <a
            href="/forgot-password"
            className="mt-4 bg-black text-white py-2 px-6 rounded transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F3F46'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'black'}
          >
            בקש קישור חדש
          </a>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
        <div className="text-2xl font-extrabold font-[cursive] mb-4">Kibutz</div>

        <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <FaCheckCircle className="w-16 h-16" style={{ color: '#163300' }} />
          <h1 className="text-xl font-bold" style={{ color: '#163300' }}>הסיסמה אופסה בהצלחה!</h1>
          <p style={{ color: '#52525B' }}>
            כעת תוכל להתחבר עם הסיסמה החדשה
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-black text-white py-2 px-6 rounded transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F3F46'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'black'}
          >
            להתחברות
          </button>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
        <div className="text-2xl font-extrabold font-[cursive] mb-4">Kibutz</div>

        <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <FaTimesCircle className="w-16 h-16" style={{ color: '#B3261E' }} />
          <h1 className="text-xl font-bold" style={{ color: '#B3261E' }}>איפוס נכשל</h1>
          <p style={{ color: '#52525B' }}>{error}</p>
          <a
            href="/forgot-password"
            className="mt-4 bg-black text-white py-2 px-6 rounded transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F3F46'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'black'}
          >
            בקש קישור חדש
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-300 to-green-100">
      <div className="text-2xl font-extrabold font-[cursive] mb-4">Kibutz</div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm flex flex-col gap-4 text-right"
      >
        <h1 className="text-xl font-bold text-center">איפוס סיסמה</h1>
        
        <p className="text-sm text-center" style={{ color: '#52525B' }}>
          הזן את הסיסמה החדשה שלך
        </p>

        {/* Password Field */}
        <div>
          <div className="relative">
            <LockIcon className="absolute right-3 top-3 w-4 h-4" style={{ color: '#A1A1AA' }} />
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="סיסמה חדשה *"
              className="w-full p-2 pr-10 pl-10 border rounded focus:outline-none focus:ring-2"
              style={{
                borderColor: passwordError
                  ? '#B3261E'
                  : password && isPasswordValid 
                  ? '#163300' 
                  : password && !isPasswordValid
                  ? '#F59E0B'
                  : '#D0D0D4'
              }}
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
              className="absolute left-3 top-3 transition-colors"
              style={{ color: '#A1A1AA' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#52525B'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#A1A1AA'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E1E1E2' }}>
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ width: `${(passwordStrength / 4) * 100}%`, backgroundColor: getStrengthColor() }}
                  />
                </div>
                <span className="text-xs font-medium" style={{
                  color: passwordStrength === 4 ? '#163300' : 
                  passwordStrength >= 3 ? '#F59E0B' : '#B3261E'
                }}>
                  {getStrengthText()}
                </span>
              </div>

              {/* Requirements List */}
              {(passwordFocused || !isPasswordValid) && (
                <div className="rounded p-3 space-y-1" style={{ backgroundColor: '#FCFCFC' }}>
                  {passwordRequirements.map(req => (
                    <div key={req.id} className="flex items-center gap-2 text-sm">
                      {req.test(password) ? (
                        <FaCheck className="w-3 h-3" style={{ color: '#163300' }} />
                      ) : (
                        <FaTimes className="w-3 h-3" style={{ color: '#D0D0D4' }} />
                      )}
                      <span style={{ color: req.test(password) ? '#163300' : '#7A7A83' }}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {passwordError && (
            <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#B3261E' }}>
              <FaTimes className="w-3 h-3" />
              {passwordError}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <div className="relative">
            <LockIcon className="absolute right-3 top-3 w-4 h-4" style={{ color: '#A1A1AA' }} />
            <input
              id="reset-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="אימות סיסמה *"
              className="w-full p-2 pr-10 pl-10 border rounded focus:outline-none focus:ring-2"
              style={{
                borderColor: confirmPasswordError
                  ? '#B3261E'
                  : confirmPassword && passwordsMatch 
                  ? '#163300' 
                  : confirmPassword && !passwordsMatch
                  ? '#B3261E'
                  : '#D0D0D4'
              }}
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
              className="absolute left-3 top-3 transition-colors"
              style={{ color: '#A1A1AA' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#52525B'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#A1A1AA'}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#B3261E' }}>
              <FaTimes className="w-3 h-3" />
              הסיסמאות אינן תואמות
            </p>
          )}
          {confirmPassword && passwordsMatch && (
            <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#163300' }}>
              <FaCheck className="w-3 h-3" />
              הסיסמאות תואמות
            </p>
          )}
          {confirmPasswordError && (
            <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#B3261E' }}>
              <FaTimes className="w-3 h-3" />
              {confirmPasswordError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isPasswordValid || !passwordsMatch}
          className="bg-black text-white py-2 rounded transition-colors disabled:cursor-not-allowed"
          style={{ backgroundColor: (loading || !isPasswordValid || !passwordsMatch) ? '#A1A1AA' : 'black' }}
          onMouseEnter={(e) => !(loading || !isPasswordValid || !passwordsMatch) && (e.currentTarget.style.backgroundColor = '#3F3F46')}
          onMouseLeave={(e) => !(loading || !isPasswordValid || !passwordsMatch) && (e.currentTarget.style.backgroundColor = 'black')}
        >
          {loading ? 'מאפס...' : 'אפס סיסמה'}
        </button>

        {error && <p className="text-center text-sm" style={{ color: '#B3261E' }}>{error}</p>}
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
        <div className="text-xl">טוען...</div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
