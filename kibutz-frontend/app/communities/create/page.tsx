'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaFileAlt, FaImage, FaTags } from 'react-icons/fa';
import { TopicIcon, COMMUNITY_TOPICS } from '../../lib/topicIcons';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token.split('.').length !== 3) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserEmail(decoded.email);
    } catch (e) {
      console.error('Invalid token:', e);
      router.push('/login');
    }
  }, [router]);

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !topic) {
      setMessage('אנא מלאו את כל השדות החובה');
      setMessageType('error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('topic', topic);
      
      // Get the file input element
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('image', fileInput.files[0]);
      }

      const res = await fetch('http://localhost:4000/communities', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create community');
      }

      const community = await res.json();
      setMessage('הקהילה נוצרה בהצלחה!');
      setMessageType('success');
      setTimeout(() => {
        router.push(`/communities/${community.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Community creation error:', err);
      setMessage(err.message || 'שגיאה ביצירת הקהילה');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    location.reload();
  };

  if (!userEmail) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-300 to-green-100">
        <p>מתחברים...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <Link href="/" className="text-2xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-600">
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            התנתקות
          </button>
        </div>
      </header>

      {/* Form Section */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">צרו קהילה חדשה</h1>
            <p className="text-gray-600">הקימו קהילה עם עניינים משותפים</p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <form
              onSubmit={handleCreateCommunity}
              className="flex-1 bg-white rounded-lg shadow-md p-8 space-y-6"
            >
            {/* Community Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                שם הקהילה *
              </label>
              <div className="relative">
                <FaUsers className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="לדוגמא: יוגה למומחים"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">עד 100 תווים</p>
            </div>

            {/* Community Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                נושא הקהילה *
              </label>
              <div className="flex items-center gap-3">
                {topic && <TopicIcon topic={topic} size="md" />}
                <div className="relative flex-1">
                  <FaTags className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right appearance-none"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      בחרו נושא לקהילה
                    </option>
                    {COMMUNITY_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                תיאור הקהילה *
              </label>
              <div className="relative">
                <FaFileAlt className="absolute right-3 top-4 text-gray-400" />
                <textarea
                  placeholder="תארו את הקהילה, מה הם הנושאים המרכזיים, מי יכול להצטרף..."
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right resize-vertical"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={1000}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/1000 תווים
              </p>
            </div>

            {/* Community Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                תמונת הקהילה (אופציונלי)
              </label>
              <div className="relative">
                <FaImage className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">תמונה בגודל עד 5MB (JPG, PNG, GIF)</p>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  messageType === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <Link
                href="/communities/feed"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ביטול
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'יוצר...' : 'צור קהילה'}
              </button>
            </div>
            </form>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm w-full lg:w-80 lg:self-start lg:flex-none">
              <h3 className="font-bold text-blue-900 mb-2">טיפים ליצירת קהילה מוצלחת:</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-right">
                <li>• בחרו שם מדוייק ומזמין</li>
                <li>• תארו בבירור את מטרת הקהילה</li>
                <li>• עודדו מעורבות ושיח מכבד</li>
                <li>• טפחו תרבות חיובית ושקופה</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
