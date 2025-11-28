'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaCalendarAlt, FaSearch, FaCog, FaSignOutAlt, FaYoutube, FaWhatsapp, FaFacebook, FaInstagram, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
  youtubeUrl?: string | null;
  whatsappUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  galleryImages?: string[];
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
  const [loading, setLoading] = useState(true);
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
        
        // Check membership and role
        if (token) {
          const membershipRes = await fetch(`http://localhost:4000/communities/${communityId}/membership`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (membershipRes.ok) {
            const membershipData = await membershipRes.json();
            setUserRole(membershipData.role);
          }
        }

        const res = await fetch(`http://localhost:4000/communities/${communityId}`);
        if (!res.ok) throw new Error('Failed to fetch community');
        const data = await res.json();
        setCommunity(data);

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
  }, [communityId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">טוען...</p>
      </main>
    );
  }

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
            { label: 'חברי קהילה', href: `/communities/${communityId}/members` },
            { label: 'יומן', href: '#' },
            { label: 'לוח תוצאות', href: '#' },
            { label: 'אודות', href: `/communities/${communityId}/about`, active: true },
            ...(userRole === 'OWNER' || userRole === 'MANAGER' 
              ? [{ label: 'ניהול', href: `/communities/${communityId}/manage` }] 
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

      {/* Content - 2 column layout */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* About Section - moved above image */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-black mb-4">אודות הקהילה</h2>
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

          {/* Right Sidebar - Stats */}
          <div className="space-y-4">
            {/* מידע וקישורים נוספים */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-black mb-4 text-center">מידע וקישורים נוספים</h3>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-lg font-bold text-black">{managerCount}</p>
                  <p className="text-xs text-gray-500">מנהלים</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-black">
                    {userEmail ? 1 : 0} <span className="text-green-500">●</span>
                  </p>
                  <p className="text-xs text-gray-500">מחוברים</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-black">
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
                <div className="flex justify-center gap-4 pt-3 border-t border-gray-100">
                  {community.youtubeUrl && (
                    <a href={community.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600 transition" title="יוטוב">
                      <FaYoutube className="w-5 h-5" />
                    </a>
                  )}
                  {community.whatsappUrl && (
                    <a href={community.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600 transition" title="קבוצת ואטסאפ">
                      <FaWhatsapp className="w-5 h-5" />
                    </a>
                  )}
                  {community.facebookUrl && (
                    <a href={community.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition" title="פייסבוק">
                      <FaFacebook className="w-5 h-5" />
                    </a>
                  )}
                  {community.instagramUrl && (
                    <a href={community.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 transition" title="אינסטגרם">
                      <FaInstagram className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Community Info Card - removed member count */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <TopicIcon topic={community.topic} size="md" />
                <div>
                  <h3 className="font-bold text-black">{community.name}</h3>
                  {community.topic && (
                    <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                      {community.topic}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FaCalendarAlt className="w-4 h-4" />
                  <span>נוצרה ב־{new Date(community.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}