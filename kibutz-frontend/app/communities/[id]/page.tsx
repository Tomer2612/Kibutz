'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUserPlus, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

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

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
    name: string;
  };
}

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  ownerId: string;
  createdAt: string;
  topic?: string | null;
  memberCount?: number | null;
}

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  // Fetch community details
  useEffect(() => {
    if (!communityId) return;

    const fetchCommunity = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/communities/${communityId}`);
        if (!res.ok) throw new Error('Failed to fetch community');
        const data = await res.json();
        setCommunity(data);
        setEditName(data.name);
        setEditDescription(data.description);
        setEditTopic(data.topic || '');
        setError(null);
      } catch (err) {
        console.error('Error fetching community:', err);
        setError('שגיאה בטעינת הקהילה');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId]);

  // Handle create post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPostContent.trim()) {
      alert('אנא הזינו תוכן לפוסט');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו כדי לפרסם פוסט');
      return;
    }

    try {
      setSubmittingPost(true);
      const res = await fetch(`http://localhost:4000/posts/${communityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newPostContent }),
      });

      if (!res.ok) throw new Error('Failed to create post');

      const newPost = await res.json();
      setPosts([newPost, ...posts]);
      setNewPostContent('');
    } catch (err) {
      console.error('Error creating post:', err);
      alert('שגיאה בפרסום הפוסט');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleUpdateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו');
      return;
    }

    try {
      setStatusMessage(null);
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('description', editDescription);
      if (editTopic) {
        formData.append('topic', editTopic);
      }

      const res = await fetch(`http://localhost:4000/communities/${communityId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update community');
      }

      const updated = await res.json();
      setCommunity(updated);
      setIsEditing(false);
      setStatusType('success');
      setStatusMessage('הקהילה עודכנה בהצלחה');
    } catch (err) {
      console.error('Update error:', err);
      const message = err instanceof Error ? err.message : 'שגיאה בעדכון הקהילה';
      setStatusType('error');
      setStatusMessage(message);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('האם אתם בטוחים שברצונכם למחוק את הקהילה?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/communities/${communityId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Delete response:', data);
        throw new Error(data.message || 'Failed to delete community');
      }

      router.push('/communities/feed');
    } catch (err) {
      console.error('Error deleting community:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה במחיקת הקהילה';
      alert(`שגיאה במחיקת הקהילה: ${errorMessage}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    location.reload();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 text-right">
        <header dir="rtl" className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <Link
            href="/communities/feed"
            className="text-sm font-semibold text-gray-600 hover:text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            כל הקהילות
          </Link>
        </header>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500 text-lg">טוען קהילה...</p>
        </div>
      </main>
    );
  }

  if (error || !community) {
    return (
      <main className="min-h-screen bg-gray-100 text-right">
        <header dir="rtl" className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <Link
            href="/communities/feed"
            className="text-sm font-semibold text-gray-600 hover:text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            כל הקהילות
          </Link>
        </header>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-red-600 text-lg">{error || 'קהילה לא נמצאה'}</p>
        </div>
      </main>
    );
  }

  const isOwner = userId && (community as any).ownerId === userId;

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
        <Link href="/" className="text-2xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex gap-3 items-center">
          <Link
            href="/communities/feed"
            className="text-sm font-semibold text-gray-600 hover:text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            כל הקהילות
          </Link>
          {!userEmail ? (
            <a
              href="/login"
              className="bg-black text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
            >
              התחבר
            </a>
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

      {/* Community Header */}
      <section className="w-full max-w-5xl mx-auto mt-12 px-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Community Image */}
            {community.image ? (
              <img
                src={`http://localhost:4000${community.image}`}
                alt={community.name}
                className="w-full md:w-56 h-56 object-cover rounded-xl flex-shrink-0"
              />
            ) : (
              <div className="w-full md:w-56 h-56 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 text-center font-medium">תמונת קהילה</span>
              </div>
            )}

            {/* Community Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-black">{community.name}</h1>
                {community.topic && (
                  <span className="inline-flex items-center justify-center self-start text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                    {community.topic}
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">{community.description}</p>
              <div className="text-sm text-gray-500 flex flex-col gap-1">
                <span>נוצרה ב־{new Date(community.createdAt).toLocaleDateString('he-IL')}</span>
                <span>חברים בקהילה: {community.memberCount ?? 1}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {userEmail && !isOwner && (
                  <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 flex items-center gap-2 transition">
                    <FaUserPlus className="text-sm" />
                    הצטרף לקהילה
                  </button>
                )}
                {isOwner && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setIsEditing((prev) => !prev)}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaEdit className="text-sm" />
                      {isEditing ? 'בטל עריכה' : 'עריכת הקהילה'}
                    </button>
                    <button
                      onClick={handleDeleteCommunity}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
                    >
                      <FaTrash className="text-sm" />
                      מחיקת הקהילה
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isOwner && isEditing && (
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="text-xl font-semibold mb-6">עדכון פרטי הקהילה</h3>
              <form onSubmit={handleUpdateCommunity} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם הקהילה</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">נושא הקהילה</label>
                  <select
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right appearance-none"
                  >
                    <option value="">בחרו נושא</option>
                    {COMMUNITY_TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right resize-vertical"
                    rows={5}
                    maxLength={1000}
                    required
                  />
                </div>
                {statusMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      statusType === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {statusMessage}
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:opacity-90"
                  >
                    עדכנו את הקהילה
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Create Post Section */}
      {userEmail && (
        <section className="w-full max-w-5xl mx-auto mt-10 px-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-6">פרסמו פוסט חדש</h2>
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="כתבו משהו לקהילה..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-right resize-none text-lg"
                rows={5}
              />
              <div className="flex justify-end mt-4 gap-3">
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition"
                >
                  <FaPlus className="text-sm" />
                  {submittingPost ? 'שולח...' : 'פרסם'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Posts Section */}
      <section className="w-full max-w-5xl mx-auto py-12 px-8">
        <h2 className="text-3xl font-bold text-black mb-8">פוסטים בקהילה</h2>
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-black">{post.author.name}</p>
                      <p className="text-sm text-gray-500">{post.author.email}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('he-IL')}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <p className="text-gray-600 text-lg mb-2">עדיין אין פוסטים בקהילה זו</p>
              {userEmail && (
                <p className="text-sm text-gray-500">אתם יכולים להיות הראשונים לפרסם!</p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
