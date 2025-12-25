'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import NotificationBell from '../components/NotificationBell';
import { FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export default function TermsPage() {
  const router = useRouter();
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
        fetch('http://localhost:4000/users/me', {
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
          <Link href="/support" className="text-gray-600 hover:text-black transition text-sm font-medium">
            שאלות ותשובות
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-black transition text-sm font-medium">
            צרו קשר
          </Link>
          <Link href="/terms" className="text-black font-medium transition text-sm">
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
                    src={`http://localhost:4000${userProfile.profileImage}`}
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
          תנאי שימוש
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          כל מה שצריך לדעת על השימוש בפלטפורמה
        </p>
      </section>

      {/* About Section */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-4">אודות Kibutz</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              <strong>Kibutz</strong> היא פלטפורמה ישראלית לבניית וניהול קהילות מקוונות. אנחנו מאמינים שכל אחד יכול ליצור קהילה משגשגת סביב התחום שהוא אוהב - בין אם זה גיימינג, בישול, ספורט, לימודים או כל נושא אחר.
            </p>
            <p>
              הפלטפורמה שלנו מציעה כלים פשוטים ועוצמתיים לניהול קהילות: פרסום תכנים, ניהול חברים, מערכת נקודות ותגמולים, קורסים, ועוד. המטרה שלנו היא לאפשר לכם להתמקד בבניית הקהילה שלכם בזמן שאנחנו דואגים לכל השאר.
            </p>
            <p>
              הוקמנו ב-2025 מתוך חזון לחבר אנשים עם תחומי עניין משותפים וליצור מרחבים דיגיטליים איכותיים בעברית.
            </p>
          </div>
        </div>
      </section>

      {/* Copyright & Legal Section */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">זכויות יוצרים ותנאי שימוש</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-black mb-2">זכויות יוצרים</h3>
              <p>
                כל הזכויות על הפלטפורמה, העיצוב, הקוד והתכנים שייכות ל-Kibutz © 2025. 
                אין להעתיק, לשכפל או להפיץ חלקים מהאתר ללא אישור בכתב מראש.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">תוכן משתמשים</h3>
              <p>
                המשתמשים שומרים על זכויות היוצרים לתכנים שהם מפרסמים בקהילות. 
                בפרסום תוכן באתר, המשתמש מעניק ל-Kibutz רישיון להציג את התוכן בפלטפורמה.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">אחריות</h3>
              <p>
                Kibutz אינה אחראית לתכנים שמפורסמים על ידי משתמשים. 
                אנו שומרים על הזכות להסיר תכנים שמפרים את תנאי השימוש או את החוק.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">פרטיות</h3>
              <p>
                אנו מחויבים להגנה על פרטיות המשתמשים. המידע האישי נשמר בצורה מאובטחת 
                ולא יועבר לצדדים שלישיים ללא הסכמה, למעט כנדרש על פי חוק.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">שימוש הוגן</h3>
              <p>
                המשתמשים מתחייבים לעשות שימוש הוגן בפלטפורמה, לכבד את שאר המשתמשים, 
                ולא לפרסם תכנים פוגעניים, לא חוקיים או מטעים.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">ביטולים והחזרים</h3>
              <p>
                ניתן לבטל מנוי בכל עת דרך הגדרות הקהילה. החזר כספי יינתן בהתאם למדיניות הביטולים 
                ובכפוף לחוק הגנת הצרכן.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
            © 2025 Kibutz. כל הזכויות שמורות.
          </div>
        </div>
      </section>
    </main>
  );
}
