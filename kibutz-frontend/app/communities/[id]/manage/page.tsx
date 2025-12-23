'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaImage, FaCog, FaSignOutAlt, FaTrash, FaYoutube, FaWhatsapp, FaFacebook, FaInstagram, FaTimes, FaStar, FaPlus, FaUser, FaCreditCard, FaChevronDown, FaCalendarAlt, FaLock } from 'react-icons/fa';
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
  description: string;
  topic: string | null;
  image: string | null;
  logo: string | null;
  ownerId: string;
  memberCount: number;
  youtubeUrl: string | null;
  whatsappUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  galleryImages: string[];
  rules: string[];
  trialStartDate: string | null;
  trialCancelled: boolean;
  cardLastFour: string | null;
  cardBrand: string | null;
}

interface ImageFile {
  file?: File;
  preview: string;
  isPrimary: boolean;
  isExisting: boolean;
  existingPath?: string;
}

type TabType = 'general' | 'rules' | 'social' | 'payments';

export default function ManageCommunityPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  // Social links
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  
  // Logo
  const [logo, setLogo] = useState<{ file?: File; preview: string; isExisting: boolean; existingPath?: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Images
  const [images, setImages] = useState<ImageFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Community Rules
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  
  // Price
  const [price, setPrice] = useState<number>(10);
  const [isPaidCommunity, setIsPaidCommunity] = useState(false);
  
  // Trial and payment
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null);
  const [trialCancelled, setTrialCancelled] = useState(false);
  const [cardLastFour, setCardLastFour] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCancelTrialModal, setShowCancelTrialModal] = useState(false);
  const [cancellingTrial, setCancellingTrial] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');

  // Categories - synced with COMMUNITY_TOPICS from home page
  const categories = [
    'בחר קטגוריה',
    'אנימציה',
    'אוכל, בישול ותזונה',
    'עזרה ותמיכה',
    'עיצוב גרפי',
    'עיצוב מותגים',
    'עריכת וידאו',
    'בריאות הנפש ופיתוח אישי',
    'גיימינג',
    'טיולים ולייפסטייל',
    'לימודים ואקדמיה',
    'מדיה, קולנוע וסדרות',
    'מדיה חברתית ותוכן ויזואלי',
    'ניהול פיננסי והשקעות',
    'ספרים וכתיבה',
    'ספורט ואורח חיים פעיל',
    'תחביבים',
    'יזמות ועסקים עצמאיים'
  ];

  useEffect(() => {
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
      router.push('/login');
    }
  }, [router]);

  // Fetch community details and check permissions
  useEffect(() => {
    const fetchCommunity = async () => {
      if (!communityId || !userId) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        // First check membership and permissions
        const membershipRes = await fetch(
          `http://localhost:4000/communities/${communityId}/membership`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          
          // Only owners and managers can access manage page
          if (!membershipData.canEdit) {
            router.push(`/communities/feed?communityId=${communityId}`);
            return;
          }
          
          setIsOwner(membershipData.isOwner || false);
        } else {
          router.push('/');
          return;
        }
        
        const res = await fetch(`http://localhost:4000/communities/${communityId}`);
        if (!res.ok) throw new Error('Community not found');
        
        const data = await res.json();
        
        setCommunity(data);
        setName(data.name);
        setDescription(data.description);
        setTopic(data.topic || '');
        setYoutubeUrl(data.youtubeUrl || '');
        setWhatsappUrl(data.whatsappUrl || '');
        setFacebookUrl(data.facebookUrl || '');
        setInstagramUrl(data.instagramUrl || '');
        setRules(data.rules || []);
        setPrice(data.price || 10);
        setIsPaidCommunity((data.price ?? 0) > 0);
        
        // Load trial and payment info
        if (data.trialStartDate) {
          setTrialStartDate(new Date(data.trialStartDate));
        } else {
          // If no trial start date, set it to community creation date (or now)
          setTrialStartDate(data.createdAt ? new Date(data.createdAt) : new Date());
        }
        setTrialCancelled(data.trialCancelled || false);
        setCardLastFour(data.cardLastFour || null);
        setCardBrand(data.cardBrand || null);
        
        // Load logo
        if (data.logo) {
          setLogo({
            preview: `http://localhost:4000${data.logo}`,
            isExisting: true,
            existingPath: data.logo,
          });
        }
        
        // Load images
        const loadedImages: ImageFile[] = [];
        
        // Primary image
        if (data.image) {
          loadedImages.push({
            preview: `http://localhost:4000${data.image}`,
            isPrimary: true,
            isExisting: true,
            existingPath: data.image,
          });
        }
        
        // Gallery images
        if (data.galleryImages && Array.isArray(data.galleryImages)) {
          data.galleryImages.forEach((path: string) => {
            loadedImages.push({
              preview: `http://localhost:4000${path}`,
              isPrimary: false,
              isExisting: true,
              existingPath: path,
            });
          });
        }
        
        setImages(loadedImages);
      } catch (err) {
        console.error('Error fetching community:', err);
        router.push('/');
      } finally {
        setPageLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId, userId, router]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo({ file, preview: reader.result as string, isExisting: false });
    };
    reader.readAsDataURL(file);
    
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ImageFile = {
          file,
          preview: reader.result as string,
          isPrimary: images.length === 0, // First image is primary if no images exist
          isExisting: false,
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImageAtIndex = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the primary, make first one primary
      if (prev[index].isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    })));
  };

  const handleUpdateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      setMessage('אנא מלאו את כל השדות החובה');
      setMessageType('error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('topic', topic);
      
      // Logo
      if (logo) {
        if (logo.isExisting) {
          formData.append('existingLogo', logo.existingPath || '');
        } else if (logo.file) {
          formData.append('logo', logo.file);
        }
      } else {
        formData.append('removeLogo', 'true');
      }
      
      // Social links
      formData.append('youtubeUrl', youtubeUrl);
      formData.append('whatsappUrl', whatsappUrl);
      formData.append('facebookUrl', facebookUrl);
      formData.append('instagramUrl', instagramUrl);
      
      // Price
      formData.append('price', price.toString());
      
      // Find primary image
      const primaryImage = images.find(img => img.isPrimary);
      if (primaryImage) {
        if (primaryImage.isExisting) {
          // Keep existing primary image - send its path
          formData.append('existingPrimaryImage', primaryImage.existingPath || '');
        } else if (primaryImage.file) {
          // New primary image
          formData.append('image', primaryImage.file);
        }
      } else {
        // No primary image - remove it
        formData.append('removeImage', 'true');
      }
      
      // Gallery images (non-primary)
      const existingGalleryPaths = images
        .filter(img => !img.isPrimary && img.isExisting)
        .map(img => img.existingPath);
      formData.append('existingGalleryImages', JSON.stringify(existingGalleryPaths));
      
      // New gallery images
      images.filter(img => !img.isPrimary && !img.isExisting && img.file).forEach(img => {
        formData.append('galleryImages', img.file!);
      });

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

      // Also save rules
      const rulesRes = await fetch(`http://localhost:4000/communities/${communityId}/rules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rules }),
      });

      if (!rulesRes.ok) {
        console.error('Failed to save rules');
      }

      setMessage('הקהילה עודכנה בהצלחה!');
      setMessageType('success');
      setTimeout(() => {
        router.push(`/communities/feed?communityId=${communityId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Community update error:', err);
      setMessage(err.message || 'שגיאה בעדכון הקהילה');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Rules handlers
  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules(prev => [...prev, newRule.trim()]);
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCommunity = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setDeleting(true);
      const res = await fetch(`http://localhost:4000/communities/${communityId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete community');
      }

      router.push('/');
    } catch (err) {
      console.error('Delete error:', err);
      setMessage('שגיאה במחיקת הקהילה');
      setMessageType('error');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (pageLoading || !userEmail) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-100">
        <p className="text-gray-600">טוען...</p>
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
            { label: 'אודות', href: `/communities/${communityId}/about` },
            { label: 'ניהול קהילה', href: `/communities/${communityId}/manage`, active: true },
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

      {/* Main Layout with Sidebar */}
      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Right Sidebar - Settings Tabs */}
        <aside className="w-64 bg-white border-l border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <FaCog className="w-5 h-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">הגדרות</h2>
          </div>
          
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'general'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              כללי
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'rules'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              כללי הקהילה
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'social'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              רשתות חברתיות
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'payments'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                תשלומים
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <form onSubmit={handleUpdateCommunity} className="max-w-5xl">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
                {/* Community Name */}
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">שם הקהילה</h3>
                    <p className="text-sm text-gray-500 mt-1">השם הכללי שיוצג ברחבי האתר</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="לדוגמא: יוגה למומחים"
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right text-base"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Community URL */}
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">לינק (URL)</h3>
                    <p className="text-sm text-gray-500 mt-1">הכתובת הציבורית של הקהילה</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden" dir="ltr">
                      <span className="px-4 py-3.5 bg-gray-50 text-gray-500 text-base border-r border-gray-300">kibutz.co.il/</span>
                      <div className="flex-1 p-3.5 text-left text-gray-900 text-base bg-white">
                        {communityId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">לוגו / תמונת פרופיל</h3>
                    <p className="text-sm text-gray-500 mt-1">האייקון שמייצג את הקהילה</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                    {logo ? (
                      <img
                        src={logo.preview}
                        alt="לוגו הקהילה"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                        <FaImage className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm w-44"
                      >
                        <span>העלאת תמונת לוגו</span>
                        <FaImage className="w-5 h-5" />
                      </label>
                      {logo && (
                        <button
                          type="button"
                          onClick={() => setLogo(null)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition text-sm w-44"
                        >
                          <span>מחק תמונה נוכחית</span>
                          <FaTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* Category */}
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">קטגוריה</h3>
                    <p className="text-sm text-gray-500 mt-1">עוזר לאיתור וגילוי הקהילה</p>
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full p-3.5 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right bg-white text-base appearance-none cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat === 'בחר קטגוריה' ? '' : cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">תיאור הקהילה</h3>
                    <p className="text-sm text-gray-500 mt-1">פירוט על הקהילה, למי היא מתאימה, מטרותיה ותחומי העניין שעוסקים בה</p>
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="תארו את הקהילה, מה הם הנושאים המרכזיים, מי יכול להצטרף..."
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right resize-vertical text-base"
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      maxLength={1000}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {description.length}/1000 תווים
                    </p>
                  </div>
                </div>

                {/* Community Images */}
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">תמונות הקהילה</h3>
                    <p className="text-sm text-gray-500 mt-1">תמונות שיוצגו בעמוד הקהילה</p>
                  </div>
                  <div className="flex-1">
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img.preview}
                            alt={`תמונה ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-lg border-2 ${
                              img.isPrimary ? 'border-yellow-400' : 'border-gray-200'
                            }`}
                          />
                          {img.isPrimary && (
                            <div className="absolute top-1 right-1 bg-yellow-400 text-white text-xs px-1.5 py-0.5 rounded">
                              ראשית
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className={`p-1.5 rounded-full ${
                                img.isPrimary ? 'bg-yellow-400 text-white' : 'bg-white text-gray-600 hover:text-yellow-500'
                              }`}
                            >
                              <FaStar className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImageAtIndex(index)}
                              className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-50"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition"
                  >
                    <FaImage className="text-gray-400" />
                    <span className="text-gray-600">לחץ להעלאת תמונות</span>
                  </label>
                </div>
                </div>

                {/* Delete Community - Only for owners */}
                {isOwner && (
                  <div className="flex items-center justify-between gap-6 pt-6 border-t border-gray-200">
                    <div className="flex-1">
                      <h3 className="font-medium text-base" style={{ color: '#B3261E' }}>מחיקת קהילה</h3>
                      <p className="text-sm text-gray-500 mt-1">מחיקת הקהילה תמחוק את כל התוכן, החברים, התגובות והתשלומים שנעשו בתוכה. הפעולה הזאת לא הפיכה</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="py-3 px-6 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-base hover:opacity-90 flex-shrink-0"
                      style={{ backgroundColor: '#B3261E' }}
                    >
                      <span>מחק קהילה לצמיתות</span>
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">כללי הקהילה</h3>
                    <p className="text-sm text-gray-500 mt-1">הכללים שחברי הקהילה יראו בעמוד הפיד</p>
                  </div>
                  <div className="flex-1 space-y-3">
                  {rules.length > 0 && (
                    <div className="space-y-2">
                      {rules.map((rule, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <span className="text-green-500">✓</span>
                          <span className="flex-1 text-sm text-gray-700">{rule}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(index)}
                            className="p-1 text-gray-400 hover:text-red-500 transition"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="כלל חדש..."
                      className="flex-1 p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right text-base"
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRule();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRule}
                      disabled={!newRule.trim()}
                      className="px-5 py-3.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition flex items-center gap-2 text-base"
                    >
                      <FaPlus className="w-3 h-3" />
                      הוסף
                    </button>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === 'social' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
                <div className="flex gap-8">
                  <div className="w-48 flex-shrink-0 text-right">
                    <h3 className="font-medium text-gray-900 text-base">רשתות חברתיות</h3>
                    <p className="text-sm text-gray-500 mt-1">קישורים לפרופילים החברתיים שלכם</p>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="relative">
                      <FaYoutube className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                      <input
                        type="url"
                        placeholder="קישור לערוץ YouTube"
                        className="w-full p-3.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right text-base"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <FaWhatsapp className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                      <input
                        type="url"
                        placeholder="קישור לקבוצת WhatsApp"
                        className="w-full p-3.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right text-base"
                        value={whatsappUrl}
                        onChange={(e) => setWhatsappUrl(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <FaFacebook className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" />
                      <input
                        type="url"
                        placeholder="קישור לעמוד Facebook"
                        className="w-full p-3.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right text-base"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <FaInstagram className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500" />
                      <input
                        type="url"
                        placeholder="קישור לעמוד Instagram"
                        className="w-full p-3.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right text-base"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && isOwner && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div className="flex items-center gap-42">
                  <div>
                    <h3 className="font-medium text-gray-900 text-base">מחיר חודשי</h3>
                    <p className="text-sm text-gray-500 mt-1">בחר/י אם להצטרפות לקהילה יש עלות</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="inline-flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaidCommunity(false);
                          setPrice(0);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition ${
                          !isPaidCommunity
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M15 9.5c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.5s1 2 3 2.5c2 .5 3 1.5 3 2.5s-1 2.5-3 2.5c-1.5 0-2.5-.5-3-1.5" />
                          <path d="M12 5.5v2M12 16.5v2" />
                          <path d="M4 4l16 16" strokeLinecap="round" />
                        </svg>
                        <span>חינם להצטרפות</span>
                        <div className="w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center bg-white">
                          {!isPaidCommunity && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#91DCED' }} />}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaidCommunity(true);
                          if (price < 10) setPrice(10);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition ${
                          isPaidCommunity
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-gray-400 font-medium">$</span>
                        <span>מנוי בתשלום</span>
                        <div className="w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center bg-white">
                          {isPaidCommunity && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A7EA7B' }} />}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 pt-6 border-t border-gray-200">
                  <div className={`flex-1 ${!isPaidCommunity ? 'opacity-50' : ''}`}>
                    <h3 className="font-medium text-gray-900 text-base">עלות מנוי חודשי</h3>
                    <p className="text-sm text-gray-500 mt-1">סכום החיוב החודשי (בשקלים) לכל חבר קהילה (ניתן לשנות בהמשך)</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <span className={`px-5 py-3.5 bg-gray-50 text-lg font-medium border-l border-gray-300 ${
                        isPaidCommunity ? 'text-gray-600' : 'text-gray-300'
                      }`}>₪</span>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        step="1"
                        placeholder=""
                        className={`w-108 p-3.5 text-right text-lg focus:outline-none ${
                          isPaidCommunity
                            ? 'bg-white'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                        value={isPaidCommunity ? price : ''}
                        onChange={(e) => setPrice(Math.max(10, Math.min(1000, parseInt(e.target.value) || 10)))}
                        disabled={!isPaidCommunity}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 pt-6 border-t border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-base">חיוב ותשלומים</h3>
                    {!trialCancelled && trialStartDate ? (
                      <p className="text-sm text-gray-500 mt-1">
                        תקופת הניסיון שלך (7 ימים) מסתיימת בתאריך {new Date(trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')}.
                        {` החל מ-${new Date(trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')} יחויב אמצעי התשלום שלך ב99₪ לחודש.`}
                      </p>
                    ) : trialCancelled ? (
                      <p className="text-sm text-gray-500 mt-1">תקופת הניסיון בוטלה.</p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">נהל את אמצעי התשלום שלך.</p>
                    )}
                    {cardLastFour && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                        <FaCreditCard className="text-gray-400" />
                        <span>כרטיס נוכחי: {cardBrand || 'Visa'} ************{cardLastFour}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    {!trialCancelled && trialStartDate && (
                      <button
                        type="button"
                        onClick={() => setShowCancelTrialModal(true)}
                        className="py-2.5 px-5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                      >
                        ביטול תקופת ניסיון
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCardModal(true)}
                      className="py-2.5 px-5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition text-sm"
                    >
                      עדכון אמצעי תשלום
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  messageType === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {message}
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
              <Link
                href={`/communities/feed?communityId=${communityId}`}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ביטול
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </form>

          {/* Credit Card Modal - Outside form */}
          {showCardModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md" dir="rtl">
                <button
                  type="button"
                  onClick={() => {
                    setShowCardModal(false);
                    setNewCardNumber('');
                    setNewCardExpiry('');
                    setNewCardCvv('');
                  }}
                  className="text-gray-400 hover:text-gray-600 mb-4"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-center mb-8">עדכון אמצעי תשלום</h2>
                
                {cardLastFour && (
                  <p className="text-center text-gray-600 mb-4">
                    כרטיס נוכחי: <strong>{cardBrand || 'Visa'} ************{cardLastFour}</strong>
                  </p>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">מספר כרטיס</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newCardNumber}
                        onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                          newCardNumber.length > 0 && newCardNumber.length < 16 ? 'border-red-400' : 'border-gray-300'
                        }`}
                      />
                      <FaCreditCard className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                    {newCardNumber.length > 0 && newCardNumber.length < 16 && (
                      <p className="text-red-500 text-sm mt-1">חסרות {16 - newCardNumber.length} ספרות</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">תוקף</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newCardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                            setNewCardExpiry(val);
                          }}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                            newCardExpiry.length > 0 && (newCardExpiry.length < 5 || (() => {
                              if (newCardExpiry.length !== 5) return false;
                              const [m, y] = newCardExpiry.split('/').map(Number);
                              const now = new Date();
                              const cm = now.getMonth() + 1;
                              const cy = now.getFullYear() % 100;
                              return y < cy || (y === cy && m < cm);
                            })()) ? 'border-red-400' : 'border-gray-300'
                          }`}
                        />
                        <FaCalendarAlt className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {newCardExpiry.length > 0 && newCardExpiry.length < 5 && (
                        <p className="text-red-500 text-sm mt-1">פורמט: MM/YY</p>
                      )}
                      {newCardExpiry.length === 5 && (() => {
                        const [m, y] = newCardExpiry.split('/').map(Number);
                        const now = new Date();
                        const cm = now.getMonth() + 1;
                        const cy = now.getFullYear() % 100;
                        return y < cy || (y === cy && m < cm);
                      })() && (
                        <p className="text-red-500 text-sm mt-1">הכרטיס פג תוקף</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">CVV</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newCardCvv}
                          onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                            newCardCvv.length > 0 && newCardCvv.length < 3 ? 'border-red-400' : 'border-gray-300'
                          }`}
                        />
                        <FaLock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {newCardCvv.length > 0 && newCardCvv.length < 3 && (
                        <p className="text-red-500 text-sm mt-1">חסרות {3 - newCardCvv.length} ספרות</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={async () => {
                    console.log('Save card clicked', { newCardNumber, newCardExpiry, newCardCvv });
                    if (newCardNumber.length !== 16) {
                      setMessage('מספר כרטיס חייב להכיל 16 ספרות');
                      setMessageType('error');
                      return;
                    }
                    if (newCardExpiry.length !== 5) {
                      setMessage('תוקף לא תקין');
                      setMessageType('error');
                      return;
                    }
                    // Check if expiry date is in the past
                    const [expMonth, expYear] = newCardExpiry.split('/').map(Number);
                    const now = new Date();
                    const currentMonth = now.getMonth() + 1;
                    const currentYear = now.getFullYear() % 100;
                    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
                      setMessage('הכרטיס פג תוקף');
                      setMessageType('error');
                      return;
                    }
                    if (newCardCvv.length !== 3) {
                      setMessage('CVV חייב להכיל 3 ספרות');
                      setMessageType('error');
                      return;
                    }
                    try {
                      const token = localStorage.getItem('token');
                      const lastFour = newCardNumber.slice(-4);
                      
                      // Save to community
                      const res = await fetch(`http://localhost:4000/communities/${communityId}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ 
                          cardLastFour: lastFour,
                          cardBrand: 'Visa',
                        }),
                      });
                      
                      // Also save to user payment methods
                      await fetch('http://localhost:4000/users/me/payment-methods', {
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
                      
                      if (res.ok) {
                        setCardLastFour(lastFour);
                        setCardBrand('Visa');
                        setShowCardModal(false);
                        setNewCardNumber('');
                        setNewCardExpiry('');
                        setNewCardCvv('');
                        setMessage('אמצעי התשלום עודכן בהצלחה');
                        setMessageType('success');
                      } else {
                        setMessage('שגיאה בעדכון אמצעי התשלום');
                        setMessageType('error');
                      }
                    } catch (err) {
                      console.error('Error saving card', err);
                      setMessage('שגיאה בעדכון אמצעי התשלום');
                      setMessageType('error');
                    }
                  }}
                  className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition"
                >
                  שמור כרטיס
                </button>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  הכרטיס ישמש לחיוב המנוי החודשי של הקהילה.
                </p>
              </div>
            </div>
          )}

          {/* Cancel Trial Confirmation Modal - Outside form */}
          {showCancelTrialModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full text-right" dir="rtl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">ביטול תקופת ניסיון</h2>
                <p className="text-gray-600 mb-6">
                  האם אתה בטוח שברצונך לבטל את תקופת הניסיון?
                  <br />
                  <span className="text-red-600 font-medium">לאחר הביטול, הקהילה תיסגר ולא תוכל לגבות תשלומים מהחברים.</span>
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCancelTrialModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                    disabled={cancellingTrial}
                  >
                    חזור
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setCancellingTrial(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`http://localhost:4000/communities/${communityId}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ trialCancelled: true }),
                        });
                        if (res.ok) {
                          setTrialCancelled(true);
                          setShowCancelTrialModal(false);
                          setMessage('תקופת הניסיון בוטלה בהצלחה');
                          setMessageType('success');
                        }
                      } catch {
                        setMessage('שגיאה בביטול תקופת הניסיון');
                        setMessageType('error');
                      } finally {
                        setCancellingTrial(false);
                      }
                    }}
                    disabled={cancellingTrial}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {cancellingTrial ? 'מבטל...' : 'בטל תקופת ניסיון'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && isOwner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-right" dir="rtl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">מחיקת קהילה</h2>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך למחוק את הקהילה <strong>"{community?.name}"</strong>?
              <br />
              <span className="text-red-600 font-medium">פעולה זו אינה ניתנת לביטול!</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                disabled={deleting}
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteCommunity}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {deleting ? 'מוחק...' : 'מחק לצמיתות'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
