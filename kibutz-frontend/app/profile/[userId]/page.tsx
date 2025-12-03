'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { FaCog, FaSignOutAlt, FaUsers, FaMapMarkerAlt, FaCalendarAlt, FaSignInAlt, FaClock } from 'react-icons/fa';

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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
  showOnline?: boolean;
}

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  memberCount?: number | null;
  price?: number | null;
  topic?: string | null;
  createdAt?: string;
}

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
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

  // Current user state (for navbar)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Fetch current user for navbar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setCurrentUserEmail(decoded.email);

        fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setCurrentUserProfile({ name: data.name, profileImage: data.profileImage });
          })
          .catch(console.error);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileRes = await fetch(`http://localhost:4000/users/${userId}`);
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

        const createdRes = await fetch(`http://localhost:4000/users/${userId}/communities/created`);
        if (createdRes.ok) {
          const createdData = await createdRes.json();
          setCreatedCommunities(createdData);
        }

        const memberRes = await fetch(`http://localhost:4000/users/${userId}/communities/member`);
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          setMemberCommunities(memberData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

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
      {/* Header/Navbar - same as homepage */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        {/* Right side: Logo */}
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>

        {/* Left side: Nav + Auth */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-gray-600 hover:text-black transition text-sm font-medium">
              מחירון
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-black transition text-sm font-medium">
              תמיכה ושאלות
            </Link>
          </nav>

          {!currentUserEmail ? (
            <div className="flex items-center gap-3">
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
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="relative focus:outline-none"
              >
                {currentUserProfile?.profileImage ? (
                  <img
                    src={`http://localhost:4000${currentUserProfile.profileImage}`}
                    alt={currentUserProfile.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-600">
                    {currentUserProfile?.name?.charAt(0) || currentUserEmail?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
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

      {/* Profile Header with gradient background */}
      <div className="w-full h-44 bg-gradient-to-l from-cyan-200 via-teal-100 to-blue-200"></div>

      {/* Main Content - Full width */}
      <div className="w-full px-8">
        {/* Profile Section - Two columns: Left side (profile info) + Right side (stats & buttons) */}
        <div className="flex justify-between items-end -mt-20 pb-6">
          {/* Left Side - Profile Info */}
          <div className="flex flex-col items-start">
            {/* Profile Picture */}
            {profile?.profileImage ? (
              <img
                src={`http://localhost:4000${profile.profileImage}`}
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-400">
                  {profile?.name?.charAt(0) || '?'}
                </span>
              </div>
            )}

            {/* Name and Username */}
            <h1 className="text-2xl font-bold text-black mt-4">
              {profile?.name || 'משתמש'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {profile?.email ? formatUsername(profile.email) : ''}
            </p>

            {/* About placeholder */}
            <p className="text-gray-600 text-sm mt-3 leading-relaxed max-w-lg text-right" dir="rtl">
              אופה כבר 15 שנה, אוהבת לבשל ולאפות מכל הלב, נהנית לגלות טעמים חדשים וליצור מנות ביתיות מגוונות.
            </p>

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
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
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
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <FaMapMarkerAlt className="w-3 h-3" />
                <span>תל אביב, ישראל</span>
              </div>
            </div>
          </div>

          {/* Right Side - Stats & Buttons - aligned to bottom of profile info */}
          <div className="flex flex-col items-end">
            {/* Stats - all on one line */}
            <div className="flex items-center gap-4">
              <div className="text-center px-4">
                <p className="text-xl font-bold text-black">14,000</p>
                <p className="text-xs text-gray-500">חברים בקהילות שלי</p>
              </div>
              <div className="text-center border-l border-gray-200 px-4">
                <p className="text-xl font-bold text-black">2,500</p>
                <p className="text-xs text-gray-500">עוקבים</p>
              </div>
              <div className="text-center border-l border-gray-200 px-4">
                <p className="text-xl font-bold text-black">100</p>
                <p className="text-xs text-gray-500">עוקב/ת אחרי</p>
              </div>
            </div>

            {/* Buttons - on one line */}
            <div className="flex items-center gap-3 mt-4">
              <button
                disabled
                className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition cursor-not-allowed opacity-60"
              >
                הודעה
              </button>
              <button
                disabled
                className="bg-black text-white px-8 py-2 rounded-lg font-semibold hover:opacity-90 transition cursor-not-allowed opacity-60"
              >
                עקוב
              </button>
            </div>
          </div>
        </div>

        {/* Tabs - below, stuck to left */}
        <div className="mt-8">
          <div className="flex justify-start gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('created')}
              className={`pb-4 px-2 font-semibold transition border-b-2 ${
                activeTab === 'created'
                  ? 'text-black border-black'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              קהילות שיצר
            </button>
            <button
              onClick={() => setActiveTab('member')}
              className={`pb-4 px-2 font-semibold transition border-b-2 ${
                activeTab === 'member'
                  ? 'text-black border-black'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              חבר בקהילות
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl bg-white transition-all duration-200"
                      >
                        <Link href={`/communities/feed?communityId=${community.id}`}>
                          {community.image ? (
                            <img
                              src={`http://localhost:4000${community.image}`}
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
                          <h2 className="font-bold text-xl text-black mb-2">{community.name}</h2>
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                            {community.description}
                          </p>
                          
                          {/* Separator line */}
                          <div className="border-t border-gray-200 my-4"></div>
                          
                          {/* Topic + Member count + Price badges - all on same line */}
                          <div className="flex flex-wrap items-center justify-start gap-2 mb-4">
                            {/* Topic badge */}
                            {community.topic && (() => {
                              const colors = getTopicColor(community.topic);
                              return (
                                <span className={`${colors.bg} ${colors.text} px-3 py-1.5 rounded-full text-sm font-medium border ${colors.border}`}>
                                  {community.topic}
                                </span>
                              );
                            })()}
                            
                            {/* Member count - Gray badge */}
                            <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200">
                              {(community.memberCount ?? 0) === 1 
                                ? 'משתמש אחד' 
                                : (community.memberCount ?? 0) < 100
                                  ? `${community.memberCount} משתמשים`
                                  : `${formatMemberCount(community.memberCount ?? 0)}+ משתמשים`}
                            </span>
                            
                            {/* Free/Paid badge - Green for free, Blue for paid */}
                            {(community.price ?? 0) === 0 ? (
                              <span className="bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200">
                                חינם
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                                ₪{community.price} לחודש
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                memberCommunities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaUsers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>עדיין לא הצטרף לקהילות</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memberCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl bg-white transition-all duration-200"
                      >
                        <Link href={`/communities/feed?communityId=${community.id}`}>
                          {community.image ? (
                            <img
                              src={`http://localhost:4000${community.image}`}
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
                          <h2 className="font-bold text-xl text-black mb-2">{community.name}</h2>
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                            {community.description}
                          </p>
                          
                          {/* Separator line */}
                          <div className="border-t border-gray-200 my-4"></div>
                          
                          {/* Topic + Member count + Price badges - all on same line */}
                          <div className="flex flex-wrap items-center justify-start gap-2 mb-4">
                            {community.topic && (() => {
                              const colors = getTopicColor(community.topic);
                              return (
                                <span className={`${colors.bg} ${colors.text} px-3 py-1.5 rounded-full text-sm font-medium border ${colors.border}`}>
                                  {community.topic}
                                </span>
                              );
                            })()}
                            
                            {/* Member count - Gray badge */}
                            <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200">
                              {(community.memberCount ?? 0) === 1 
                                ? 'משתמש אחד' 
                                : (community.memberCount ?? 0) < 100
                                  ? `${community.memberCount} משתמשים`
                                  : `${formatMemberCount(community.memberCount ?? 0)}+ משתמשים`}
                            </span>
                            
                            {/* Free/Paid badge - Green for free, Blue for paid */}
                            {(community.price ?? 0) === 0 ? (
                              <span className="bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200">
                                חינם
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                                ₪{community.price} לחודש
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
          </div>
        </div>
      </div>
    </div>
  );
}