'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaFileAlt, FaImage, FaCog, FaSignOutAlt, FaTrash, FaSearch, FaYoutube, FaWhatsapp, FaFacebook, FaInstagram, FaTimes, FaStar, FaPlus, FaLock, FaUser } from 'react-icons/fa';

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
}

interface ImageFile {
  file?: File;
  preview: string;
  isPrimary: boolean;
  isExisting: boolean;
  existingPath?: string;
}

export default function ManageCommunityPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
  const [savingRules, setSavingRules] = useState(false);
  
  // Price
  const [price, setPrice] = useState<number>(0);

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
        setYoutubeUrl(data.youtubeUrl || '');
        setWhatsappUrl(data.whatsappUrl || '');
        setFacebookUrl(data.facebookUrl || '');
        setInstagramUrl(data.instagramUrl || '');
        setRules(data.rules || []);
        setPrice(data.price ?? 0);
        
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

  const handleSaveRules = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSavingRules(true);
      const res = await fetch(`http://localhost:4000/communities/${communityId}/rules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rules }),
      });

      if (!res.ok) {
        throw new Error('Failed to save rules');
      }

      setMessage('כללי הקהילה נשמרו בהצלחה!');
      setMessageType('success');
    } catch (err) {
      console.error('Save rules error:', err);
      setMessage('שגיאה בשמירת הכללים');
      setMessageType('error');
    } finally {
      setSavingRules(false);
    }
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
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
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
            { label: 'קורס', href: '#' },
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

        {/* Left side: Search + Profile */}
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

      {/* Form Section */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ניהול קהילה</h1>
            <p className="text-gray-600">ערוך את פרטי הקהילה שלך</p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <form
              onSubmit={handleUpdateCommunity}
              className="flex-1 bg-white rounded-lg shadow-md p-8 space-y-6"
            >
              {/* Community Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  שם הקהילה *
                </label>
                <div className="relative">
                  <FaUsers className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="לדוגמא: יוגה למומחים"
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">עד 100 תווים</p>
              </div>

              {/* Community Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  לוגו הקהילה (אופציונלי)
                </label>
                <p className="text-xs text-gray-500 mb-3 text-right">
                  תמונת לוגו מרובעת מומלצת (JPG, PNG, GIF עד 5MB)
                </p>
                <div className="flex items-center gap-4">
                  {logo ? (
                    <div className="relative group">
                      <img
                        src={logo.preview}
                        alt="לוגו הקהילה"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setLogo(null)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <FaImage className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1">
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
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm"
                    >
                      <FaImage className="text-gray-400" />
                      <span className="text-gray-600">{logo ? 'החלף לוגו' : 'העלה לוגו'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  מחיר חודשי (₪)
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₪</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="0 = חינם"
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {price === 0 ? 'הקהילה תהיה חינמית' : `מחיר: ₪${price} לחודש`}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  תיאור הקהילה *
                </label>
                <div className="relative">
                  <FaFileAlt className="absolute right-3 top-4 text-gray-400" />
                  <textarea
                    placeholder="תארו את הקהילה, מה הם הנושאים המרכזיים, מי יכול להצטרף..."
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right resize-vertical"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    maxLength={1000}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/1000 תווים
                </p>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  קישורים לרשתות חברתיות (אופציונלי)
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <FaYoutube className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                    <input
                      type="url"
                      placeholder="קישור לערוץ YouTube"
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <FaWhatsapp className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    <input
                      type="url"
                      placeholder="קישור לקבוצת WhatsApp"
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                      value={whatsappUrl}
                      onChange={(e) => setWhatsappUrl(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <FaFacebook className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input
                      type="url"
                      placeholder="קישור לעמוד Facebook"
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <FaInstagram className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500" />
                    <input
                      type="url"
                      placeholder="קישור לעמוד Instagram"
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Community Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  תמונות הקהילה
                </label>
                <p className="text-xs text-gray-500 mb-3 text-right">
                  לחץ על הכוכב כדי לבחור תמונה ראשית. תמונות בגודל עד 5MB (JPG, PNG, GIF)
                </p>
                
                {/* Image Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
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
                            title="הגדר כראשית"
                          >
                            <FaStar className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImageAtIndex(index)}
                            className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-50"
                            title="הסר תמונה"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="relative">
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

              {/* Message Display */}
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    messageType === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
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

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 lg:self-start lg:flex-none space-y-4">
              {/* Community Rules Panel */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaLock className="w-4 h-4 text-gray-500" />
                  כללי הקהילה
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  הגדירו את הכללים שחברי הקהילה יראו בעמוד הפיד
                </p>
                
                {/* Existing Rules */}
                {rules.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {rules.map((rule, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="flex-1 text-sm text-gray-700">{rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(index)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                          title="הסר כלל"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Rule */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="כלל חדש..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right text-sm"
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
                    className="px-3 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition flex items-center gap-1 text-sm"
                  >
                    <FaPlus className="w-3 h-3" />
                    הוסף
                  </button>
                </div>
                
                {rules.length === 0 && (
                  <p className="mt-3 text-xs text-gray-400 text-center">הכללים יישמרו עם "שמור שינויים"</p>
                )}
              </div>

              {/* Danger Zone - Only visible to owners */}
              {isOwner && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  <FaTrash className="w-4 h-4" />
                  אזור מסוכן
                </h3>
                <p className="text-sm text-red-800 mb-4">
                  מחיקת הקהילה היא פעולה בלתי הפיכה. כל הפוסטים, התגובות והחברים יימחקו לצמיתות.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaTrash className="w-4 h-4" />
                  מחק קהילה
                </button>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

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
