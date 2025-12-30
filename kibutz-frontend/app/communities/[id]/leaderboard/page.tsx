'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaTrophy, FaMedal, FaUsers, FaCog, FaSignOutAlt, FaStar, FaHeart, FaComment, FaFileAlt, FaUser } from 'react-icons/fa';
import NotificationBell from '../../../components/NotificationBell';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

interface Community {
  id: string;
  name: string;
  topic: string | null;
  logo: string | null;
}

interface LeaderboardMember {
  rank: number;
  userId: string;
  name: string;
  email: string;
  profileImage: string | null;
  points: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Read cached profile immediately
    const cached = localStorage.getItem('userProfileCache');
    if (cached) {
      try { setUserProfile(JSON.parse(cached)); } catch {}
    }

    const token = localStorage.getItem('token');
    if (!token || token.split('.').length !== 3) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserEmail(decoded.email);
      setUserId(decoded.sub);

      // Fetch user profile
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const profile = { name: data.name, profileImage: data.profileImage };
            setUserProfile(profile);
            localStorage.setItem('userProfileCache', JSON.stringify(profile));
          }
        })
        .catch(console.error);
    } catch (e) {
      console.error('Invalid token:', e);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!communityId) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch community details
        const communityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${communityId}`);
        if (communityRes.ok) {
          const communityData = await communityRes.json();
          setCommunity(communityData);
        }

        // Check membership and permissions
        const membershipRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/communities/${communityId}/membership`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          setIsOwner(membershipData.isOwner || false);
          setIsManager(membershipData.isManager || false);
        }

        // Fetch leaderboard (top 10 members)
        const leaderboardRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/communities/${communityId}/top-members?limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setMembers(leaderboardData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="w-6 h-6" style={{ color: '#FFD700' }} />;
      case 2:
        return <FaMedal className="w-6 h-6" style={{ color: '#A8A8A8' }} />;
      case 3:
        return <FaMedal className="w-6 h-6" style={{ color: '#CD7F32' }} />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-right" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        {/* Right side: Logo + Community */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <div className="flex items-center gap-2">
            {community?.logo ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${community.logo}`}
                alt={community.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <FaUsers className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <span className="font-medium text-black">{community?.name}</span>
          </div>
        </div>

        {/* Center: Nav links */}
        <nav className="flex items-center gap-4">
          {[
            { label: 'עמוד בית', href: `/communities/feed?communityId=${communityId}` },
            { label: 'קורסים', href: `/communities/${communityId}/courses` },
            { label: 'חברי קהילה', href: `/communities/${communityId}/members` },
            { label: 'יומן אירועים', href: `/communities/events?communityId=${communityId}` },
            { label: 'לוח תוצאות', href: `/communities/${communityId}/leaderboard`, active: true },
            { label: 'אודות', href: `/communities/${communityId}/about` },
            ...((isOwner || isManager) ? [{ label: 'ניהול קהילה', href: `/communities/${communityId}/manage` }] : []),
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm transition px-3 py-1.5 rounded-full ${
                link.active
                  ? 'bg-gray-200 text-black font-medium'
                  : 'text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Left side: Notifications + Profile */}
        <div className="flex items-center gap-3">
          {userEmail && <NotificationBell />}
          {userEmail && (
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

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
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
          )}
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto py-8 px-4">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-full mb-3">
            <FaTrophy className="w-7 h-7 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">עשרת המובילים</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6">
          
          {/* Left Content - Leaderboard */}
          <div>
            {/* Leaderboard */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {members.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {members.map((member, index) => (
                <div
                  key={member.userId}
                  className={`flex items-center gap-4 p-4 transition hover:bg-gray-50 ${getRankBgColor(member.rank)} ${
                    member.rank <= 3 ? 'border-r-4' : ''
                  } ${
                    index === members.length - 1 ? 'rounded-b-2xl' : ''
                  } ${index === 0 ? 'rounded-t-2xl' : ''}`}
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    {getRankIcon(member.rank)}
                  </div>

                  {/* Profile Image */}
                  <Link href={`/profile/${member.userId}`}>
                    {member.profileImage ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${member.profileImage}`}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-lg font-bold text-pink-600 border-2 border-white shadow hover:opacity-80 transition">
                        {member.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </Link>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      <Link href={`/profile/${member.userId}`} className="hover:underline">
                        {member.name}
                      </Link>
                      {member.userId === userId && (
                        <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          אתה
                        </span>
                      )}
                    </p>
                    {member.rank <= 3 && (
                      <p className="text-xs text-gray-500">
                        {member.rank === 1 && '🏆 מקום ראשון'}
                        {member.rank === 2 && '🥈 מקום שני'}
                        {member.rank === 3 && '🥉 מקום שלישי'}
                      </p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900 text-lg">{member.points}</span>
                      <FaStar className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-xs text-gray-500">נקודות</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">אין נתונים עדיין</p>
              <p className="text-sm text-gray-400">התחילו לפרסם פוסטים ולהגיב כדי לצבור נקודות!</p>
            </div>
          )}
        </div>
          </div>

          {/* Right Sidebar - User Points */}
          <div className="order-2 lg:order-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">הניקוד שלך:</h3>
              <div className="text-2xl font-bold text-gray-900 mb-4">
                {members.find(m => m.userId === userId)?.points || 0} נקודות
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">איך צוברים נקודות:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>ליצור פוסטים, להגיב ולעשות לייקים</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>להתחיל ולסיים קורסים</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>להשתתף באירועי הקהילה</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
