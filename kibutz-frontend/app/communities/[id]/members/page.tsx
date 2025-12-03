'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaSearch, FaCog, FaSignOutAlt, FaCrown, FaUserShield, FaUser, FaUserMinus, FaBan, FaUndo } from 'react-icons/fa';
import { TopicIcon } from '../../../lib/topicIcons';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

interface Member {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  joinedAt: string;
  role: 'OWNER' | 'MANAGER' | 'USER';
  isOwner: boolean;
  isManager: boolean;
}

interface BannedUser {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  reason: string;
  bannedAt: string;
  expiresAt: string;
  daysLeft: number;
}

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  topic?: string | null;
  ownerId: string;
}

export default function CommunityMembersPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showBanned, setShowBanned] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);

        fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setUserProfile({ name: data.name, profileImage: data.profileImage });
          })
          .catch(console.error);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!communityId) return;

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);

        // Fetch community details
        const communityRes = await fetch(`http://localhost:4000/communities/${communityId}`);
        if (communityRes.ok) {
          setCommunity(await communityRes.json());
        }

        // Check current user's role
        const membershipRes = await fetch(`http://localhost:4000/communities/${communityId}/membership`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          setCurrentUserRole(membershipData.role);
        }

        // Fetch members
        const membersRes = await fetch(`http://localhost:4000/communities/${communityId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
          setFilteredMembers(membersData);
        }

        // Fetch banned users (for owners/managers)
        const bannedRes = await fetch(`http://localhost:4000/communities/${communityId}/banned`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bannedRes.ok) {
          const bannedData = await bannedRes.json();
          setBannedUsers(bannedData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityId, router]);

  // Filter members by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(
          m =>
            m.name?.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, members]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getUsername = (email: string) => {
    return '@' + email.split('@')[0];
  };

  const getRoleBadge = (role: 'OWNER' | 'MANAGER' | 'USER') => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            <FaCrown className="w-3 h-3" />
            בעלים
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            <FaUserShield className="w-3 h-3" />
            מנהל
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <FaUser className="w-3 h-3" />
            חבר
          </span>
        );
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'MANAGER' | 'USER') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/communities/${communityId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        // Update the members list with the new role
        setMembers(prev => prev.map(m => 
          m.id === memberId 
            ? { ...m, role: newRole, isManager: newRole === 'MANAGER' } 
            : m
        ));
        setFilteredMembers(prev => prev.map(m => 
          m.id === memberId 
            ? { ...m, role: newRole, isManager: newRole === 'MANAGER' } 
            : m
        ));
      } else {
        console.error('Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך להסיר את ${memberName} מהקהילה?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/communities/${communityId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove from members list
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setFilteredMembers(prev => prev.filter(m => m.id !== memberId));
        
        // Refresh banned users list
        const bannedRes = await fetch(`http://localhost:4000/communities/${communityId}/banned`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bannedRes.ok) {
          setBannedUsers(await bannedRes.json());
        }
      } else {
        const error = await res.json();
        alert(error.message || 'שגיאה בהסרת המשתמש');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      alert('שגיאה בהסרת המשתמש');
    }
  };

  const handleLiftBan = async (banId: string, userName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך להסיר את ההשעיה של ${userName}?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/communities/${communityId}/banned/${banId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setBannedUsers(prev => prev.filter(b => b.id !== banId));
      } else {
        const error = await res.json();
        alert(error.message || 'שגיאה בהסרת ההשעיה');
      }
    } catch (err) {
      console.error('Error lifting ban:', err);
      alert('שגיאה בהסרת ההשעיה');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">טוען חברי קהילה...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-right" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        {/* Right side: Logo + Community picker */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <div className="flex items-center gap-2">
            {community?.topic && <TopicIcon topic={community.topic} size="md" />}
            <span className="font-medium text-black">{community?.name}</span>
          </div>
        </div>

        {/* Center: Nav links */}
        <nav className="flex items-center gap-4">
          {[
            { label: 'עמוד בית', href: `/communities/feed?communityId=${communityId}` },
            { label: 'קורס', href: '#' },
            { label: 'חברי קהילה', href: `/communities/${communityId}/members`, active: true },
            { label: 'יומן אירועים', href: '#' },
            { label: 'לוח תוצאות', href: `/communities/${communityId}/leaderboard` },
            { label: 'אודות', href: `/communities/${communityId}/about` },
            ...(currentUserRole === 'OWNER' || currentUserRole === 'MANAGER' 
              ? [{ label: 'ניהול קהילה', href: `/communities/${communityId}/manage` }] 
              : []),
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

        {/* Left side: Search + Notifications + Profile */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש"
              className="pl-4 pr-10 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-400 w-32"
            />
          </div>

          {userEmail && (
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

      {/* Members Content */}
      <section className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חפש חבר קהילה"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 text-right focus:outline-none focus:border-gray-400 bg-white"
              />
            </div>
          </div>

        {/* Members List */}
        <div className="space-y-2">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition"
              >
                {/* Profile Image */}
                <Link href={`/profile/${member.id}`} className="relative flex-shrink-0">
                  {member.profileImage ? (
                    <img
                      src={`http://localhost:4000${member.profileImage}`}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-lg font-bold text-pink-600 hover:opacity-80 transition">
                      {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

                {/* Member Info */}
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${member.id}`} className="font-semibold text-black hover:underline">
                      {member.name || 'משתמש'}
                    </Link>
                    {getRoleBadge(member.role)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {getUsername(member.email)} · תאריך הצטרפות: {formatDate(member.joinedAt)}
                  </p>
                </div>

                {/* Role Management & Remove - Only for Owners/Managers, can't change owner role */}
                {(currentUserRole === 'OWNER' || currentUserRole === 'MANAGER') && member.role !== 'OWNER' && (
                  <div className="flex items-center gap-2">
                    {/* Role change button - Only owners can change roles */}
                    {currentUserRole === 'OWNER' && (
                      <button
                        onClick={() => handleRoleChange(member.id, member.role === 'MANAGER' ? 'USER' : 'MANAGER')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                          member.role === 'MANAGER'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {member.role === 'MANAGER' ? 'שנה לחבר' : 'קדם למנהל'}
                      </button>
                    )}
                    
                    {/* Remove button - Owners can remove anyone, Managers can only remove Users */}
                    {(currentUserRole === 'OWNER' || (currentUserRole === 'MANAGER' && member.role === 'USER')) && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name || 'משתמש')}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="הסר מהקהילה"
                      >
                        <FaUserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'לא נמצאו חברים התואמים לחיפוש' : 'אין חברים בקהילה זו'}
            </div>
          )}
        </div>

          {/* Member count */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {members.length} חברים בקהילה
          </div>
        </div>

        {/* Banned Users Section - Only for Owners/Managers */}
        {(currentUserRole === 'OWNER' || currentUserRole === 'MANAGER') && bannedUsers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
            <button
              onClick={() => setShowBanned(!showBanned)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <FaBan className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-black">משתמשים מושעים ({bannedUsers.length})</h2>
              </div>
              <span className="text-gray-400">{showBanned ? '▲' : '▼'}</span>
            </button>

            {showBanned && (
              <div className="mt-4 space-y-2">
                {bannedUsers.map((ban) => (
                  <div
                    key={ban.id}
                    className="flex items-center gap-4 p-4 bg-red-50 rounded-xl"
                  >
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      {ban.user.profileImage ? (
                        <img
                          src={`http://localhost:4000${ban.user.profileImage}`}
                          alt={ban.user.name}
                          className="w-12 h-12 rounded-full object-cover opacity-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-400">
                          {ban.user.name?.charAt(0) || ban.user.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Ban Info */}
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">{ban.user.name || 'משתמש'}</span>
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          <FaBan className="w-3 h-3" />
                          מושעה
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        @{ban.user.email.split('@')[0]} · נותרו {ban.daysLeft} ימים
                      </p>
                    </div>

                    {/* Lift Ban Button */}
                    <button
                      onClick={() => handleLiftBan(ban.id, ban.user.name || 'משתמש')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition"
                    >
                      <FaUndo className="w-3 h-3" />
                      הסר השעיה
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
