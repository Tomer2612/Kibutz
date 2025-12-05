'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { FaCheck, FaPlus, FaCog, FaSignOutAlt } from 'react-icons/fa';

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

interface PricingPlan {
  name: string;
  price: number;
  period: string;
  features: string[];
}

const plan: PricingPlan = {
  name: 'מנוי קהילה',
  price: 99,
  period: 'לחודש',
  features: [
    'קהילה אחת',
    'ללא הגבלת תוכן',
    'ללא הגבלת משתמשים',
    'דומיין מותאם',
    'עמלה 5%',
  ],
};

const faqs: FAQ[] = [
  {
    question: 'האם אפשר לפתוח יותר מקהילה אחת?',
    answer: 'כן, ניתן לפתוח מספר קהילות ללא הגבלה. כל קהילה מנוהלת בנפרד עם הגדרות ייחודיות משלה.',
  },
  {
    question: 'יש הגבלה על קורסים, וידאו או תכנים?',
    answer: 'לא, אין הגבלה על כמות התכנים שניתן להעלות. תוכלו להעלות קורסים, סרטונים ותכנים ללא הגבלה.',
  },
  {
    question: 'יש מגבלה על מספר החברים בקהילה?',
    answer: 'אין מגבלה על כמות החברים, הקהילה יכולה לגדול בלי לחשוב על תקרות או מדרגות תמחור.',
  },
  {
    question: 'האם אפשר דומיין מותאם אישית?',
    answer: 'כן, ניתן לחבר דומיין מותאם אישית לקהילה שלכם כדי לשמור על המותג שלכם.',
  },
  {
    question: 'מה העמלה על עסקאות?',
    answer: 'העמלה על עסקאות היא 5% בלבד מכל תשלום שמתקבל דרך הפלטפורמה.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        
        // Fetch user profile
        fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setUserProfile({ name: data.name, profileImage: data.profileImage });
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
    setUserEmail(null);
    setUserProfile(null);
    setProfileMenuOpen(false);
  };

  const handleCreateCommunity = () => {
    if (userEmail) {
      router.push('/communities/create');
    } else {
      router.push('/signup');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/pricing" className="text-black font-medium transition text-sm">
            מחירון
          </Link>
          <Link href="/support" className="text-gray-600 hover:text-black transition text-sm font-medium">
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
                  <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
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
          מחיר אחד. בלי הפתעות.
        </h1>
        <p className="text-gray-600 text-lg">
          פותחים קהילה ומתחילים בלי לחשוב על עלויות נוספות.
        </p>
      </section>

      {/* Pricing Card */}
      <section className="flex justify-center px-4 pb-16">
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center flex flex-col"
          style={{ width: '300px', minHeight: '380px' }}
        >
          {/* Plan Name */}
          <h3 className="text-xl font-bold text-black mb-4">{plan.name}</h3>
          
          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-black">{plan.price}</span>
              <span className="text-gray-600 text-sm">₪/{plan.period}</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8 text-right flex-1">
            {plan.features.map((feature, fIndex) => (
              <div key={fIndex} className="flex items-center gap-2">
                <div 
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#E9FCC5' }}
                >
                  <FaCheck 
                    style={{ 
                      color: '#365908',
                      width: '10px',
                      height: '8px'
                    }} 
                  />
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCreateCommunity}
            className="block w-full bg-black text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            יצירת קהילה
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-black text-center mb-8">
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
    </main>
  );
}
