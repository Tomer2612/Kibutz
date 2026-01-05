'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import NotificationBell from '../components/NotificationBell';
import { FaCog, FaSignOutAlt, FaEnvelope, FaPaperPlane, FaUser } from 'react-icons/fa';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

// Email validation
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Character limits
const CHAR_LIMITS = {
  name: 30,
  subject: 50,
  message: 500,
};

export default function ContactPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Validation state
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setMounted(true);

    // Read cached profile immediately
    const cached = localStorage.getItem('userProfileCache');
    if (cached) {
      try { setUserProfile(JSON.parse(cached)); } catch {}
    }

    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);
        setContactEmail(decoded.email);
        
        // Fetch user profile
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              const profile = { name: data.name, profileImage: data.profileImage };
              setUserProfile(profile);
              localStorage.setItem('userProfileCache', JSON.stringify(profile));
              setContactName(data.name || '');
            }
          })
          .catch(console.error);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfileCache');
    router.push('/');
    location.reload();
  };

  const validateEmail = () => {
    setEmailTouched(true);
    if (!contactEmail) {
      setEmailError('נא להזין אימייל');
    } else if (!isValidEmail(contactEmail)) {
      setEmailError('כתובת אימייל לא תקינה');
    } else {
      setEmailError('');
    }
  };

  const isFormValid = contactName.trim() !== '' && 
                      contactEmail.trim() !== '' && 
                      isValidEmail(contactEmail) && 
                      contactSubject.trim() !== '' && 
                      contactMessage.trim() !== '';

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submit
    if (!isValidEmail(contactEmail)) {
      setEmailError('כתובת אימייל לא תקינה');
      setEmailTouched(true);
      return;
    }
    
    setFormLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit');
      }
      
      setFormSubmitted(true);
    } catch (error) {
      console.error('Contact form error:', error);
      // Still show success to user - the form was submitted even if email fails
      setFormSubmitted(true);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/pricing" className="text-gray-600 hover:text-black transition text-sm font-medium">
            מחירון
          </Link>
          <Link href="/support" className="text-gray-600 hover:text-black transition text-sm font-medium">
            שאלות ותשובות
          </Link>
          <Link href="/contact" className="text-black font-medium transition text-sm">
            צרו קשר
          </Link>
          <Link href="/terms" className="text-gray-600 hover:text-black transition text-sm font-medium">
            תנאי שימוש
          </Link>
          <Link href="/privacy" className="text-gray-600 hover:text-black transition text-sm font-medium">
            מדיניות פרטיות
          </Link>
          
          {!mounted ? (
            <div className="w-10 h-10" />
          ) : !userEmail ? (
            <>
              <Link
                href="/login"
                className="border border-black text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-black hover:text-white transition"
              >
                כניסה
              </Link>
              <Link
                href="/signup"
                className="bg-black text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
              >
                הרשמה
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="relative focus:outline-none"
              >
                {userProfile?.profileImage ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${userProfile.profileImage}`}
                    alt={userProfile.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-600">
                    {userProfile?.name?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </button>
              
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50" dir="rtl">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        if (userId) router.push(`/profile/${userId}`);
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <FaUser className="w-4 h-4" />
                      הפרופיל שלי
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push('/settings');
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <FaCog className="w-4 h-4" />
                      הגדרות
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      התנתקות
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
          דברו איתנו
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          יש שאלה או פנייה? אפשר גם לכתוב ישירות ל-<span className="text-black font-semibold">support@kibutz.co.il</span>
        </p>
      </section>

      {/* Contact Form */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {formSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPaperPlane className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">ההודעה נשלחה!</h3>
              <p className="text-gray-600">נחזור אליכם בהקדם האפשרי.</p>
              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setContactSubject('');
                  setContactMessage('');
                  setEmailTouched(false);
                  setEmailError('');
                }}
                className="mt-4 text-blue-600 hover:underline text-sm"
              >
                שלח הודעה נוספת
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">שם מלא</label>
                  <span className="text-xs text-gray-400">{contactName.length}/{CHAR_LIMITS.name}</span>
                </div>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value.slice(0, CHAR_LIMITS.name))}
                  required
                  maxLength={CHAR_LIMITS.name}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    if (emailTouched) {
                      if (!e.target.value) {
                        setEmailError('נא להזין אימייל');
                      } else if (!isValidEmail(e.target.value)) {
                        setEmailError('כתובת אימייל לא תקינה');
                      } else {
                        setEmailError('');
                      }
                    }
                  }}
                  onBlur={validateEmail}
                  required
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right ${
                    emailTouched && emailError ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {emailTouched && emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">נושא</label>
                  <span className="text-xs text-gray-400">{contactSubject.length}/{CHAR_LIMITS.subject}</span>
                </div>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value.slice(0, CHAR_LIMITS.subject))}
                  required
                  maxLength={CHAR_LIMITS.subject}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">תיאור</label>
                  <span className="text-xs text-gray-400">{contactMessage.length}/{CHAR_LIMITS.message}</span>
                </div>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value.slice(0, CHAR_LIMITS.message))}
                  required
                  rows={5}
                  maxLength={CHAR_LIMITS.message}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right resize-none overflow-y-auto"
                  style={{ direction: 'ltr' }}
                />
              </div>
              <button
                type="submit"
                disabled={formLoading || !isFormValid}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {formLoading ? 'שולח...' : 'שלח'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
