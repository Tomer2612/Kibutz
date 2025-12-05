'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { FaUsers, FaFileAlt, FaImage, FaCog, FaSignOutAlt, FaYoutube, FaWhatsapp, FaFacebook, FaInstagram, FaTimes, FaStar } from 'react-icons/fa';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

interface ImageFile {
  file: File;
  preview: string;
  isPrimary: boolean;
}

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Social links
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  
  // Logo
  const [logo, setLogo] = useState<{ file: File; preview: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Images
  const [images, setImages] = useState<ImageFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token.split('.').length !== 3) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserEmail(decoded.email);
      
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo({ file, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
    
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: ImageFile[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ImageFile = {
          file,
          preview: reader.result as string,
          isPrimary: images.length === 0 && newImages.length === 0, // First image is primary
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
      newImages.push({ file, preview: '', isPrimary: false }); // temp tracking
    });
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
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

  const handleCreateCommunity = async (e: React.FormEvent) => {
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
        formData.append('logo', logo.file);
      }
      
      // Social links
      if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl);
      if (whatsappUrl) formData.append('whatsappUrl', whatsappUrl);
      if (facebookUrl) formData.append('facebookUrl', facebookUrl);
      if (instagramUrl) formData.append('instagramUrl', instagramUrl);
      
      // Primary image
      const primaryImage = images.find(img => img.isPrimary);
      if (primaryImage) {
        formData.append('image', primaryImage.file);
      }
      
      // Gallery images (non-primary)
      const galleryImages = images.filter(img => !img.isPrimary);
      galleryImages.forEach(img => {
        formData.append('galleryImages', img.file);
      });

      const res = await fetch('http://localhost:4000/communities', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create community');
      }

      const community = await res.json();
      setMessage('הקהילה נוצרה בהצלחה!');
      setMessageType('success');
      setTimeout(() => {
        router.push(`/communities/${community.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Community creation error:', err);
      setMessage(err.message || 'שגיאה ביצירת הקהילה');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    location.reload();
  };

  if (!userEmail) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-100">
        <p className="text-gray-600">מתחברים...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
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
              <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50" dir="rtl">
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
      </header>

      {/* Form Section */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">צרו קהילה חדשה</h1>
            <p className="text-gray-600">הקימו קהילה עם עניינים משותפים</p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <form
              onSubmit={handleCreateCommunity}
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
                תמונות הקהילה (אופציונלי)
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
                          onClick={() => removeImage(index)}
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
                href="/communities/feed"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ביטול
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'יוצר...' : 'צור קהילה'}
              </button>
            </div>
            </form>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm w-full lg:w-80 lg:self-start lg:flex-none">
              <h3 className="font-bold text-blue-900 mb-2">טיפים ליצירת קהילה מוצלחת:</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-right">
                <li>• בחרו שם מדוייק ומזמין</li>
                <li>• תארו בבירור את מטרת הקהילה</li>
                <li>• עודדו מעורבות ושיח מכבד</li>
                <li>• טפחו תרבות חיובית ושקופה</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
