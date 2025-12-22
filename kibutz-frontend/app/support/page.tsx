'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { FaPlus, FaCog, FaSignOutAlt, FaEnvelope, FaFacebook, FaInstagram, FaTwitter, FaPaperPlane, FaUser } from 'react-icons/fa';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);
        setContactEmail(decoded.email);
        
        // Fetch user profile
        fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setUserProfile({ name: data.name, profileImage: data.profileImage });
              setContactName(data.name || '');
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
    router.push('/');
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    // Simulate form submission (replace with actual API call if needed)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFormSubmitted(true);
    setFormLoading(false);
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
            תמיכה ושאלות
          </Link>
          
          {!userEmail ? (
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
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
          תמיכה ושאלות
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          יש לכם שאלות? אנחנו כאן לעזור! מצאו תשובות לשאלות נפוצות או פנו אלינו ישירות.
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

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-black text-center mb-8">
          שאלות נפוצות
        </h2>

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

      {/* Contact Section */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-6">צרו קשר</h2>
            
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
                  }}
                  className="mt-4 text-blue-600 hover:underline text-sm"
                >
                  שלח הודעה נוספת
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                    placeholder="השם שלכם"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">נושא</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                    placeholder="במה נוכל לעזור?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">הודעה</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right resize-none"
                    placeholder="פרטו את השאלה או הבעיה..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {formLoading ? 'שולח...' : 'שלח הודעה'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-black mb-6">פרטי התקשרות</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <FaEnvelope className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">אימייל</p>
                    <a href="mailto:support@kibutz.co.il" className="text-black font-medium hover:underline">
                      support@kibutz.co.il
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">עקבו אחרינו</p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition"
                  >
                    <FaFacebook className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-pink-100 hover:text-pink-600 transition"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-400 transition"
                  >
                    <FaTwitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Copyright & Legal Section */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">זכויות יוצרים ותנאי שימוש</h2>
          <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
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
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
            © 2025 Kibutz. כל הזכויות שמורות.
          </div>
        </div>
      </section>
    </main>
  );
}
