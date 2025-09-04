'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    } else {
      console.warn('Invalid or missing token.');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-50 text-right font-sans">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <div className="text-2xl font-extrabold font-serif">Kibutz</div>
        {!userEmail ? (
          <a
            href="/login"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            התחבר
          </a>
        ) : (
          <div className="flex gap-4 items-center">
            <span>
              מחובר כ־ <strong>{userEmail}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              התנתקות
            </button>
          </div>
        )}
      </header>

      {/* Title + CTA */}
      <section className="text-center mb-8 mt-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          מאגר הקהילות הגדול בארץ
        </h1>
        <p className="text-gray-600">
          חפשו, הצטרפו או צרו קהילה לפי תחומי עניין.
        </p>
      </section>

      <div className="flex justify-center mb-6">
        <button className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800">
          צרו קהילה משלכם +
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 justify-center mb-10 w-full max-w-4xl mx-auto px-4">
        <input
          type="text"
          placeholder="חפשו קהילה"
          className="p-2 border border-gray-300 rounded flex-grow max-w-[250px] text-right"
        />
        <select defaultValue="" className="p-2 border border-gray-300 rounded min-w-[120px] text-right">
          <option value="" disabled>גודל הקהילה</option>
          <option>קטנה</option>
          <option>בינונית</option>
          <option>גדולה</option>
        </select>
        <select defaultValue="" className="p-2 border border-gray-300 rounded min-w-[140px] text-right">
          <option value="" disabled>נושא הקהילה</option>
          <option>ספורט</option>
          <option>טכנולוגיה</option>
          <option>אוכל</option>
          <option>משחקים</option>
        </select>
        <select defaultValue="" className="p-2 border border-gray-300 rounded min-w-[100px] text-right">
          <option value="" disabled>מחיר</option>
          <option>חינם</option>
          <option>בתשלום</option>
        </select>
      </div>

      {/* Community Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-6xl px-4 mx-auto pb-10">
        <div className="border p-4 rounded shadow bg-white text-right">
          <Image src="/images/yoga.jpeg" alt="יוגה" width={600} height={300} className="w-full h-48 object-cover rounded mb-2" />
          <h2 className="font-bold text-lg mb-1">יוגה ונשימות</h2>
          <p className="text-sm text-gray-700 mb-2">
            כאן נתרגל, נתחזק וננשום יחד. קהילה של אנשים שמשתפים איזון, שלווה וזמן לעצמם.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-blue-600">₪25 לחודש</span>
            <span className="text-gray-500">+50,000 משתמשים</span>
          </div>
        </div>

        <div className="border p-4 rounded shadow bg-white text-right">
          <Image src="/images/controller.jpeg" alt="גיימרים עצבניים" width={600} height={300} className="w-full h-48 object-cover rounded mb-2" />
          <h2 className="font-bold text-lg mb-1">גיימרים עצבניים</h2>
          <p className="text-sm text-gray-700 mb-2">
            קהילת גיימרים לקשוחים בלבד. דיזינג, טורנירים, וכל מה שקשור למקלדות שבורות.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-blue-600">חינם</span>
            <span className="text-gray-500">100,000+ משתמשים</span>
          </div>
        </div>

        <div className="border p-4 rounded shadow bg-white text-right">
          <Image src="/images/cooking.jpeg" alt="אפייה ובישול" width={600} height={300} className="w-full h-48 object-cover rounded mb-2" />
          <h2 className="font-bold text-lg mb-1">אפייה ובישול</h2>
          <p className="text-sm text-gray-700 mb-2">
            קהילה לשפים, חובבים ומקצוענים. משתפים מתכונים, טיפים ותמונות של קינוחים.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-green-600">קהילה חינמית</span>
            <span className="text-gray-500">+50,000 משתמשים</span>
          </div>
        </div>
      </div>
    </main>
  );
}
