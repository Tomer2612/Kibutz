'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import NotificationBell from '../components/NotificationBell';
import { FaPlus, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';

interface FAQ {
  question: string;
  answer: string;
}

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

const faqs: FAQ[] = [
  {
    question: 'איך אני יוצר קהילה?',
    answer: 'לאחר הרשמה לאתר, לחצו על "צרו קהילה משלכם" בדף הבית. מלאו את פרטי הקהילה כולל שם, תיאור, נושא ותמונה, ולחצו על "צור קהילה".',
  },
  {
    question: 'איך אני מצטרף לקהילה קיימת?',
    answer: 'גלשו בדף הבית ומצאו קהילה שמעניינת אתכם. לחצו על כפתור "הצטרף" בכרטיס הקהילה והתחילו להשתתף מיד.',
  },
  {
    question: 'האם אפשר לנהל כמה קהילות?',
    answer: 'כן! בהתאם לתוכנית שבחרתם, תוכלו לנהל קהילה אחת או יותר. בתוכנית העסקית ניתן לנהל עד 5 קהילות.',
  },
  {
    question: 'איך אני משנה את הגדרות הקהילה?',
    answer: 'כבעלים או מנהל של קהילה, היכנסו לקהילה ולחצו על "ניהול קהילה" בתפריט העליון. משם תוכלו לערוך את כל ההגדרות.',
  },
  {
    question: 'מה קורה אם אני רוצה למחוק את הקהילה?',
    answer: 'רק בעל הקהילה יכול למחוק אותה. היכנסו לדף הניהול וגללו לתחתית העמוד. שימו לב שמחיקת קהילה היא פעולה בלתי הפיכה.',
  },
  {
    question: 'איך מערכת הנקודות עובדת?',
    answer: 'חברי קהילה צוברים נקודות על פעילות: 5 נקודות על פרסום פוסט, 3 נקודות על תגובה, ונקודה אחת על לייק. הנקודות מוצגות בלוח התוצאות.',
  },
  {
    question: 'האם אפשר לחסום משתמשים?',
    answer: 'כן, מנהלים ובעלי קהילה יכולים לחסום משתמשים מפרי כללים. החסימה היא זמנית ל-7 ימים.',
  },
];

export default function SupportPage() {
  const router = useRouter();
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
            }
          })
          .catch(console.error);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfileCache');
    router.push('/');
    location.reload();
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
          <Link href="/support" className="text-black font-medium transition text-sm">
            שאלות ותשובות
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-black transition text-sm font-medium">
            צרו קשר
          </Link>
          <Link href="/terms" className="text-gray-600 hover:text-black transition text-sm font-medium">
            תנאי שימוש
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
          שאלות ותשובות
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          יש לכם שאלות? אנחנו כאן לעזור! מצאו תשובות לשאלות נפוצות או פנו אלינו ישירות.
        </p>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition"
              >
                <span className="font-medium text-black">{faq.question}</span>
                <span className={`transform transition-transform duration-300 ${openFaqs.has(index) ? 'rotate-45' : ''}`}>
                  <FaPlus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </span>
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${openFaqs.has(index) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 text-gray-600 text-right">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
