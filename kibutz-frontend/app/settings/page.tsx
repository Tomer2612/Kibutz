'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import NotificationBell from '../components/NotificationBell';
import { HiOutlineUser, HiOutlineCamera, HiOutlineCog6Tooth, HiOutlineArrowRightOnRectangle, HiOutlineLink, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiOutlineBell, HiOutlineShieldCheck, HiOutlineHeart, HiOutlineChatBubbleLeft, HiOutlineChatBubbleOvalLeft, HiOutlineUserPlus, HiOutlineUsers, HiOutlineEnvelope, HiOutlineMapPin, HiOutlineDocumentText, HiOutlineAtSymbol } from 'react-icons/hi2';
import { FaPowerOff, FaTrash, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

// Password requirements (same as signup)
const passwordRequirements = [
  { id: 'length', label: 'לפחות 6 תווים', test: (p: string) => p.length >= 6 },
  { id: 'letter', label: 'לפחות אות אחת', test: (p: string) => /[a-zA-Z]/.test(p) },
  { id: 'number', label: 'לפחות מספר אחד', test: (p: string) => /[0-9]/.test(p) },
];

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
  isGoogleAccount?: boolean;
}

type TabType = 'profile' | 'security' | 'notifications';

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

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
      
      if (updatedProfile.profileImage) {
        setImagePreview(`http://localhost:4000${updatedProfile.profileImage}`);
      }
      
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

  const saveNotificationPreference = async (key: string, value: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:4000/users/me/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [key]: value,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save notification preferences');
      }
    } catch (err: any) {
      console.error('Save notification preference error:', err);
    }
  };

  const toggleNotifyLikes = () => {
    const newValue = !notifyLikes;
    setNotifyLikes(newValue);
    saveNotificationPreference('notifyLikes', newValue);
  };

  const toggleNotifyComments = () => {
    const newValue = !notifyComments;
    setNotifyComments(newValue);
    saveNotificationPreference('notifyComments', newValue);
  };

  const toggleNotifyFollows = () => {
    const newValue = !notifyFollows;
    setNotifyFollows(newValue);
    saveNotificationPreference('notifyFollows', newValue);
  };

  const toggleNotifyNewPosts = () => {
    const newValue = !notifyNewPosts;
    setNotifyNewPosts(newValue);
    saveNotificationPreference('notifyNewPosts', newValue);
  };

  const toggleNotifyMentions = () => {
    const newValue = !notifyMentions;
    setNotifyMentions(newValue);
    saveNotificationPreference('notifyMentions', newValue);
  };

  const toggleNotifyCommunityJoins = () => {
    const newValue = !notifyCommunityJoins;
    setNotifyCommunityJoins(newValue);
    saveNotificationPreference('notifyCommunityJoins', newValue);
  };

  const toggleNotifyMessages = () => {
    const newValue = !notifyMessages;
    setNotifyMessages(newValue);
    saveNotificationPreference('notifyMessages', newValue);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('יש למלא את כל השדות');
      setMessageType('error');
      return;
    }

    // Check all password requirements
    const requirementsMet = passwordRequirements.every(req => req.test(newPassword));
    if (!requirementsMet) {
      setMessage('הסיסמה החדשה חייבת להכיל לפחות 6 תווים, אות אחת ומספר אחד');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('הסיסמאות אינן תואמות');
      setMessageType('error');
      return;
    }

    if (newPassword === currentPassword) {
      setMessage('הסיסמה החדשה לא יכולה להיות זהה לסיסמה הנוכחית');
      setMessageType('error');
      return;
    }

    try {
      setChangingPassword(true);
      setMessage('');

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

      setMessage('הסיסמה שונתה בהצלחה!');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setMessage(err.message || 'שגיאה בשינוי הסיסמה');
      setMessageType('error');
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

      localStorage.removeItem('token');
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
    <main className="min-h-screen bg-gray-100 text-right" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-gray-600 hover:text-black transition px-3 py-1.5 rounded-full hover:bg-gray-50"
          >
            מחירון
          </Link>
          <Link
            href="/support"
            className="text-gray-600 hover:text-black transition px-3 py-1.5 rounded-full hover:bg-gray-50"
          >
            תמיכה ושאלות
          </Link>
          <NotificationBell />
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
              <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
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
                  onClick={() => setProfileMenuOpen(false)}
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
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Right Sidebar - Settings Tabs */}
        <aside className="w-64 bg-white border-l border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineCog6Tooth className="w-5 h-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">הגדרות</h2>
          </div>
          
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setMessage('');
              }}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'profile'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              פרטי פרופיל
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setMessage('');
              }}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'security'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              אבטחה
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('notifications');
                setMessage('');
              }}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'notifications'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              התראות
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <form onSubmit={handleSubmit} className="max-w-3xl">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-8">
                  <h3 className="text-sm font-medium text-gray-900 w-32 flex-shrink-0">תמונת פרופיל</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center text-xl font-bold text-pink-600 border-2 border-gray-200">
                          {name?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition"
                      >
                        <HiOutlineCamera className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="text-sm text-gray-500">
                      <p>לחצו על האייקון לשינוי התמונה</p>
                      <p className="text-xs text-gray-400">JPG, PNG עד 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-8">
                  <h3 className="text-sm font-medium text-gray-900 w-32 flex-shrink-0">אימייל</h3>
                  <div className="flex-1 relative">
                    <HiOutlineEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={userEmail || ''}
                      disabled
                      className="w-full pr-11 pl-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="flex items-center gap-8">
                  <h3 className="text-sm font-medium text-gray-900 w-32 flex-shrink-0">שם מלא</h3>
                  <div className="flex-1 relative">
                    <HiOutlineUser className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 50))}
                      placeholder="שם מלא"
                      maxLength={50}
                      className="w-full pr-11 pl-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">{name.length}/50</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="flex items-start gap-8">
                  <div className="w-32 flex-shrink-0">
                    <h3 className="text-sm font-medium text-gray-900">תיאור</h3>
                    <p className="text-xs text-gray-500">ספרו על עצמכם</p>
                  </div>
                  <div className="flex-1 min-w-[400px] relative">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 300))}
                      placeholder="ספרו על עצמכם"
                      maxLength={300}
                      rows={5}
                      dir="rtl"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none overflow-y-auto"
                      style={{ direction: 'rtl' }}
                    />
                    <span className="absolute left-3 bottom-3 text-xs text-gray-400">{bio.length}/300</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-8">
                  <h3 className="text-sm font-medium text-gray-900 w-32 flex-shrink-0">עיר מגורים</h3>
                  <div className="flex-1 relative">
                    <HiOutlineMapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pr-11 pl-10 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white appearance-none cursor-pointer"
                    >
                      {ISRAELI_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city || 'בחר עיר'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Online Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">הסטטוס שלי</h3>
                    <p className="text-xs text-gray-500">כרגע מוצג כמחובר לכל חברי הקהילות</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleOnlineStatus}
                    disabled={settingOffline}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    <FaPowerOff className="w-4 h-4 text-gray-600" />
                    {showOnline ? 'הפוך ללא מחובר' : 'הפוך למחובר'}
                    <div 
                      className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                      style={{ backgroundColor: showOnline ? '#A7EA7B' : '#D1D5DB' }} 
                    />
                  </button>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {saving ? 'שומר...' : 'שמור שינויים'}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                {/* Change Password Section */}
                <div className={userProfile?.isGoogleAccount ? 'opacity-50 pointer-events-none' : ''}>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">שינוי סיסמא</h3>
                  {userProfile?.isGoogleAccount && (
                    <p className="text-sm text-gray-500 mb-4">לא ניתן לשנות סיסמא עבור חשבונות Google</p>
                  )}
                
                  {/* Current Password */}
                  <div className="flex items-center gap-8 mb-4">
                    <div className="w-40 flex-shrink-0">
                      <h4 className="text-sm font-medium text-gray-900">סיסמא נוכחית</h4>
                      <p className="text-xs text-gray-500">הזינו את הסיסמא הנוכחית</p>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={userProfile?.isGoogleAccount}
                        className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-gray-400 text-sm disabled:bg-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <HiOutlineEye className="w-5 h-5" /> : <HiOutlineEyeSlash className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="flex items-center gap-8 mb-4">
                    <div className="w-40 flex-shrink-0">
                      <h4 className="text-sm font-medium text-gray-900">סיסמא חדשה</h4>
                      <p className="text-xs text-gray-500">הזינו את הסיסמא החדשה</p>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={userProfile?.isGoogleAccount}
                        className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-gray-400 text-sm disabled:bg-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <HiOutlineEye className="w-5 h-5" /> : <HiOutlineEyeSlash className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex items-center gap-8 mb-4">
                    <div className="w-40 flex-shrink-0">
                      <h4 className="text-sm font-medium text-gray-900">אישור סיסמא חדשה</h4>
                      <p className="text-xs text-gray-500">הזינו שוב את הסיסמא החדשה</p>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={userProfile?.isGoogleAccount}
                        className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-gray-400 text-sm disabled:bg-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <HiOutlineEye className="w-5 h-5" /> : <HiOutlineEyeSlash className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={changingPassword || userProfile?.isGoogleAccount}
                      className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 text-sm"
                    >
                      {changingPassword ? 'משנה...' : 'שנה סיסמא'}
                    </button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">מחיקת חשבון</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        מחיקת החשבון היא פעולה בלתי הפיכה. כל הנתונים שלך יימחקו לצמיתות, כולל:
                      </p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
                        <li>כל הפוסטים שפרסמת</li>
                        <li>הקהילות שאתה הבעלים שלהן</li>
                        <li>כל התגובות שכתבת</li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition text-sm text-white hover:opacity-90 flex-shrink-0"
                      style={{ backgroundColor: '#B3261E' }}
                    >
                      אני רוצה למחוק את החשבון שלי
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="space-y-6">
                  {/* Likes */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">לייקים</h4>
                      <p className="text-xs text-gray-500">קבל התראה כשמישהו אוהב את הפוסט שלך</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotifyLikes}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineHeart className="w-5 h-5 text-gray-400" />
                      {notifyLikes ? 'בטל התראות' : 'הפעל התראות'}
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                        style={{ backgroundColor: notifyLikes ? '#A7EA7B' : '#D1D5DB' }} 
                      />
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">תגובות</h4>
                      <p className="text-xs text-gray-500">קבל התראה כשמישהו מגיב על הפוסט שלך</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotifyComments}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineChatBubbleOvalLeft className="w-5 h-5 text-gray-400" />
                      {notifyComments ? 'בטל התראות' : 'הפעל התראות'}
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                        style={{ backgroundColor: notifyComments ? '#A7EA7B' : '#D1D5DB' }} 
                      />
                    </button>
                  </div>

                  {/* New Followers */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">עוקבים חדשים</h4>
                      <p className="text-xs text-gray-500">קבל התראה כשמישהו מתחיל לעקוב אחריך</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotifyFollows}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineUsers className="w-5 h-5 text-gray-400" />
                      {notifyFollows ? 'בטל התראות' : 'הפעל התראות'}
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                        style={{ backgroundColor: notifyFollows ? '#A7EA7B' : '#D1D5DB' }} 
                      />
                    </button>
                  </div>

                  {/* New Posts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">פוסטים חדשים</h4>
                      <p className="text-xs text-gray-500">קבל התראה כשמישהו שאתה עוקב אחריו מפרסם</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotifyNewPosts}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                      {notifyNewPosts ? 'בטל התראות' : 'הפעל התראות'}
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                        style={{ backgroundColor: notifyNewPosts ? '#A7EA7B' : '#D1D5DB' }} 
                      />
                    </button>
                  </div>

                  {/* Mentions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">אזכורים</h4>
                      <p className="text-xs text-gray-500">קבל התראה כשמישהו מזכיר אותך בתגובה</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotifyMentions}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineAtSymbol className="w-5 h-5 text-gray-400" />
                      {notifyMentions ? 'בטל התראות' : 'הפעל התראות'}
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                        style={{ backgroundColor: notifyMentions ? '#A7EA7B' : '#D1D5DB' }} 
                      />
                    </button>
                  </div>

                  {/* Community Joins */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">הצטרפות לקהילה</h4>
                      <p className="text-xs text-gray-500">קבל התראה כשמישהו מצטרף לקהילה שלך</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotifyCommunityJoins}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineUserPlus className="w-5 h-5 text-gray-400" />
                      {notifyCommunityJoins ? 'בטל התראות' : 'הפעל התראות'}
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                        style={{ backgroundColor: notifyCommunityJoins ? '#A7EA7B' : '#D1D5DB' }} 
                      />
                    </button>
                  </div>

                  {/* Private Messages */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">הודעות פרטיות</h4>
                      <p className="text-xs text-gray-500">קבל התראה כשמישהו שולח לך הודעה</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNotifyMessages}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <HiOutlineChatBubbleLeft className="w-5 h-5 text-gray-400" />
                      {notifyMessages ? 'בטל התראות' : 'הפעל התראות'}
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-gray-900" 
                        style={{ backgroundColor: notifyMessages ? '#A7EA7B' : '#D1D5DB' }} 
                      />
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
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6" dir="rtl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">אישור מחיקת חשבון</h3>
            <p className="text-gray-600 mb-4">
              פעולה זו בלתי הפיכה. כדי לאשר, הקלידו: <strong>&quot;מחק את החשבון שלי&quot;</strong>
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="הקלידו כאן"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== 'מחק את החשבון שלי'}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deletingAccount ? 'מוחק...' : 'מחק לצמיתות'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
