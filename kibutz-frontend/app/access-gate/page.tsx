'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessGatePage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/access-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Refresh the page to let middleware check the new cookie
        router.refresh();
        window.location.href = '/';
      } else {
        setError('קוד גישה שגוי');
      }
    } catch {
      setError('שגיאה בבדיקת הקוד');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ backgroundColor: '#F4F4F5' }}>
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 flex flex-col items-center text-center"
          style={{ border: '1px solid #D0D0D4' }}
        >
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#A7EA7B' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="black" strokeWidth="2"/>
              <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 className="font-semibold text-black" style={{ fontSize: '28px' }}>גישה מוגבלת</h1>
          
          <p className="text-black" style={{ fontSize: '16px', marginTop: '8px', marginBottom: '24px' }}>
            האתר בשלבי פיתוח. הזן קוד גישה להמשך.
          </p>

          <input
            type="password"
            placeholder="קוד גישה"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-center text-lg"
            style={{ borderColor: error ? '#B3261E' : '#D0D0D4' }}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            autoFocus
          />

          {error && (
            <p className="text-sm mt-2" style={{ color: '#B3261E' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-black text-white py-3 transition-colors disabled:cursor-not-allowed mt-4"
            style={{ borderRadius: '12px', fontSize: '18px', backgroundColor: (loading || !password) ? '#D0D0D4' : 'black' }}
            onMouseEnter={(e) => !(loading || !password) && (e.currentTarget.style.backgroundColor = '#3F3F46')}
            onMouseLeave={(e) => !(loading || !password) && (e.currentTarget.style.backgroundColor = 'black')}
          >
            {loading ? 'בודק...' : 'כניסה'}
          </button>
        </form>
      </div>
    </main>
  );
}
