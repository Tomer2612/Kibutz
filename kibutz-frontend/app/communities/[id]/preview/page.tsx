'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaCalendarAlt, FaSearch, FaCog, FaSignOutAlt, FaYoutube, FaWhatsapp, FaFacebook, FaInstagram, FaChevronLeft, FaChevronRight, FaUser, FaTimes, FaCreditCard, FaLock } from 'react-icons/fa';
import NotificationBell from '../../../components/NotificationBell';

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
      <div className="relative">
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}${allImages[currentIndex]}`}
          alt={`${communityName} - תמונה ${currentIndex + 1}`}
          className="w-full h-80 object-cover"
        />
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
                src={`${process.env.NEXT_PUBLIC_API_URL}${img}`}
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

function CommunityPreviewContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [ownerData, setOwnerData] = useState<{ id: string; name: string; profileImage?: string | null; coverImage?: string | null; bio?: string | null } | null>(null);
  const [similarCommunities, setSimilarCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [managerCount, setManagerCount] = useState(0);
  const [joining, setJoining] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Check if we should show payment modal (coming back from signup)
  useEffect(() => {
    if (searchParams.get('showPayment') === 'true' && community) {
      setShowPaymentModal(true);
      // Remove the query param from URL
      router.replace(`/communities/${communityId}/preview`);
    }
  }, [searchParams, community, communityId, router]);

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
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            setUserProfile(data);
            localStorage.setItem('userProfileCache', JSON.stringify({ name: data.name, profileImage: data.profileImage }));
          })
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
        
        // Check membership - if member, redirect to feed
        if (token) {
          const membershipRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${communityId}/membership`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (membershipRes.ok) {
            const membershipData = await membershipRes.json();
            if (membershipData.role) {
              // User is a member, redirect to feed
              router.push(`/communities/${communityId}/feed`);
              return;
            }
          }
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${communityId}`);
        if (!res.ok) throw new Error('Failed to fetch community');
        const data = await res.json();
        
        // Redirect to slug URL if community has a slug and we're using ID
        if (data.slug && communityId !== data.slug) {
          router.replace(`/communities/${data.slug}/preview`);
          return;
        }
        
        setCommunity(data);

        // Fetch owner data separately
        if (data.ownerId) {
          const ownerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${data.ownerId}`);
          if (ownerRes.ok) {
            const owner = await ownerRes.json();
            setOwnerData(owner);
          }
        }

        // Fetch similar communities (same topic)
        if (data.topic) {
          const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities`);
          if (allRes.ok) {
            const allCommunities = await allRes.json();
            const similar = allCommunities.filter((c: Community) => 
              c.topic === data.topic && c.id !== communityId
            ).slice(0, 3);
            setSimilarCommunities(similar);
          }
        }

        // Fetch members to count managers
        if (token) {
          const membersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${communityId}/members`, {
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

  const handleJoinClick = () => {
    if (!userEmail) {
      // Save the community ID and payment intent for after registration
      localStorage.setItem('pendingJoinCommunity', communityId);
      if (community?.price && community.price > 0) {
        localStorage.setItem('pendingPayment', 'true');
      }
      router.push('/signup');
      return;
    }

    if (community?.price && community.price > 0) {
      setShowPaymentModal(true);
    } else {
      joinCommunity();
    }
  };

  const joinCommunity = async () => {
    setJoining(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${communityId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        // Redirect using slug if available
        const redirectId = community?.slug || communityId;
        router.push(`/communities/${redirectId}/feed`);
      }
    } catch (err) {
      console.error('Failed to join community:', err);
    } finally {
      setJoining(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaymentValid) return;
    setJoining(true);
    
    // Save credit card info to user payment methods
    const token = localStorage.getItem('token');
    const lastFour = cardNumber.slice(-4);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardLastFour: lastFour,
          cardBrand: 'Visa',
        }),
      });
    } catch (err) {
      console.error('Failed to save card info:', err);
    }
    
    await joinCommunity();
    setShowPaymentModal(false);
  };

  // Card validation helpers
  const getCardNumberError = () => {
    if (cardNumber.length === 0) return null;
    if (cardNumber.length < 16) return `חסרות ${16 - cardNumber.length} ספרות`;
    return null;
  };

  const getExpiryError = () => {
    if (cardExpiry.length === 0) return null;
    if (cardExpiry.length < 5) return 'פורמט: MM/YY';
    
    const [monthStr, yearStr] = cardExpiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt('20' + yearStr, 10);
    
    if (month < 1 || month > 12) return 'חודש לא תקין';
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'כרטיס פג תוקף';
    }
    
    return null;
  };

  const getCvvError = () => {
    if (cardCvv.length === 0) return null;
    if (cardCvv.length < 3) return `חסרות ${3 - cardCvv.length} ספרות`;
    return null;
  };

  const isPaymentValid = cardNumber.length === 16 && 
                         cardExpiry.length === 5 && 
                         !getExpiryError() && 
                         cardCvv.length === 3;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
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
      {/* Homepage-style Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex gap-6 items-center">
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
            <div className="w-10 h-10" />
          ) : !userEmail ? (
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
            <>
              {userEmail && <NotificationBell />}
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
            </>
          )}
        </div>
      </header>

      {/* Content - 2 column layout */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Owner Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Cover Photo */}
              {ownerData?.coverImage ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${ownerData.coverImage}`}
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
                      src={`${process.env.NEXT_PUBLIC_API_URL}${ownerData.profileImage}`}
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

              {/* Join Button */}
              <div className="px-5 pb-5">
              <button
                onClick={handleJoinClick}
                disabled={joining}
                className="w-full py-3 px-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מצטרף...
                  </>
                ) : community.price && community.price > 0 ? (
                  `הצטרפות בתשלום`
                ) : (
                  `הצטרפות בחינם`
                )}
              </button>
              {community.price && community.price > 0 ? (
                <p className="text-xs text-gray-500 text-center mt-2">₪{community.price} לחודש • 14 ימי ניסיון חינם</p>
              ) : null}
              </div>
            </div>

            {/* Community Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-500">פרטים נוספים על הקהילה</h4>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 text-center p-5 border-b border-gray-100">
                <div>
                  <p className="text-xl font-bold text-black">{managerCount || 1}</p>
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
                      <a href={community.youtubeUrl} target="_blank" rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition">
                        <FaYoutube className="w-5 h-5" />
                      </a>
                    )}
                    {community.whatsappUrl && (
                      <a href={community.whatsappUrl} target="_blank" rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition">
                        <FaWhatsapp className="w-5 h-5" />
                      </a>
                    )}
                    {community.facebookUrl && (
                      <a href={community.facebookUrl} target="_blank" rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition">
                        <FaFacebook className="w-5 h-5" />
                      </a>
                    )}
                    {community.instagramUrl && (
                      <a href={community.instagramUrl} target="_blank" rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 flex items-center justify-center transition">
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
            {/* Community Image Slideshow */}
            {(community.image || (community.galleryImages && community.galleryImages.length > 0)) && (
              <CommunityGallery 
                primaryImage={community.image} 
                galleryImages={community.galleryImages || []} 
                communityName={community.name}
              />
            )}

            {/* About Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-black mb-4">{community.name}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {community.description}
              </p>
            </div>
          </div>
        </div>

        {/* Similar Communities Section */}
        {similarCommunities.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-right mb-8">קהילות דומות</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarCommunities.map((comm) => {
                // Format member count like homepage
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
                
                return (
                  <Link
                    key={comm.id}
                    href={`/communities/${comm.id}/preview`}
                    className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl bg-white transition-all duration-200"
                  >
                    {comm.image ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${comm.image}`}
                        alt={comm.name}
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                        <span className="text-gray-400 font-medium">תמונת קהילה</span>
                      </div>
                    )}
                    <div className="p-5 text-right">
                      <div className="flex items-start gap-3 mb-2">
                        {comm.logo ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}${comm.logo}`}
                            alt={comm.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-lg font-bold">{comm.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl text-black">{comm.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {comm.description}
                      </p>
                      
                      {/* Separator line */}
                      <div className="border-t border-gray-200 my-4"></div>
                      
                      {/* Topic + Member count + Price badges */}
                      <div className="flex flex-wrap items-center justify-start gap-2">
                        {/* Topic badge */}
                        {comm.topic && (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200">
                            {comm.topic}
                          </span>
                        )}
                        
                        {/* Member count badge */}
                        <span 
                          className="px-3 py-1.5 rounded-full text-sm font-medium"
                          style={{ backgroundColor: '#F4F4F5', color: '#52525B' }}
                        >
                          {(comm.memberCount ?? 0) === 1 
                            ? 'משתמש אחד' 
                            : (comm.memberCount ?? 0) < 100
                              ? `${comm.memberCount} משתמשים`
                              : `${formatMemberCount(comm.memberCount ?? 0)}+ משתמשים`}
                        </span>
                        
                        {/* Free/Paid badge */}
                        {(comm.price ?? 0) === 0 ? (
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
                            ₪{comm.price} לחודש
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && community && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-lg" dir="rtl">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-center mb-8">מתחילים 7 ימי ניסיון חינם</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">מספר כרטיס</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                      getCardNumberError() ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  <FaCreditCard className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                {getCardNumberError() && (
                  <p className="text-red-500 text-sm mt-1">{getCardNumberError()}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">תוקף</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const rawValue = newValue.replace(/\D/g, '').slice(0, 4);
                        
                        if (rawValue.length > 2) {
                          // 3-4 digits: always show with slash (MM/Y or MM/YY)
                          setCardExpiry(rawValue.slice(0, 2) + '/' + rawValue.slice(2));
                        } else if (rawValue.length === 2 && newValue.length > cardExpiry.length) {
                          // Exactly 2 digits AND typing forward: add slash
                          setCardExpiry(rawValue + '/');
                        } else {
                          // 0-2 digits while deleting: just show raw
                          setCardExpiry(rawValue);
                        }
                      }}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                        getExpiryError() ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    <FaCalendarAlt className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {getExpiryError() && (
                    <p className="text-red-500 text-sm mt-1">{getExpiryError()}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">CVV</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                        getCvvError() ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    <FaLock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {getCvvError() && (
                    <p className="text-red-500 text-sm mt-1">{getCvvError()}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handlePaymentSubmit}
              disabled={!isPaymentValid || joining}
              className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {joining ? 'מצטרף לקהילה...' : 'הצטרפות לקהילה'}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              תזכורת תשלח במייל 3 ימים לפני סיום הניסיון. אפשר<br />
              לבטל בקליק דרך הגדרות הקהילה.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CommunityPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <CommunityPreviewContent />
    </Suspense>
  );
}
