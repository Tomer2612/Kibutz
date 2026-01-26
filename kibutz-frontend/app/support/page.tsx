'use client';

import { useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

interface FAQ {
  question: string;
  answer: string;
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
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

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

  return (
    <main className="min-h-screen bg-gray-100" dir="rtl">
      <SiteHeader />

      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h1 className="font-semibold text-black" style={{ fontSize: '3.5rem' }}>
          שאלות ותשובות
        </h1>
      </section>

      {/* FAQ Section */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-400 overflow-hidden hover:bg-gray-50 transition"
              style={{ borderRadius: '16px' }}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between text-right px-4 py-4"
              >
                <span className="font-medium text-black">{faq.question}</span>
                <span className={`transform transition-transform duration-300 ${openFaqs.has(index) ? 'rotate-45' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M10 4.16669V15.8334" stroke="#6B7280" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.16669 10H15.8334" stroke="#6B7280" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${openFaqs.has(index) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="pb-4 text-black text-right px-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
