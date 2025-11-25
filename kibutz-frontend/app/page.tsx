'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaSearch, FaChevronDown } from 'react-icons/fa';

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

const COMMUNITY_SIZES = [
  { value: 'small', label: 'קטנה (1-100)' },
  { value: 'medium', label: 'בינונית (101-300)' },
  { value: 'large', label: 'גדולה (300+)' },
];

const getSizeCategory = (memberCount?: number | null) => {
  if (memberCount && memberCount >= 300) return 'large';
  if (memberCount && memberCount >= 101) return 'medium';
  return 'small';
};

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  ownerId: string;
  createdAt: string;
  topic?: string | null;
  memberCount?: number | null;
  _count?: {
    posts: number;
  };
}

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:4000/communities');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCommunities(data);
        setFilteredCommunities(data);
      } catch (err) {
        console.error('Error fetching communities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  // Filter communities
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = communities.filter((community) => {
      const matchesSearch =
        term === ''
          ? true
          : community.name.toLowerCase().includes(term) ||
            community.description.toLowerCase().includes(term);

      const matchesTopic = selectedTopic ? community.topic === selectedTopic : true;
      const matchesSize = selectedSize
        ? getSizeCategory(community.memberCount ?? null) === selectedSize
        : true;

      return matchesSearch && matchesTopic && matchesSize;
    });

    setFilteredCommunities(filtered);
  }, [searchTerm, communities, selectedTopic, selectedSize]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <Link href="/" className="text-2xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex gap-3 items-center">
          {!userEmail ? (
            <>
              <a
                href="/login"
                className="border border-black text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-black hover:text-white transition"
              >
                כניסה
              </a>
              <a
                href="/signup"
                className="bg-black text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
              >
                הרשמה
              </a>
            </>
          ) : (
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
          )}
        </div>
      </header>

      {/* Title + CTA */}
      <section className="text-center mb-8 mt-12">
        <h1 className="text-5xl font-bold text-black mb-3">
          מאגר קהילות הגדול בארץ
        </h1>
        <p className="text-gray-600 text-lg">
          חפשו, הצטרפו או צרו קהילה לפי תחומי עניין.
        </p>
      </section>

      <div className="flex justify-center mb-10">
        {userEmail ? (
          <Link
            href="/communities/create"
            className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition text-lg flex flex-row-reverse items-center gap-2"
          >
            <span className="inline-flex items-center justify-center text-xl leading-none">+</span>
            צרו קהילה משלכם
          </Link>
        ) : (
          <Link
            href="/signup"
            className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition text-lg flex flex-row-reverse items-center gap-2"
          >
            <span className="inline-flex items-center justify-center text-xl leading-none">+</span>
            צרו קהילה משלכם
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-center mb-12 w-full max-w-5xl mx-auto px-4">
        <div className="relative flex-grow max-w-xs">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="חפשו קהילה"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg text-right placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="w-0.5 h-10 bg-gray-300 rounded-full"></div>

        <div className="relative">
          <FaChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select defaultValue="" className="p-3 pr-10 pl-10 border border-gray-300 rounded-lg min-w-32 text-right focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white">
            <option value="" disabled>מחיר</option>
            <option>חינם</option>
            <option>בתשלום</option>
          </select>
        </div>
        <div className="relative">
          <FaChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="p-3 pr-10 pl-10 border border-gray-300 rounded-lg min-w-32 text-right focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
          >
            <option value="">כל הנושאים</option>
            {COMMUNITY_TOPICS.map((topicOption) => (
              <option key={topicOption} value={topicOption}>
                {topicOption}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <FaChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="p-3 pr-10 pl-10 border border-gray-300 rounded-lg min-w-32 text-right focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
          >
            <option value="">כל הגדלים</option>
            {COMMUNITY_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Community Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4 mx-auto pb-16">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">טוען קהילות...</p>
          </div>
        ) : filteredCommunities.length > 0 ? (
          filteredCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/feed?communityId=${community.id}`}
              className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 bg-white text-right transition-all duration-200"
            >
              {community.image ? (
                <img
                  src={`http://localhost:4000${community.image}`}
                  alt={community.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <span className="text-gray-400 font-medium">תמונת קהילה</span>
                </div>
              )}
              <div className="p-5">
                <h2 className="font-bold text-lg text-black mb-2">{community.name}</h2>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {community.description}
                </p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>חברים בקהילה</span>
                  <span className="font-semibold text-black">
                    {community.memberCount ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">לא נמצאו קהילות בחיפוש</p>
          </div>
        )}
      </div>
    </main>
  );
}
