'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaSearch, FaChevronDown, FaCog, FaSignOutAlt, FaUserPlus, FaUserMinus, FaSignInAlt, FaDoorOpen } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [banPopup, setBanPopup] = useState<{ 
    show: boolean; 
    daysLeft: number; 
    managerEmail?: string | null;
    managerName?: string | null;
  } | null>(null);
  const router = useRouter();

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

        // Fetch user memberships
        fetch('http://localhost:4000/communities/user/memberships', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : [])
          .then(data => setUserMemberships(data))
          .catch(console.error);
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

  const handleJoinLeave = async (e: React.MouseEvent, communityId: string, isMember: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setJoiningCommunity(communityId);
    try {
      const endpoint = isMember ? 'leave' : 'join';
      const res = await fetch(`http://localhost:4000/communities/${communityId}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        if (isMember) {
          setUserMemberships(prev => prev.filter(id => id !== communityId));
          // Update member count locally
          setCommunities(prev => prev.map(c => 
            c.id === communityId ? { ...c, memberCount: (c.memberCount || 1) - 1 } : c
          ));
        } else {
          setUserMemberships(prev => [...prev, communityId]);
          // Update member count locally
          setCommunities(prev => prev.map(c => 
            c.id === communityId ? { ...c, memberCount: (c.memberCount || 0) + 1 } : c
          ));
          // Redirect to the community feed after joining
          router.push(`/communities/feed?communityId=${communityId}`);
        }
      } else {
        // Handle ban error
        const error = await res.json();
        if (error.message && error.message.includes('banned')) {
          const match = error.message.match(/(\d+)\s*day/);
          const daysLeft = match ? parseInt(match[1]) : 7;
          
          // Fetch manager info to show contact
          try {
            const managersRes = await fetch(`http://localhost:4000/communities/${communityId}/managers`);
            if (managersRes.ok) {
              const managers = await managersRes.json();
              const owner = managers.find((m: { role: string }) => m.role === 'OWNER');
              const manager = managers.find((m: { role: string }) => m.role === 'MANAGER');
              const contact = owner || manager;
              setBanPopup({ 
                show: true, 
                daysLeft,
                managerEmail: contact?.email || null,
                managerName: contact?.name || null
              });
            } else {
              setBanPopup({ show: true, daysLeft, managerEmail: null, managerName: null });
            }
          } catch {
            setBanPopup({ show: true, daysLeft, managerEmail: null, managerName: null });
          }
        }
      }
    } catch (err) {
      console.error('Failed to join/leave:', err);
    } finally {
      setJoiningCommunity(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
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
              
              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50" dir="rtl">
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
                      onClick={() => {
                        localStorage.removeItem('token');
                        router.push('/');
                        location.reload();
                      }}
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
          filteredCommunities.map((community) => {
            const isMember = userMemberships.includes(community.id) || community.ownerId === userId;
            const isOwner = community.ownerId === userId;
            
            return (
              <div
                key={community.id}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 bg-white text-right transition-all duration-200"
              >
                <Link href={isMember ? `/communities/feed?communityId=${community.id}` : '#'}>
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
                </Link>
                <div className="p-5">
                  <h2 className="font-bold text-lg text-black mb-2">{community.name}</h2>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {community.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>חברים בקהילה</span>
                    <span className="font-semibold text-black">
                      {community.memberCount ?? 0}
                    </span>
                  </div>
                  
                  {/* Join/Leave Button */}
                  {userEmail && (
                    isOwner ? (
                      <Link
                        href={`/communities/${community.id}/manage`}
                        className="w-full py-2 rounded-lg font-semibold text-center block bg-black text-white hover:opacity-90 transition"
                      >
                        נהל קהילה
                      </Link>
                    ) : isMember ? (
                      <div className="flex gap-2">
                        <Link
                          href={`/communities/feed?communityId=${community.id}`}
                          className="flex-1 py-2 rounded-lg font-semibold text-center bg-black text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                        >
                          <FaSignInAlt className="w-4 h-4" />
                          כניסה
                        </Link>
                        <button
                          onClick={(e) => handleJoinLeave(e, community.id, true)}
                          disabled={joiningCommunity === community.id}
                          className="px-4 py-2 rounded-lg font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50 flex items-center gap-1"
                        >
                          <FaDoorOpen className="w-4 h-4" />
                          עזיבה
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleJoinLeave(e, community.id, false)}
                        disabled={joiningCommunity === community.id}
                        className="w-full py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FaUserPlus className="w-4 h-4" />
                        {joiningCommunity === community.id ? 'מצטרף...' : 'הצטרף לקהילה'}
                      </button>
                    )
                  )}
                  {!userEmail && (
                    <Link
                      href="/login"
                      className="w-full py-2 rounded-lg font-semibold text-center block bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                    >
                      התחבר להצטרפות
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">לא נמצאו קהילות בחיפוש</p>
          </div>
        )}
      </div>

      {/* Ban Popup Modal */}
      {banPopup?.show && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setBanPopup(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-8 z-50 max-w-md w-full mx-4 text-center" dir="rtl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">לא ניתן להצטרף לקהילה</h3>
            <p className="text-gray-600 mb-4">
              הפרת את כללי הקהילה והוסרת ממנה.
            </p>
            <p className="text-gray-600 mb-4">
              תצטרך לחכות <span className="font-bold text-red-600">{banPopup.daysLeft} ימים</span> או לפנות למנהל הקהילה.
            </p>
            {banPopup.managerEmail && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                <p className="text-gray-500 mb-1">ליצירת קשר עם מנהל הקהילה:</p>
                <a 
                  href={`mailto:${banPopup.managerEmail}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {banPopup.managerEmail}
                </a>
                {banPopup.managerName && (
                  <p className="text-gray-500 text-xs mt-1">({banPopup.managerName})</p>
                )}
              </div>
            )}
            <button
              onClick={() => setBanPopup(null)}
              className="bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition"
            >
              הבנתי
            </button>
          </div>
        </>
      )}
    </main>
  );
}
