'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { TopicIcon } from '../../../lib/topicIcons';

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  ownerId: string;
  createdAt: string;
  topic?: string | null;
  memberCount?: number | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export default function CommunityAboutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get('communityId');

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
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
    }
  }, []);

  useEffect(() => {
    const fetchCommunity = async () => {
      if (!communityId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/communities/${communityId}`);
        if (!res.ok) throw new Error('Failed to fetch community');
        const data = await res.json();
        setCommunity(data);
      } catch (err) {
        console.error('Error fetching community:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] text-right">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500 text-lg">טוען...</p>
        </div>
      </main>
    );
  }

  if (!community) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] text-right">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500 text-lg">קהילה לא נמצאה</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <div className="flex items-center gap-2">
            <TopicIcon topic={community.topic} size="md" />
            <span className="font-medium text-black">{community.name}</span>
          </div>
        </div>

        <Link
          href={`/communities/feed?communityId=${communityId}`}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition"
        >
          <span className="text-sm">חזרה לפיד</span>
          <FaArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Community Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          {/* Cover Image */}
          {community.image ? (
            <img
              src={`http://localhost:4000${community.image}`}
              alt={community.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
              <TopicIcon topic={community.topic} size="lg" />
            </div>
          )}

          {/* Community Info */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black mb-2">{community.name}</h1>
                {community.topic && (
                  <span className="inline-flex items-center text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                    {community.topic}
                  </span>
                )}
              </div>
              <TopicIcon topic={community.topic} size="lg" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <FaUsers className="w-4 h-4" />
                <span>{community.memberCount || 1} חברים</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4" />
                <span>נוצרה ב־{new Date(community.createdAt).toLocaleDateString('he-IL')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">אודות הקהילה</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {community.description}
          </p>
        </div>

        {/* Community Rules */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">כללי הקהילה</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span>לדבר בנימוס, בלי שיימינג או פרסום אגרסיבי.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span>לפרסם תוכן רלוונטי לנושא הקהילה.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span>לענות לשאלות של חברים חדשים ולעזור אחד לשני.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <span>לא לפרסם ספאם או תכנים פוגעניים.</span>
            </li>
          </ul>
        </div>

        {/* Back to Feed Button */}
        <div className="text-center">
          <Link
            href={`/communities/feed?communityId=${communityId}`}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            <FaArrowRight className="w-4 h-4" />
            חזרה לפיד הקהילה
          </Link>
        </div>
      </div>
    </main>
  );
}
