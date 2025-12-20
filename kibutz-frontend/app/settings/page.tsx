'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import Image from 'next/image';
import { FaUser, FaEnvelope, FaCamera, FaCog, FaSignOutAlt, FaCheck, FaLink, FaUnlink, FaLock, FaEye, FaEyeSlash, FaPowerOff, FaArrowRight, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';

// Israeli cities list
const ISRAELI_CITIES = [
  '',
  'תל אביב',
  'ירושלים',
  'חיפה',
  'באר שבע',
  'ראשון לציון',
  'פתח תקווה',
  'אשדוד',
  'נתניה',
  'חולון',
  'בת ים',
  'בני ברק',
  'רמת גן',
  'אשקלון',
  'רחובות',
  'הרצליה',
  'כפר סבא',
  'ביתר עילית',
  'מודיעין',
  'נזרת עילית',
  'לוד',
  'רמלה',
  'רעננה',
  'הוד השרון',
  'עפולה',
  'נהריה',
  'קרית',
  'אילת',
  'טבריה',
  'עכו',
  'צפת',
  'דימונה',
  'קרית אתא',
  'קרית גת',
  'קרית ביאליק',
  'קרית מלאכי',
  'קרית מוצקין',
  'קרית אונו',
  'קרית שמונה',
  'יבנה',
  'אור יהודה',
  'אור עקיבא',
  'גבעתיים',
  'נס ציונה',
  'סדרות',
  'עפרה',
  'כפר קסם',
  'כרמיאל',
  'טירת הכרמל',
  'מעלות אדומים',
  'מעלות תרשיחא',
  'שדרות',
  'נתיבות',
  'אחר',
];

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  googleConnected: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [settingOffline, setSettingOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Notification preferences state
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyFollows, setNotifyFollows] = useState(true);
  const [notifyNewPosts, setNotifyNewPosts] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyCommunityJoins, setNotifyCommunityJoins] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordMessageType, setPasswordMessageType] = useState<'error' | 'success'>('error');

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
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then((data: UserProfile) => {
          setUserProfile(data);
          setName(data.name || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          if (data.profileImage) {
            setImagePreview(`http://localhost:4000${data.profileImage}`);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
      
      // Fetch online status
      fetch('http://localhost:4000/users/me/online-status', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setShowOnline(data.showOnline))
        .catch(console.error);
      
      // Fetch notification preferences
      fetch('http://localhost:4000/users/me/notification-preferences', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setNotifyLikes(data.notifyLikes ?? true);
          setNotifyComments(data.notifyComments ?? true);
          setNotifyFollows(data.notifyFollows ?? true);
          setNotifyNewPosts(data.notifyNewPosts ?? true);
          setNotifyMentions(data.notifyMentions ?? true);
          setNotifyCommunityJoins(data.notifyCommunityJoins ?? true);
          setNotifyMessages(data.notifyMessages ?? true);
        })
        .catch(console.error);
    } catch (e) {
      console.error('Invalid token:', e);
      router.push('/login');
    }
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const formData = new FormData();
      if (name.trim()) {
        formData.append('name', name.trim());
      }
      if (bio.trim()) {
        formData.append('bio', bio.trim());
      }
      if (location) {
        formData.append('location', location);
      }
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const res = await fetch('http://localhost:4000/users/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedProfile = await res.json();
      setUserProfile(updatedProfile);
      setProfileImage(null);
      
      // Update the preview with the new image from server
      if (updatedProfile.profileImage) {
        setImagePreview(`http://localhost:4000${updatedProfile.profileImage}`);
      }
      
      // Also save notification preferences
      await fetch('http://localhost:4000/users/me/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notifyLikes,
          notifyComments,
          notifyFollows,
          notifyNewPosts,
          notifyMentions,
          notifyCommunityJoins,
          notifyMessages,
        }),
      });
      
      // Redirect to profile page after successful save
      router.push(`/profile/${userId}`);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setMessage(err.message || 'שגיאה בעדכון הפרופיל');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = () => {
    // Store current token to maintain session after Google auth
    const token = localStorage.getItem('token');
    if (token) {
      localStorage.setItem('pendingGoogleLink', token);
    }
    window.location.href = 'http://localhost:4000/auth/google?linkAccount=true';
  };

  const handleDisconnectGoogle = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setDisconnectingGoogle(true);
      const res = await fetch('http://localhost:4000/users/me/google', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to disconnect Google');
      }

      const updatedProfile = await res.json();
      setUserProfile(updatedProfile);
      setMessage('חשבון Google נותק בהצלחה');
      setMessageType('success');
    } catch (err: any) {
      console.error('Google disconnect error:', err);
      setMessage('שגיאה בניתוק חשבון Google');
      setMessageType('error');
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleToggleOnlineStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSettingOffline(true);
      const res = await fetch('http://localhost:4000/users/me/online-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ showOnline: !showOnline }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle online status');
      }

      const data = await res.json();
      setShowOnline(data.showOnline);
      setMessage(data.showOnline ? 'הסטטוס שונה למחובר' : 'הסטטוס שונה ללא מחובר');
      setMessageType('success');
    } catch (err: any) {
      console.error('Toggle online status error:', err);
      setMessage('שגיאה בשינוי סטטוס');
      setMessageType('error');
    } finally {
      setSettingOffline(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSavingNotifications(true);
      const res = await fetch('http://localhost:4000/users/me/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notifyLikes,
          notifyComments,
          notifyFollows,
          notifyNewPosts,
          notifyMentions,
          notifyCommunityJoins,
          notifyMessages,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save notification preferences');
      }

      setMessage('העדפות התראות נשמרו בהצלחה');
      setMessageType('success');
    } catch (err: any) {
      console.error('Save notification preferences error:', err);
      setMessage('שגיאה בשמירת העדפות התראות');
      setMessageType('error');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('יש למלא את כל השדות');
      setPasswordMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      setPasswordMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('הסיסמאות אינן תואמות');
      setPasswordMessageType('error');
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMessage('');

      const res = await fetch('http://localhost:4000/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      setPasswordMessage('הסיסמה שונתה בהצלחה!');
      setPasswordMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordMessage(err.message || 'שגיאה בשינוי הסיסמה');
      setPasswordMessageType('error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (deleteConfirmText !== 'מחק את החשבון שלי') {
      setMessage('יש להקליד את הטקסט המדויק לאישור');
      setMessageType('error');
      return;
    }

    try {
      setDeletingAccount(true);
      const res = await fetch('http://localhost:4000/users/me', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete account');
      }

      // Clear token
      localStorage.removeItem('token');
      
      // Show success message and redirect after delay
      setMessage('מחיקת המשתמש עברה בהצלחה');
      setMessageType('success');
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      console.error('Delete account error:', err);
      setMessage('שגיאה במחיקת החשבון');
      setMessageType('error');
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-100">
        <p className="text-gray-600">טוען...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
        </div>
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="relative focus:outline-none"
          >
            {imagePreview ? (
              <img 
                src={imagePreview}
                alt={name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-600">
                {name?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`absolute bottom-0 left-0 w-3 h-3 border-2 border-white rounded-full ${showOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
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
      </header>

      {/* Form Section */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">הגדרות משתמש</h1>
            <p className="text-gray-600">עדכנו את פרטי הפרופיל שלכם</p>
          </div>

          {/* Two column layout for cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column - Profile Form */}
            <div className="space-y-6">
              {/* Profile Form Card */}
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-8 space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">פרטי פרופיל</h2>
                
                {/* Profile Image */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    {imagePreview ? (
                      <img 
                        src={imagePreview}
                        alt={name || 'User'}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-pink-100 flex items-center justify-center text-4xl font-bold text-pink-600 border-4 border-gray-100">
                        {name?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition shadow-lg"
                    >
                      <FaCamera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">לחצו על הכפתור לשינוי תמונה</p>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    אימייל
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full p-3 pr-10 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-right cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">האימייל לא ניתן לשינוי</p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    שם מלא
                  </label>
                  <div className="relative">
                    <FaUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="הזינו את שמכם המלא"
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Bio/Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    תיאור
                  </label>
                  <textarea
                    placeholder="ספרו על עצמכם..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right resize-none"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-left">{bio.length}/500</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    עיר מגורים
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right appearance-none bg-white"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option value="">בחרו עיר</option>
                      {ISRAELI_CITIES.filter(city => city).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">שינוי סיסמה</h3>
                  
                  {/* Current Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      סיסמה נוכחית
                    </label>
                    <div className="relative">
                      <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="הזינו את הסיסמה הנוכחית"
                        className="w-full p-3 pr-10 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      סיסמה חדשה
                    </label>
                    <div className="relative">
                      <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="הזינו סיסמה חדשה (לפחות 6 תווים)"
                        className="w-full p-3 pr-10 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      אישור סיסמה חדשה
                    </label>
                    <div className="relative">
                      <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="הזינו שוב את הסיסמה החדשה"
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-right"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Change Button */}
                  {(currentPassword || newPassword || confirmPassword) && (
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className={`w-full mt-4 py-2 rounded-lg font-medium transition text-sm ${
                        changingPassword
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {changingPassword ? 'משנה סיסמה...' : 'שנה סיסמה'}
                    </button>
                  )}

                  {/* Password Message */}
                  {passwordMessage && (
                    <div
                      className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                        passwordMessageType === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {passwordMessageType === 'success' && <FaCheck className="w-4 h-4" />}
                      {passwordMessage}
                    </div>
                  )}
                </div>

                {/* Message Display */}
                {message && (
                  <div
                    className={`p-4 rounded-lg flex items-center gap-2 ${
                      messageType === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {messageType === 'success' && <FaCheck className="w-4 h-4" />}
                    {message}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:opacity-90'
                  }`}
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </form>
            </div>

            {/* Right column - Connected Accounts & Online Status */}
            <div className="space-y-6">
              {/* Connected Accounts Card */}
              <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">חשבונות מקושרים</h2>
                
                {/* Google Account */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                      <Image 
                        src="https://developers.google.com/identity/images/g-logo.png" 
                        alt="Google" 
                        width={24} 
                        height={24}
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Google</p>
                      <p className="text-sm text-gray-500">
                        {userProfile?.googleConnected ? 'מחובר' : 'לא מחובר'}
                      </p>
                    </div>
                  </div>
                  
                  {userProfile?.googleConnected ? (
                    <button
                      onClick={handleDisconnectGoogle}
                      disabled={disconnectingGoogle}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      <FaUnlink className="w-4 h-4" />
                      {disconnectingGoogle ? 'מנתק...' : 'נתק חשבון'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                    >
                      <FaLink className="w-4 h-4" />
                      קשר חשבון
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  קישור חשבון Google מאפשר התחברות מהירה יותר
                </p>
              </div>

              {/* Online Status Card */}
              <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">סטטוס מחובר</h2>
                
                <div className={`flex items-center justify-between p-4 border rounded-lg ${!showOnline ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!showOnline ? 'bg-gray-200' : 'bg-green-100'}`}>
                      <div className={`w-4 h-4 rounded-full ${!showOnline ? 'bg-gray-400' : 'bg-green-500'}`}></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">הסטטוס שלי</p>
                      <p className="text-sm text-gray-500">
                        {!showOnline ? 'כרגע מוצג כלא מחובר' : 'כרגע מוצג כמחובר לכל חברי הקהילות'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleToggleOnlineStatus}
                    disabled={settingOffline}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition disabled:opacity-50 ${
                      showOnline 
                        ? 'text-gray-600 border-gray-200 hover:bg-gray-50'
                        : 'text-green-600 border-green-200 hover:bg-green-50'
                    }`}
                  >
                    <FaPowerOff className="w-4 h-4" />
                    {settingOffline ? 'משנה...' : (showOnline ? 'הפוך ללא מחובר' : 'הפוך למחובר')}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  {!showOnline 
                    ? 'לחץ על הכפתור כדי לחזור להופיע כמחובר'
                    : 'לחיצה תסתיר אותך מרשימת המחוברים עד שתשנה חזרה'
                  }
                </p>
              </div>

              {/* Notification Preferences Card */}
              <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">העדפות התראות</h2>
                
                <div className="space-y-4">
                  {/* Likes */}
                  <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-lg">❤️</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">לייקים</p>
                        <p className="text-sm text-gray-500">קבל התראה כשמישהו אוהב את הפוסט שלך</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyLikes}
                      onChange={(e) => setNotifyLikes(e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </label>

                  {/* Comments */}
                  <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-lg">💬</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">תגובות</p>
                        <p className="text-sm text-gray-500">קבל התראה כשמישהו מגיב על הפוסט שלך</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyComments}
                      onChange={(e) => setNotifyComments(e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </label>

                  {/* Follows */}
                  <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">עוקבים חדשים</p>
                        <p className="text-sm text-gray-500">קבל התראה כשמישהו מתחיל לעקוב אחריך</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyFollows}
                      onChange={(e) => setNotifyFollows(e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </label>

                  {/* New Posts */}
                  <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-lg">📝</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">פוסטים חדשים</p>
                        <p className="text-sm text-gray-500">קבל התראה כשמישהו שאתה עוקב אחריו מפרסם</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyNewPosts}
                      onChange={(e) => setNotifyNewPosts(e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </label>

                  {/* Mentions */}
                  <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <span className="text-lg">@</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">אזכורים</p>
                        <p className="text-sm text-gray-500">קבל התראה כשמישהו מזכיר אותך בתגובה</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyMentions}
                      onChange={(e) => setNotifyMentions(e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </label>

                  {/* Community Joins */}
                  <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-lg">👥</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">הצטרפות לקהילה</p>
                        <p className="text-sm text-gray-500">קבל התראה כשמישהו מצטרף לקהילה שלך</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyCommunityJoins}
                      onChange={(e) => setNotifyCommunityJoins(e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </label>

                  {/* Direct Messages */}
                  <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-lg">✉️</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">הודעות פרטיות</p>
                        <p className="text-sm text-gray-500">קבל התראה כשמישהו שולח לך הודעה</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyMessages}
                      onChange={(e) => setNotifyMessages(e.target.checked)}
                      className="w-5 h-5 accent-black"
                    />
                  </label>
                </div>
              </div>

              {/* Delete Account Card */}
              <div className="bg-white rounded-lg shadow-md p-8 space-y-6 border border-red-100">
                <h2 className="text-xl font-semibold text-red-600 border-b border-red-100 pb-3">מחיקת חשבון</h2>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">
                    <strong>אזהרה:</strong> מחיקת החשבון היא פעולה בלתי הפיכה. כל הנתונים שלך יימחקו לצמיתות, כולל:
                  </p>
                  <ul className="text-red-600 text-sm mt-2 list-disc list-inside space-y-1">
                    <li>כל הפוסטים שפרסמת</li>
                    <li>כל התגובות שכתבת</li>
                    <li>החברויות בקהילות</li>
                    <li>הקהילות שאתה הבעלים שלהן</li>
                  </ul>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                  >
                    <FaTrash className="w-4 h-4" />
                    אני רוצה למחוק את החשבון שלי
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 text-center">
                      לאישור, הקלד: <strong className="text-red-600">מחק את החשבון שלי</strong>
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="הקלד כאן לאישור..."
                      className="w-full p-3 border border-red-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500"
                      dir="rtl"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount || deleteConfirmText !== 'מחק את החשבון שלי'}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaTrash className="w-4 h-4" />
                        {deletingAccount ? 'מוחק...' : 'מחק לצמיתות'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
