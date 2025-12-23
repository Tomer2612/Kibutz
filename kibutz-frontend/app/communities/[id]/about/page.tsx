'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaCalendarAlt, FaCog, FaSignOutAlt, FaYoutube, FaWhatsapp, FaFacebook, FaInstagram, FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa';
import NotificationBell from '../../../components/NotificationBell';

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  logo?: string | null;
  ownerId: string;
  createdAt: string;
  topic?: string | null;
  memberCount?: number | null;
  price?: number | null;
  youtubeUrl?: string | null;
  whatsappUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  galleryImages?: string[];
  owner?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
  };
}

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
}

// Gallery Component with slideshow functionality
function CommunityGallery({ primaryImage, galleryImages, communityName }: { 
  primaryImage?: string | null; 
  galleryImages: string[];
  communityName: string;
}) {
  // Combine primary + gallery images
  const allImages = [
    ...(primaryImage ? [primaryImage] : []),
    ...galleryImages,
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (allImages.length === 0) return null;
  
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Main Image with Navigation */}
      <div className="relative">
        <img
          src={`http://localhost:4000${allImages[currentIndex]}`}
          alt={`${communityName} - תמונה ${currentIndex + 1}`}
          className="w-full h-80 object-cover"
        />
        {/* Navigation Arrows - only show if more than 1 image */}
        {allImages.length > 1 && (
          <>
            <button 
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition"
            >
              <FaChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button 
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition"
            >
              <FaChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}
      </div>
      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 p-3 bg-gray-50 justify-center overflow-x-auto">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                idx === currentIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={`http://localhost:4000${img}`}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommunityAboutPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [ownerData, setOwnerData] = useState<{ id: string; name: string; profileImage?: string | null; coverImage?: string | null; bio?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [managerCount, setManagerCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);
        
        // Fetch user profile
        fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => setUserProfile(data))
          .catch((err) => console.error('Error fetching user profile:', err));
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

      const token = localStorage.getItem('token');

      try {
        setLoading(true);
        
        // Check membership and role - redirect non-members to preview page
        if (token) {
          const membershipRes = await fetch(`http://localhost:4000/communities/${communityId}/membership`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (membershipRes.ok) {
            const membershipData = await membershipRes.json();
            if (!membershipData.role) {
              // Not a member, redirect to preview page
              router.push(`/communities/${communityId}/preview`);
              return;
            }
            setUserRole(membershipData.role);
          }
        } else {
          // Not logged in, redirect to preview page
          router.push(`/communities/${communityId}/preview`);
          return;
        }

        const res = await fetch(`http://localhost:4000/communities/${communityId}`);
        if (!res.ok) throw new Error('Failed to fetch community');
        const data = await res.json();
        setCommunity(data);

        // Fetch owner data separately
        if (data.ownerId) {
          const ownerRes = await fetch(`http://localhost:4000/users/${data.ownerId}`);
          if (ownerRes.ok) {
            const owner = await ownerRes.json();
            setOwnerData(owner);
          }
        }

        // Fetch members to count managers (OWNER + MANAGER roles)
        if (token) {
          const membersRes = await fetch(`http://localhost:4000/communities/${communityId}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (membersRes.ok) {
            const members = await membersRes.json();
            const managers = members.filter((m: { role: string }) => m.role === 'OWNER' || m.role === 'MANAGER');
            setManagerCount(managers.length);
          }
        }
      } catch (err) {
        console.error('Error fetching community:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId, router]);

  if (!community) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">קהילה לא נמצאה</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-right" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        {/* Right side: Logo + Community picker */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <div className="flex items-center gap-2">
            {community?.logo ? (
              <img
                src={`http://localhost:4000${community.logo}`}
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
            { label: 'לוח תוצאות', href: `/communities/${communityId}/leaderboard` },
            { label: 'אודות', href: `/communities/${communityId}/about`, active: true },
            ...(userRole === 'OWNER' || userRole === 'MANAGER' 
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

      {/* Content - 2 column layout */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left Sidebar - Owner & Community Info */}
          <div className="space-y-6">
            {/* Owner Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Cover Photo */}
              {ownerData?.coverImage ? (
                <img
                  src={`http://localhost:4000${ownerData.coverImage}`}
                  alt=""
                  className="w-full h-28 object-cover"
                />
              ) : (
                <div className="w-full h-28 bg-gradient-to-r from-pink-100 to-purple-100" />
              )}
              
              <div className="px-5 pb-5 -mt-12 text-center">
                {/* Centered Profile Photo */}
                <div className="flex justify-center mb-3">
                  {ownerData?.profileImage ? (
                    <img
                      src={`http://localhost:4000${ownerData.profileImage}`}
                      alt={ownerData.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-2xl font-bold text-pink-600 border-4 border-white shadow-md">
                      {ownerData?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                
                {/* Centered Name */}
                <h3 className="font-bold text-black text-xl mb-2">{ownerData?.name || 'מנהל הקהילה'}</h3>
                
                {/* Centered Bio */}
                {ownerData?.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed">{ownerData.bio}</p>
                )}
              </div>
            </div>

            {/* Community Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-500 mb-2">פרטים נוספים על הקהילה</h4>
              </div>
            
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 text-center p-5 border-b border-gray-100">
                <div>
                  <p className="text-xl font-bold text-black">{managerCount}</p>
                  <p className="text-xs text-gray-500">מנהלים</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-black">
                    {userEmail ? 1 : 0}
                  </p>
                  <p className="text-xs text-gray-500">מחוברים</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-black">
                    {(() => {
                      const count = community.memberCount || 1;
                      if (count >= 10000) return `${Math.floor(count / 10000) * 10000}+`;
                      if (count >= 1000) return `${Math.floor(count / 1000) * 1000}+`;
                      if (count >= 100) return `${Math.floor(count / 100) * 100}+`;
                      return count;
                    })()}
                  </p>
                  <p className="text-xs text-gray-500">משתמשים</p>
                </div>
              </div>

              {/* Social Links */}
              {(community.youtubeUrl || community.whatsappUrl || community.facebookUrl || community.instagramUrl) && (
                <div className="p-5">
                  <h4 className="text-sm font-medium text-gray-500 mb-3 text-center">עקבו אחרינו</h4>
                  <div className="flex justify-center gap-3">
                    {community.youtubeUrl && (
                    <a 
                      href={community.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition" 
                      title="יוטוב"
                    >
                      <FaYoutube className="w-5 h-5" />
                    </a>
                  )}
                  {community.whatsappUrl && (
                    <a 
                      href={community.whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition" 
                      title="קבוצת ואטסאפ"
                    >
                      <FaWhatsapp className="w-5 h-5" />
                    </a>
                  )}
                  {community.facebookUrl && (
                    <a 
                      href={community.facebookUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition" 
                      title="פייסבוק"
                    >
                      <FaFacebook className="w-5 h-5" />
                    </a>
                  )}
                  {community.instagramUrl && (
                    <a 
                      href={community.instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition" 
                      title="אינסטגרם"
                    >
                      <FaInstagram className="w-5 h-5" />
                    </a>
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* About Section - moved above image */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-black mb-4">{community.name}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {community.description}
              </p>
            </div>

            {/* Community Image Slideshow */}
            {(community.image || (community.galleryImages && community.galleryImages.length > 0)) && (
              <CommunityGallery 
                primaryImage={community.image} 
                galleryImages={community.galleryImages || []} 
                communityName={community.name}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}