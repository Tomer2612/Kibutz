'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaSearch, FaChevronDown, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import NotificationBell from './components/NotificationBell';

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

// Topic color mapping - synced with topicIcons.tsx colors
const TOPIC_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'אנימציה': { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
  'אוכל, בישול ותזונה': { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  'עזרה ותמיכה': { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
  'עיצוב גרפי': { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  'עיצוב מותגים': { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
  'עריכת וידאו': { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  'בריאות הנפש ופיתוח אישי': { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  'גיימינג': { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  'טיולים ולייףסטייל': { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
  'לימודים ואקדמיה': { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  'מדיה, קולנוע וסדרות': { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  'מדיה חברתית ותוכן ויזואלי': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
  'ניהול פיננסי והשקעות': { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  'ספרים וכתיבה': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  'ספורט ואורח חיים פעיל': { bg: 'bg-lime-100', text: 'text-lime-600', border: 'border-lime-200' },
  'תחביבים': { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
  'יזמות ועסקים עצמאיים': { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
};

const getTopicColor = (topic: string) => {
  return TOPIC_COLORS[topic] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
};

// Helper function to get visible page numbers (max 10, sliding window)
const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  const maxVisible = 10;
  let start = 1;
  let end = Math.min(totalPages, maxVisible);
  
  if (totalPages > maxVisible) {
    const halfWindow = Math.floor(maxVisible / 2);
    start = Math.max(1, currentPage - halfWindow);
    end = start + maxVisible - 1;
    
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
  }
  
  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
};

const COMMUNITY_SIZES = [
  { value: 'small', label: 'קטנה (0-100)' },
  { value: 'medium', label: 'בינונית (100+)' },
  { value: 'large', label: 'גדולה (1,000+)' },
];

const getSizeCategory = (memberCount?: number | null) => {
  if (memberCount && memberCount >= 1000) return 'large';
  if (memberCount && memberCount >= 100) return 'medium';
  return 'small';
};

interface Community {
  id: string;
  name: string;
  slug?: string | null;
  description: string;
  image?: string | null;
  logo?: string | null;
  ownerId: string;
  createdAt: string;
  topic?: string | null;
  memberCount?: number | null;
  price?: number | null;
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
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const communitiesPerPage = 9;

  useEffect(() => {
    setMounted(true);
    
    // Read cached profile immediately
    const cached = localStorage.getItem('userProfileCache');
    if (cached) {
      try { setUserProfile(JSON.parse(cached)); } catch {}
    }
    
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);
        
        // Fetch user profile
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              const profile = { name: data.name, profileImage: data.profileImage };
              setUserProfile(profile);
              localStorage.setItem('userProfileCache', JSON.stringify(profile));
            }
          })
          .catch(console.error);

        // Fetch user memberships
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/user/memberships`, {
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        // Sort by oldest first (ascending by createdAt)
        const sorted = data.sort((a: Community, b: Community) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setCommunities(sorted);
        setFilteredCommunities(sorted);
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
      
      const matchesPrice = (() => {
        if (!selectedPrice) return true;
        const price = community.price ?? 0;
        if (selectedPrice === 'free') return price === 0;
        if (selectedPrice === 'low') return price >= 1 && price <= 50;
        if (selectedPrice === 'high') return price > 50;
        return true;
      })();

      return matchesSearch && matchesTopic && matchesSize && matchesPrice;
    });

    setFilteredCommunities(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, communities, selectedTopic, selectedSize, selectedPrice]);

  const handleCardClick = (community: Community) => {
    if (!userEmail) {
      // Not logged in - go to preview page (will redirect to login if needed)
      router.push(`/communities/${community.id}/preview`);
      return;
    }
    
    const isMember = userMemberships.includes(community.id) || community.ownerId === userId;
    
    if (isMember) {
      // Member/Owner - go to feed
      router.push(`/communities/${community.slug || community.id}/feed`);
    } else {
      // Logged in but not a member - go to preview page to join
      router.push(`/communities/${community.id}/preview`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfileCache');
    router.push('/');
    location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex gap-6 items-center">
          {/* Nav Links */}
          <Link href="/pricing" className="text-gray-600 hover:text-black transition text-sm font-medium">
            מחירון
          </Link>
          <Link href="/support" className="text-gray-600 hover:text-black transition text-sm font-medium">
            שאלות ותשובות
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-black transition text-sm font-medium">
            צרו קשר
          </Link>
          <Link href="/terms" className="text-gray-600 hover:text-black transition text-sm font-medium">
            תנאי שימוש
          </Link>
          <Link href="/privacy" className="text-gray-600 hover:text-black transition text-sm font-medium">
            מדיניות פרטיות
          </Link>
          
          {!mounted ? (
            <div className="w-10 h-10" /> /* Placeholder during SSR */
          ) : !userEmail ? (
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
              {/* Notification Bell */}
              <NotificationBell />
              
              <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="relative focus:outline-none"
              >
                {userProfile?.profileImage ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${userProfile.profileImage}`}
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
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userProfileCache');
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
            </div>
          )}
        </div>
      </header>

      {/* Title + CTA */}
      <section className="text-center mb-8 mt-12">
        <h1 className="text-5xl font-bold text-black mb-3">
          מאגר הקהילות הגדול בארץ
        </h1>
        <p className="text-gray-600 text-lg">
          חפשו, הצטרפו או צרו קהילה לפי תחומי עניין.
        </p>
      </section>

      <div className="flex justify-center mb-10">
        {userEmail ? (
          <Link
            href="/pricing"
            className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition text-lg flex flex-row-reverse items-center gap-2"
          >
            <span className="inline-flex items-center justify-center text-xl leading-none">+</span>
            צרו קהילה משלכם
          </Link>
        ) : (
          <Link
            href="/signup?createCommunity=true"
            className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition text-lg flex flex-row-reverse items-center gap-2"
          >
            <span className="inline-flex items-center justify-center text-xl leading-none">+</span>
            צרו קהילה משלכם
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-center mb-6 w-full max-w-5xl mx-auto px-4">
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
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="p-3 pr-10 pl-10 border border-gray-300 rounded-lg min-w-32 text-right focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
          >
            <option value="">כל המחירים</option>
            <option value="free">חינם</option>
            <option value="low">₪1-50</option>
            <option value="high">₪51-100</option>
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

      {/* Active filters indicator */}
      {(searchTerm || selectedTopic || selectedSize || selectedPrice) && (
        <div className="flex justify-center gap-2 mb-6">
          <span className="text-sm text-gray-500">
            מציג {filteredCommunities.length} מתוך {communities.length} קהילות
          </span>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTopic('');
              setSelectedSize('');
              setSelectedPrice('');
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            נקה סינון
          </button>
        </div>
      )}

      {/* Community Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4 mx-auto pb-8">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">טוען קהילות...</p>
          </div>
        ) : filteredCommunities.length > 0 ? (
          filteredCommunities
            .slice((currentPage - 1) * communitiesPerPage, currentPage * communitiesPerPage)
            .map((community) => {
            // Format member count: under 100 show exact, 100+ show +100, 1000+ show +1,000, etc
            const formatMemberCount = (count: number) => {
              if (count >= 10000) {
                return `${(count / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}K+`;
              }
              if (count >= 1000) {
                return `${(count / 1000).toFixed(1).replace('.0', '')}K+`;
              }
              if (count >= 100) {
                // Round down to nearest 100 and show with +
                const rounded = Math.floor(count / 100) * 100;
                return `${rounded.toLocaleString()}+`;
              }
              return count.toString();
            };
            
            return (
              <div
                key={community.id}
                onClick={() => handleCardClick(community)}
                className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl bg-white transition-all duration-200 cursor-pointer"
              >
                {community.image ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${community.image}`}
                    alt={community.name}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <span className="text-gray-400 font-medium">תמונת קהילה</span>
                  </div>
                )}
                <div className="p-5 text-right" dir="rtl">
                  <div className="flex items-start gap-3 mb-2">
                    {community.logo ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${community.logo}`}
                        alt={community.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-lg font-bold">{community.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-xl text-black">{community.name}</h2>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {community.description}
                  </p>
                  
                  {/* Separator line */}
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  {/* Topic + Member count + Price badges - all on same line */}
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    {/* Topic badge */}
                    {community.topic && (() => {
                      const colors = getTopicColor(community.topic);
                      return (
                        <span className={`${colors.bg} ${colors.text} px-3 py-1.5 rounded-full text-sm font-medium border ${colors.border}`}>
                          {community.topic}
                        </span>
                      );
                    })()}
                    
                    {/* Member count badge */}
                    <span 
                      className="px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ backgroundColor: '#F4F4F5', color: '#52525B' }}
                    >
                      {(community.memberCount ?? 0) === 1 
                        ? 'משתמש אחד' 
                        : (community.memberCount ?? 0) < 100
                          ? `${community.memberCount} משתמשים`
                          : `${formatMemberCount(community.memberCount ?? 0)}+ משתמשים`}
                    </span>
                    
                    {/* Free/Paid badge */}
                    {(community.price ?? 0) === 0 ? (
                      <span 
                        className="px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#E9FCC5', color: '#365908' }}
                      >
                        חינם
                      </span>
                    ) : (
                      <span 
                        className="px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#DCF1FE', color: '#02527D' }}
                      >
                        ₪{community.price} לחודש
                      </span>
                    )}
                  </div>
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

      {/* Pagination */}
      {!loading && filteredCommunities.length > communitiesPerPage && (() => {
        const totalPages = Math.ceil(filteredCommunities.length / communitiesPerPage);
        const visiblePages = getVisiblePages(currentPage, totalPages);
        return (
          <div className="flex items-center justify-center gap-2 pb-16">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`text-2xl transition ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
            >
              &lt;
            </button>
            {visiblePages.map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                  page === currentPage
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`text-2xl transition ${currentPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
            >
              &gt;
            </button>
          </div>
        );
      })()}
    </main>
  );
}
