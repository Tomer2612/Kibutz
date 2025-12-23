'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import NotificationBell from '../components/NotificationBell';
import { FaCheck, FaPlus, FaCog, FaSignOutAlt, FaUser, FaTimes, FaCreditCard, FaCalendarAlt, FaLock } from 'react-icons/fa';

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

const COMMUNITY_TOPICS = [
  'אנימציה',
  'אוכל, בישול ותזונה',
  'עזרה ותמיכה',
  'עיצוב גרפי',
  'עיצוב מותגים',
  'עריכת וידאו',
  'בריאות הנפש ופיתוח אישי',
  'גיימינג',
  'טיולים ולייףסטייל',
  'לימודים ואקדמיה',
  'מדיה, קולנוע וסדרות',
  'מדיה חברתית ותוכן ויזואלי',
  'ניהול פיננסי והשקעות',
  'ספרים וכתיבה',
  'ספורט ואורח חיים פעיל',
  'תחביבים',
  'יזמות ועסקים עצמאיים',
];

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
  const searchParams = useSearchParams();
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Flow states - 'create' is first popup (name+category), then 'payment'
  const [currentStep, setCurrentStep] = useState<'pricing' | 'create' | 'payment'>('pricing');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [communityTopic, setCommunityTopic] = useState('');
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  // Check for step parameter on mount (from signup redirect)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'create') {
      setCurrentStep('create');
    }
  }, [searchParams]);

  useEffect(() => {
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
    router.push('/');
  };

  const handleSelectPlan = () => {
    if (!userEmail) {
      // Not logged in - redirect to signup with createCommunity flag
      router.push('/signup?createCommunity=true');
    } else {
      // Logged in - go to create step first (community details)
      setCurrentStep('create');
    }
  };

  const handleContinueToPayment = () => {
    // After entering community details, go to payment
    if (!communityName.trim()) return;
    setCurrentStep('payment');
  };

  const handlePaymentAndCreate = async () => {
    // Create community and save payment info
    if (!communityName.trim()) return;
    
    setCreatingCommunity(true);
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('name', communityName);
      formData.append('description', `קהילת ${communityName}`);
      if (communityTopic) formData.append('topic', communityTopic);
      
      const res = await fetch('http://localhost:4000/communities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (res.ok) {
        const newCommunity = await res.json();
        
        // Save credit card info to the new community
        const lastFour = cardNumber.slice(-4);
        await fetch(`http://localhost:4000/communities/${newCommunity.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            cardLastFour: lastFour,
            cardBrand: 'Visa',
          }),
        });
        
        // Also save to user payment methods
        await fetch('http://localhost:4000/users/me/payment-methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            cardLastFour: lastFour,
            cardBrand: 'Visa',
          }),
        });
        
        router.push(`/communities/feed?communityId=${newCommunity.id}`);
      }
    } catch (err) {
      console.error('Failed to create community:', err);
    } finally {
      setCreatingCommunity(false);
    }
  };

  // Step 1: Create Community Details Modal (name + category)
  if (currentStep === 'create') {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2">פרטי הקהילה</h2>
          <p className="text-center text-gray-500 mb-8">אפשר לערוך ולשנות את הכל גם אחרי ההקמה.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">שם הקהילה</label>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">קטגוריה</label>
              <select
                value={communityTopic}
                onChange={(e) => setCommunityTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">בחר קטגוריה</option>
                {COMMUNITY_TOPICS.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleContinueToPayment}
            disabled={!communityName.trim()}
            className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            המשך
          </button>
        </div>
      </main>
    );
  }

  // Card validation helpers
  const getCardNumberError = () => {
    if (cardNumber.length === 0) return null;
    if (cardNumber.length < 16) return `חסרות ${16 - cardNumber.length} ספרות`;
    return null;
  };

  const getExpiryError = () => {
    if (cardExpiry.length === 0) return null;
    if (cardExpiry.length < 5) return 'פורמט: MM/YY';
    
    // Parse and validate expiry date
    const [monthStr, yearStr] = cardExpiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt('20' + yearStr, 10);
    
    if (month < 1 || month > 12) return 'חודש לא תקין';
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'כרטיס פג תוקף';
    }
    
    return null;
  };

  const getCvvError = () => {
    if (cardCvv.length === 0) return null;
    if (cardCvv.length < 3) return `חסרות ${3 - cardCvv.length} ספרות`;
    return null;
  };

  const isPaymentValid = cardNumber.length === 16 && 
                         cardExpiry.length === 5 && 
                         !getExpiryError() && 
                         cardCvv.length === 3;

  // Step 2: Payment Modal
  if (currentStep === 'payment') {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-8">מתחילים 7 ימי ניסיון חינם</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">מספר כרטיס</label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                    getCardNumberError() ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <FaCreditCard className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {getCardNumberError() && (
                <p className="text-red-500 text-sm mt-1">{getCardNumberError()}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">תוקף</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                      setCardExpiry(val);
                    }}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                      getExpiryError() ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  <FaCalendarAlt className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {getExpiryError() && (
                  <p className="text-red-500 text-sm mt-1">{getExpiryError()}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">CVV</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                      getCvvError() ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  <FaLock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                {getCvvError() && (
                  <p className="text-red-500 text-sm mt-1">{getCvvError()}</p>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handlePaymentAndCreate}
            disabled={!isPaymentValid || creatingCommunity}
            className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {creatingCommunity ? 'מקים קהילה...' : 'הקמת קהילה'}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            תזכורת תשלח במייל 3 ימים לפני סיום הניסיון. אפשר<br />
            לבטל בקליק דרך הגדרות הקהילה.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
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
            onClick={handleSelectPlan}
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
