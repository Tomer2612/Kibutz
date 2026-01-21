'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUsers, FaMapMarkerAlt, FaCalendarAlt, FaSignInAlt, FaClock, FaCamera } from 'react-icons/fa';
import SiteHeader from '../../components/SiteHeader';
import ChevronLeftIcon from '../../components/ChevronLeftIcon';
import ChevronRightIcon from '../../components/ChevronRightIcon';

// Topic color mapping - synced with homepage
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

const formatMemberCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}K+`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K+`;
  }
  if (count >= 100) {
    const rounded = Math.floor(count / 100) * 100;
    return `${rounded.toLocaleString()}+`;
  }
  return count.toString();
};

// Helper function to get visible page numbers (max 10, sliding window)
const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  const maxVisible = 10;
  let start = 1;
  let end = Math.min(totalPages, maxVisible);
  
  if (totalPages > maxVisible) {
    // Center the current page in the window when possible
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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  location?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
  showOnline?: boolean;
}

interface Community {
  id: string;
  name: string;
  slug?: string | null;
  description: string;
  image?: string | null;
  logo?: string | null;
  memberCount?: number | null;
  price?: number | null;
  topic?: string | null;
  createdAt?: string;
}

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [memberCommunities, setMemberCommunities] = useState<Community[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'member'>('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<{ followers: number; following: number; communityMembers: number }>({
    followers: 0,
    following: 0,
    communityMembers: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Pagination state for communities
  const [createdPage, setCreatedPage] = useState(1);
  const [memberPage, setMemberPage] = useState(1);
  const communitiesPerPage = 3;

  // Current user state (for checking if viewing own profile)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Fetch current user ID to check if viewing own profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setCurrentUserId(data.userId);
          }
        })
        .catch(console.error);
    }
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');

        // Fetch all data in parallel for faster loading
        const [profileRes, createdRes, memberRes, statsRes, isFollowingRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/communities/created`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/communities/member`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/stats`),
          token 
            ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/is-following`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
        ]);

        if (!profileRes.ok) {
          if (profileRes.status === 404) {
            setError('המשתמש לא נמצא');
          } else {
            throw new Error('Failed to fetch profile');
          }
          return;
        }
        
        const profileData = await profileRes.json();
        setProfile(profileData);

        if (createdRes.ok) {
          const createdData = await createdRes.json();
          setCreatedCommunities(createdData);
        }

        if (memberRes.ok) {
          const memberData = await memberRes.json();
          setMemberCommunities(memberData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (isFollowingRes && isFollowingRes.ok) {
          const isFollowingData = await isFollowingRes.json();
          setIsFollowing(isFollowingData.isFollowing);
        }

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('שגיאה בטעינת הפרופיל');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const formatUsername = (email: string) => {
    return email.split('@')[0] + '@';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleFollowToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
        setStats(prev => ({
          ...prev,
          followers: isFollowing ? prev.followers - 1 : prev.followers + 1,
        }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Use global chat widget
    if ((window as any).openChatWithUser && profile) {
      (window as any).openChatWithUser(userId, profile.name, profile.profileImage);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/" className="text-black font-semibold hover:underline">
            חזרה לעמוד הראשי
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <SiteHeader />

      {/* Profile Cover Image - Bigger and customizable */}
      <div className="w-full h-64 relative z-0">
        {profile?.coverImage ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${profile.coverImage}`}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-l from-cyan-200 via-teal-100 to-blue-200"></div>
        )}
        
        {/* Edit Cover Button - Only show for own profile */}
        {currentUserId === userId && (
          <label className="absolute bottom-4 left-4 bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-lg font-medium cursor-pointer transition flex items-center gap-2 shadow-md">
            <FaCamera className="w-4 h-4" />
            <span>{uploadingCover ? 'מעלה...' : 'עריכת כיסוי'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingCover}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const token = localStorage.getItem('token');
                if (!token) return;
                
                setUploadingCover(true);
                try {
                  const formData = new FormData();
                  formData.append('coverImage', file);
                  
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    setProfile(prev => prev ? { ...prev, coverImage: data.coverImage } : prev);
                  }
                } catch (err) {
                  console.error('Error uploading cover:', err);
                } finally {
                  setUploadingCover(false);
                }
              }}
            />
          </label>
        )}
      </div>

      {/* Main Content - Full width */}
      <div className="w-full px-8 relative z-10">
        {/* Profile Section - Two columns: Left side (profile info) + Right side (stats & buttons) */}
        <div className="flex justify-between items-start -mt-20 pb-6 relative">
          {/* Left Side - Profile Info */}
          <div className="flex flex-col items-start">
            {/* Profile Picture */}
            {profile?.profileImage ? (
              <img
                src={profile.profileImage.startsWith('http') ? profile.profileImage : `${process.env.NEXT_PUBLIC_API_URL}${profile.profileImage}`}
                alt={profile.name}
                className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-36 h-36 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-400">
                  {profile?.name?.charAt(0) || '?'}
                </span>
              </div>
            )}

            {/* Name and Username */}
            <h1 className="text-black mt-4" style={{ fontFamily: 'var(--font-assistant), sans-serif', fontWeight: 700, fontSize: '28px' }}>
              {profile?.name || 'משתמש'}
            </h1>
            <p className="text-gray-600 text-sm mt-0.5">
              {profile?.email ? formatUsername(profile.email) : ''}
            </p>

            {/* Bio */}
            {profile?.bio ? (
              <p className="text-gray-600 text-sm mt-3 leading-relaxed max-w-lg text-right" dir="rtl">
                {profile.bio}
              </p>
            ) : currentUserId === userId ? (
              <p className="text-gray-400 text-sm mt-3 italic">לחצו על הגדרות כדי להוסיף תיאור</p>
            ) : null}

            {/* Info row: Online status, Date, Location - all on one line */}
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                {(() => {
                  // Calculate online status based on lastActiveAt
                  const lastActive = profile?.lastActiveAt ? new Date(profile.lastActiveAt) : null;
                  const now = new Date();
                  const diffMinutes = lastActive ? Math.floor((now.getTime() - lastActive.getTime()) / 60000) : null;
                  
                  if (profile?.showOnline !== false && diffMinutes !== null && diffMinutes < 5) {
                    // Online now - green dot
                    return (
                      <>
                        <span className="w-2 h-2 bg-[#A7EA7B] rounded-full"></span>
                        <span>מחובר/ת עכשיו</span>
                      </>
                    );
                  } else if (diffMinutes !== null && diffMinutes < 60) {
                    // Recently active - clock icon
                    return (
                      <>
                        <FaClock className="w-3 h-3 text-gray-400" />
                        <span>פעיל/ה לפני {diffMinutes} דקות</span>
                      </>
                    );
                  } else if (diffMinutes !== null && diffMinutes < 1440) {
                    // Active today - clock icon
                    const hours = Math.floor(diffMinutes / 60);
                    return (
                      <>
                        <FaClock className="w-3 h-3 text-gray-400" />
                        <span>פעיל/ה לפני {hours} שעות</span>
                      </>
                    );
                  } else {
                    // Offline - clock icon
                    return (
                      <>
                        <FaClock className="w-3 h-3 text-gray-400" />
                        <span>לא מחובר/ת</span>
                      </>
                    );
                  }
                })()}
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3" />
                <span>תאריך הצטרפות: {profile?.createdAt ? formatDate(profile.createdAt) : '-'}</span>
              </div>
              {profile?.location && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <FaMapMarkerAlt className="w-3 h-3" />
                    <span>{profile.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Side - Stats & Buttons - aligned higher and more to the right */}
          <div className="flex flex-col items-end absolute left-8 top-24">
            {/* Stats - all on one line */}
            <div className="flex items-center">
              <div className="text-center px-4">
                <p className="text-xl font-bold text-black">{stats.communityMembers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">חברים בקהילות שלי</p>
              </div>
              <div className="text-center border-r border-gray-200 px-4">
                <p className="text-xl font-bold text-black">{stats.followers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">עוקבים</p>
              </div>
              <div className="text-center border-r border-gray-200 px-4">
                <p className="text-xl font-bold text-black">{stats.following.toLocaleString()}</p>
                <p className="text-xs text-gray-500">עוקב/ת אחרי</p>
              </div>
            </div>

            {/* Buttons - on one line - only show for other users */}
            {currentUserId && currentUserId !== userId && (
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-8 py-2 rounded-lg font-bold transition ${
                    isFollowing
                      ? 'border border-black text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-900'
                  } ${followLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? '...' : isFollowing ? 'עוקב' : 'עקוב'}
                </button>
                {isFollowing && (
                  <button
                    onClick={handleSendMessage}
                    className="border border-black text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition"
                  >
                    שלח הודעה
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs - below, stuck to left */}
        <div className="mt-8">
          <div className="flex justify-start gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('created')}
              className={`pb-4 px-2 font-semibold transition relative ${
                activeTab === 'created'
                  ? 'text-black'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              קהילות שיצר
              {activeTab === 'created' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" style={{ borderRadius: 0 }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('member')}
              className={`pb-4 px-2 font-semibold transition relative ${
                activeTab === 'member'
                  ? 'text-black'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              חבר בקהילות
              {activeTab === 'member' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" style={{ borderRadius: 0 }} />
              )}
            </button>
          </div>

          {/* Communities Grid */}
          <div className="py-8">
              {activeTab === 'created' ? (
                createdCommunities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaUsers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>עדיין לא יצר קהילות</p>
                  </div>
                ) : (
                  <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...createdCommunities]
                      .reverse()
                      .slice((createdPage - 1) * communitiesPerPage, createdPage * communitiesPerPage)
                      .map((community) => (
                      <div
                        key={community.id}
                        className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl bg-white transition-all duration-200"
                      >
                        <Link href={`/communities/${community.slug || community.id}/feed`}>
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
                          )}</Link>
                        <div className="p-5 text-right" dir="rtl">
                          {/* Logo + Name row */}
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
                    ))}
                  </div>
                  {/* Pagination for created communities */}
                  {createdCommunities.length > communitiesPerPage && (() => {
                    const totalPages = Math.ceil(createdCommunities.length / communitiesPerPage);
                    const visiblePages = getVisiblePages(createdPage, totalPages);
                    return (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setCreatedPage(p => Math.max(1, p - 1))}
                        disabled={createdPage === 1}
                        className={`flex items-center justify-center transition ${
                          createdPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#3F3F46] hover:text-black'
                        }`}
                        style={{ width: 32, height: 32 }}
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                      {visiblePages.map(page => (
                        <button
                          key={page}
                          onClick={() => setCreatedPage(page)}
                          className={`flex items-center justify-center font-medium text-[16px] transition ${
                            page === createdPage
                              ? 'bg-[#71717A] text-white'
                              : 'bg-white text-[#71717A] hover:bg-gray-50'
                          }`}
                          style={{ width: 32, height: 32, borderRadius: '50%' }}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCreatedPage(p => Math.min(totalPages, p + 1))}
                        disabled={createdPage >= totalPages}
                        className={`flex items-center justify-center transition ${
                          createdPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-[#3F3F46] hover:text-black'
                        }`}
                        style={{ width: 32, height: 32 }}
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                    </div>
                    );
                  })()}
                  </>
                )
              ) : (
                memberCommunities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaUsers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>עדיין לא הצטרף לקהילות</p>
                  </div>
                ) : (
                  <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...memberCommunities]
                      .reverse()
                      .slice((memberPage - 1) * communitiesPerPage, memberPage * communitiesPerPage)
                      .map((community) => (
                      <div
                        key={community.id}
                        className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl bg-white transition-all duration-200"
                      >
                        <Link href={`/communities/${community.slug || community.id}/feed`}>
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
                        </Link>
                        <div className="p-5 text-right" dir="rtl">
                          {/* Logo + Name row */}
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
                    ))}
                  </div>
                  {/* Pagination for member communities */}
                  {memberCommunities.length > communitiesPerPage && (() => {
                    const totalPages = Math.ceil(memberCommunities.length / communitiesPerPage);
                    const visiblePages = getVisiblePages(memberPage, totalPages);
                    return (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                        disabled={memberPage === 1}
                        className={`flex items-center justify-center transition ${
                          memberPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#3F3F46] hover:text-black'
                        }`}
                        style={{ width: 32, height: 32 }}
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                      {visiblePages.map(page => (
                        <button
                          key={page}
                          onClick={() => setMemberPage(page)}
                          className={`flex items-center justify-center font-medium text-[16px] transition ${
                            page === memberPage
                              ? 'bg-[#71717A] text-white'
                              : 'bg-white text-[#71717A] hover:bg-gray-50'
                          }`}
                          style={{ width: 32, height: 32, borderRadius: '50%' }}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setMemberPage(p => Math.min(totalPages, p + 1))}
                        disabled={memberPage >= totalPages}
                        className={`flex items-center justify-center transition ${
                          memberPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-[#3F3F46] hover:text-black'
                        }`}
                        style={{ width: 32, height: 32 }}
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                    </div>
                    );
                  })()}
                  </>
                )
              )}
          </div>
        </div>
      </div>
    </div>
  );
}