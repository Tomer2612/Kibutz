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

export default function PrivacyPage() {
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
          <Link href="/terms" className="text-gray-600 hover:text-black transition text-sm font-medium">
            תנאי שימוש
          </Link>
          <Link href="/privacy" className="text-black font-medium transition text-sm">
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
          מדיניות פרטיות
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם
        </p>
        <p className="text-gray-500 text-sm mt-4">
          עודכן לאחרונה: ינואר 2026
        </p>
      </section>

      {/* Introduction */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-4">מבוא</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              ב-<strong>Kibutz</strong> אנו מחויבים להגן על פרטיות המשתמשים שלנו. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על המידע האישי שלכם בעת השימוש בפלטפורמה שלנו.
            </p>
            <p>
              בשימוש בשירותי Kibutz, אתם מסכימים לאיסוף ושימוש במידע בהתאם למדיניות זו. אנו ממליצים לקרוא מדיניות זו בעיון ולפנות אלינו בכל שאלה.
            </p>
          </div>
        </div>
      </section>

      {/* Information We Collect */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">המידע שאנו אוספים</h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-black mb-2">מידע שאתם מספקים לנו</h3>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li><strong>פרטי הרשמה:</strong> שם, כתובת אימייל, סיסמה (מוצפנת)</li>
                <li><strong>פרטי פרופיל:</strong> תמונת פרופיל, ביוגרפיה, תמונת רקע</li>
                <li><strong>תוכן:</strong> פוסטים, תגובות, הודעות שאתם מפרסמים בקהילות</li>
                <li><strong>פרטי תשלום:</strong> במידה ורכשתם מנוי (מעובד דרך ספק תשלומים מאובטח)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">מידע שנאסף אוטומטית</h3>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li><strong>נתוני שימוש:</strong> עמודים שנצפו, זמן שהייה, פעולות באתר</li>
                <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה</li>
                <li><strong>קובצי Cookie:</strong> לשמירת העדפות והתחברות</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How We Use Information */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">כיצד אנו משתמשים במידע</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>אנו משתמשים במידע שנאסף למטרות הבאות:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>הפעלת הפלטפורמה ומתן השירותים</li>
              <li>יצירה וניהול החשבון שלכם</li>
              <li>עיבוד תשלומים ומנויים</li>
              <li>שליחת התראות והודעות רלוונטיות</li>
              <li>שיפור השירותים והחוויה באתר</li>
              <li>מניעת הונאות ושמירה על אבטחת המערכת</li>
              <li>עמידה בדרישות חוקיות</li>
            </ul>
            <p className="mt-4">
              <strong>שמירת מידע:</strong> אנו שומרים את המידע שלכם כל עוד החשבון פעיל. 
              לאחר מחיקת החשבון, המידע יימחק תוך 30 יום, למעט מידע שאנו מחויבים לשמור על פי חוק.
            </p>
          </div>
        </div>
      </section>

      {/* Information Sharing */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">שיתוף מידע עם צדדים שלישיים</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              אנו <strong>לא מוכרים</strong> את המידע האישי שלכם לצדדים שלישיים. 
              אנו עשויים לשתף מידע רק במקרים הבאים:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li><strong>ספקי שירות:</strong> חברות שמסייעות לנו בתפעול (אחסון, תשלומים, אימייל)</li>
              <li><strong>דרישה חוקית:</strong> כאשר נדרש על פי חוק או צו בית משפט</li>
              <li><strong>הגנה על זכויות:</strong> להגנה על הזכויות, הבטיחות או הרכוש שלנו או של אחרים</li>
              <li><strong>בהסכמתכם:</strong> כאשר נתתם הסכמה מפורשת</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Data Security */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">אבטחת מידע</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלכם:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>הצפנת סיסמאות באמצעות bcrypt</li>
              <li>תקשורת מוצפנת באמצעות HTTPS/SSL</li>
              <li>אחסון מאובטח בשרתים מוגנים (AWS)</li>
              <li>גישה מוגבלת למידע על בסיס הרשאות</li>
              <li>ניטור ומעקב אחר פעילות חשודה</li>
            </ul>
            <p>
              למרות מאמצינו, אין שיטת העברה או אחסון באינטרנט שהיא מאובטחת ב-100%. 
              אנו עושים כמיטב יכולתנו להגן על המידע שלכם.
            </p>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">הזכויות שלכם</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>בהתאם לחוק הגנת הפרטיות, יש לכם את הזכויות הבאות:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li><strong>גישה:</strong> לבקש עותק של המידע האישי שלכם</li>
              <li><strong>תיקון:</strong> לתקן מידע שגוי או לא מעודכן</li>
              <li><strong>מחיקה:</strong> לבקש מחיקת החשבון והמידע שלכם</li>
              <li><strong>ניוד:</strong> לקבל את המידע שלכם בפורמט נפוץ</li>
              <li><strong>התנגדות:</strong> להתנגד לעיבוד מסוים של המידע</li>
            </ul>
            <p>
              לממוש זכויות אלו, פנו אלינו דרך עמוד{' '}
              <Link href="/contact" className="text-blue-600 hover:underline">צרו קשר</Link>
              {' '}או בדואר אלקטרוני.
            </p>
          </div>
        </div>
      </section>

      {/* Cookies */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">קובצי Cookie</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              אנו משתמשים בקובצי Cookie ו-Local Storage לצרכים הבאים:
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li><strong>Cookie הכרחיים:</strong> לשמירת מצב ההתחברות שלכם</li>
              <li><strong>Cookie פונקציונליים:</strong> לשמירת העדפות (כמו מצב תצוגה)</li>
              <li><strong>Local Storage:</strong> לשמירת מטמון של נתוני משתמש לשיפור ביצועים</li>
            </ul>
            <p>
              ניתן לנהל את הגדרות ה-Cookie בדפדפן שלכם. שימו לב שחסימת Cookie עלולה לפגוע בפונקציונליות האתר.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center text-gray-500 text-sm">
          © 2025-2026 Kibutz. כל הזכויות שמורות.
        </div>
      </section>
    </main>
  );
}
