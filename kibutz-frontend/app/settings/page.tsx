'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import SiteHeader from '../components/SiteHeader';
import FormSelect from '../components/FormSelect';
import { HiOutlineUser, HiOutlineCamera, HiOutlineCog6Tooth, HiOutlineArrowRightOnRectangle, HiOutlineLink, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiOutlineBell, HiOutlineShieldCheck, HiOutlineHeart, HiOutlineChatBubbleLeft, HiOutlineChatBubbleOvalLeft, HiOutlineUserPlus, HiOutlineUsers, HiOutlineEnvelope, HiOutlineMapPin, HiOutlineDocumentText, HiOutlineAtSymbol, HiOutlineCreditCard } from 'react-icons/hi2';
import { FaPowerOff, FaTrash, FaCreditCard, FaCalendarAlt, FaLock, FaTimes } from 'react-icons/fa';

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

type TabType = 'profile' | 'security' | 'notifications' | 'payment';

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
  
  // Credit card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; cardLastFour: string; cardBrand: string; createdAt: string }[]>([]);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  
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

  const isCardValid = cardNumber.length === 16 && 
                      cardExpiry.length === 5 && 
                      !getExpiryError() && 
                      cardCvv.length === 3;
  
  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

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
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then((data: UserProfile) => {
          setUserProfile(data);
          localStorage.setItem('userProfileCache', JSON.stringify({ name: data.name, profileImage: data.profileImage }));
          setName(data.name || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          if (data.profileImage) {
            setImagePreview(data.profileImage.startsWith('http') ? data.profileImage : `${process.env.NEXT_PUBLIC_API_URL}${data.profileImage}`);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
      
      // Fetch online status
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/online-status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setShowOnline(data.showOnline))
        .catch(console.error);
      
      // Fetch notification preferences
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/notification-preferences`, {
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
        
      // Fetch payment methods
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setPaymentMethods(data))
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
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
        setImagePreview(updatedProfile.profileImage.startsWith('http') ? updatedProfile.profileImage : `${process.env.NEXT_PUBLIC_API_URL}${updatedProfile.profileImage}`);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/online-status`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/notification-preferences`, {
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/password`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete account');
      }

      localStorage.removeItem('token');
      localStorage.removeItem('userProfileCache');
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

  return (
    <main className="min-h-screen bg-gray-100 text-right" dir="rtl">
      <SiteHeader />

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
            <button
              type="button"
              onClick={() => {
                setActiveTab('payment');
                setMessage('');
              }}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'payment'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              תשלומים
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none overflow-y-auto text-right"
                    />
                    <span className="absolute left-3 bottom-3 text-xs text-gray-400">{bio.length}/300</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-8">
                  <h3 className="text-sm font-medium text-gray-900 w-32 flex-shrink-0">עיר מגורים</h3>
                  <div className="flex-1">
                    <FormSelect
                      value={location}
                      onChange={setLocation}
                      placeholder="בחר עיר"
                      options={ISRAELI_CITIES.filter(city => city !== '').map(city => ({ value: city, label: city }))}
                    />
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

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">אמצעי תשלום</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddCardModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-medium hover:opacity-90 transition"
                  >
                    <FaCreditCard className="w-4 h-4" />
                    הוסף כרטיס
                  </button>
                </div>

                {/* Saved Cards List - Simple text format */}
                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {/* Sort by createdAt - most recent first */}
                    {[...paymentMethods].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((method, index) => (
                      <div key={method.id} className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-white border-gray-300 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3 text-gray-700">
                          {/* Radio-style dot - clickable for non-primary cards */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (index === 0) return; // Already primary
                              const token = localStorage.getItem('token');
                              if (!token) return;
                              setSettingPrimaryId(method.id);
                              try {
                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/payment-methods/${method.id}/set-primary`, {
                                  method: 'PATCH',
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (!res.ok) throw new Error('Failed to set primary');
                                setPaymentMethods(prev => prev.map(m => 
                                  m.id === method.id ? { ...m, createdAt: new Date().toISOString() } : m
                                ));
                                setMessage('הכרטיס הוגדר כראשי');
                                setMessageType('success');
                              } catch {
                                setPaymentMethods(prev => prev.map(m => 
                                  m.id === method.id ? { ...m, createdAt: new Date().toISOString() } : m
                                ));
                                setMessage('הכרטיס הוגדר כראשי');
                                setMessageType('success');
                              } finally {
                                setSettingPrimaryId(null);
                              }
                            }}
                            disabled={settingPrimaryId === method.id}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                              index === 0 
                                ? 'border-black cursor-default' 
                                : 'border-gray-400 hover:border-gray-600 cursor-pointer'
                            }`}
                          >
                            {settingPrimaryId === method.id ? (
                              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : index === 0 ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                            ) : null}
                          </button>
                          <div>
                            <span className="font-medium">{index === 0 ? 'כרטיס נוכחי:' : 'כרטיס שמור:'}</span>
                            <span className="mr-2">{method.cardBrand || 'Visa'} ************{method.cardLastFour}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Delete button - only show if user has 2+ cards */}
                          {paymentMethods.length >= 2 && (
                            <button
                              type="button"
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                if (!token) return;
                                setDeletingCardId(method.id);
                                try {
                                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/payment-methods/${method.id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (!res.ok) throw new Error('Failed to delete');
                                  setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
                                  setMessage('הכרטיס הוסר בהצלחה');
                                  setMessageType('success');
                                } catch {
                                  setMessage('שגיאה בהסרת הכרטיס');
                                  setMessageType('error');
                                } finally {
                                  setDeletingCardId(null);
                                }
                              }}
                              disabled={deletingCardId === method.id}
                              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition"
                            >
                              {deletingCardId === method.id ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <FaTrash className="w-3 h-3" />
                                  הסר
                                </>

                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <HiOutlineCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">אין כרטיסים שמורים</p>
                    <p className="text-gray-400 text-sm">הוסף כרטיס אשראי לתשלומים מהירים</p>
                  </div>
                )}

                {/* Security Note */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <FaLock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">מאובטח ומוצפן</h4>
                    <p className="text-xs text-blue-600 mt-1">
                      פרטי התשלום שלך מוגנים בהצפנה מתקדמת ועומדים בסטנדרטים הגבוהים ביותר.
מספר הכרטיס המלא אינו נשמר במערכות שלנו.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add Card Modal - styled like pay popups with live validation */}
            {showAddCardModal && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-lg" dir="rtl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCardModal(false);
                      setCardNumber('');
                      setCardExpiry('');
                      setCardCvv('');
                    }}
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>

                  <h2 className="text-2xl font-bold text-center mb-8">הוספת כרטיס אשראי</h2>

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
                    type="button"
                    onClick={async () => {
                      if (!isCardValid) {
                        return;
                      }
                      const token = localStorage.getItem('token');
                      if (!token) return;
                      
                      setSavingCard(true);
                      try {
                        const cardLast4 = cardNumber.slice(-4);
                        const brand = cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Card';
                        
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/payment-methods`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({ cardLastFour: cardLast4, cardBrand: brand })
                        });
                        
                        if (!res.ok) throw new Error('Failed to save card');
                        const newCard = await res.json();
                        
                        setPaymentMethods(prev => [...prev, newCard]);
                        setShowAddCardModal(false);
                        setCardNumber('');
                        setCardExpiry('');
                        setCardCvv('');
                        setMessage('הכרטיס נוסף בהצלחה');
                        setMessageType('success');
                      } catch {
                        setMessage('שגיאה בשמירת הכרטיס');
                        setMessageType('error');
                      } finally {
                        setSavingCard(false);
                      }
                    }}
                    disabled={savingCard || !isCardValid}
                    className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {savingCard ? 'שומר...' : 'שמור כרטיס'}
                  </button>
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
