'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaClock, FaBook, FaPlus, FaPlay, FaUsers, FaSearch, FaCog, FaSignOutAlt, FaUser, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import NotificationBell from '../../../components/NotificationBell';

interface Course {
  id: string;
  title: string;
  description: string;
  image: string | null;
  duration: number;
  totalLessons: number;
  totalDuration: number;
  isPublished: boolean;
  author: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  enrollment: {
    progress: number;
    completedAt: string | null;
  } | null;
  _count: {
    enrollments: number;
  };
}

interface Community {
  id: string;
  name: string;
  ownerId: string;
  logo?: string | null;
}

export default function CoursesPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [courses, setCourses] = useState<Course[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [isOwnerOrManager, setIsOwnerOrManager] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; courseId: string | null; courseTitle: string }>({ open: false, courseId: null, courseTitle: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.sub);
        setUserEmail(payload.email);
        
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
        console.error('Failed to decode token');
      }
    }

    fetchCommunity();
    fetchCourses();
  }, [communityId]);

  useEffect(() => {
    if (community && userId) {
      checkPermissions();
    }
  }, [community, userId]);

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`http://localhost:4000/communities/${communityId}`);
      if (res.ok) {
        const data = await res.json();
        setCommunity(data);
      }
    } catch (err) {
      console.error('Failed to fetch community:', err);
    }
  };

  const checkPermissions = async () => {
    const token = localStorage.getItem('token');
    if (!token || !community) return;

    // Check if owner
    if (community.ownerId === userId) {
      setIsOwnerOrManager(true);
      return;
    }

    // Check if manager
    try {
      const res = await fetch(`http://localhost:4000/communities/${communityId}/membership`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.role === 'MANAGER' || data.role === 'OWNER') {
          setIsOwnerOrManager(true);
        }
      }
    } catch (err) {
      console.error('Failed to check membership:', err);
    }
  };

  const fetchCourses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/courses/community/${communityId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} שעות`;
    return `${hours} שעות ו-${mins} דקות`;
  };

  const openDeleteModal = (courseId: string, courseTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({ open: true, courseId, courseTitle });
  };

  const handleDeleteCourse = async () => {
    if (!deleteModal.courseId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:4000/courses/${deleteModal.courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== deleteModal.courseId));
        setDeleteModal({ open: false, courseId: null, courseTitle: '' });
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
    } finally {
      setDeleting(false);
    }
  };

  const canEditCourse = (course: Course) => {
    if (!userId) return false;
    // Only the course author can edit/delete
    return course.author.id === userId;
  };
  const inProgressCourses = courses.filter(c => c.enrollment && !c.enrollment.completedAt);
  const completedCourses = courses.filter(c => c.enrollment?.completedAt);
  const allCourses = courses.filter(c => c.isPublished || c.author.id === userId);

  const displayedCourses = activeTab === 'all'
    ? allCourses
    : activeTab === 'in-progress' 
      ? inProgressCourses
      : completedCourses;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header with community navbar */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        {/* Right side: Kibutz Logo + Community */}
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
            { label: 'קורסים', href: `/communities/${communityId}/courses`, active: true },
            { label: 'חברי קהילה', href: `/communities/${communityId}/members` },
            { label: 'יומן אירועים', href: `/communities/events?communityId=${communityId}` },
            { label: 'לוח תוצאות', href: `/communities/${communityId}/leaderboard` },
            { label: 'אודות', href: `/communities/${communityId}/about` },
            ...(isOwnerOrManager ? [{ label: 'ניהול קהילה', href: `/communities/${communityId}/manage` }] : []),
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

        {/* Left side: Search + User Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש"
              className="pl-4 pr-10 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-gray-400 w-32"
            />
          </div>
          
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
                    {userProfile?.name?.charAt(0) || userEmail.charAt(0).toUpperCase()}
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

      {/* Sub header with tabs and create button */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'all'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              כל הקורסים
            </button>
            <button
              onClick={() => setActiveTab('in-progress')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'in-progress'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              קורסים בתהליך
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'completed'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              קורסים שהושלמו
            </button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {displayedCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBook className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {activeTab === 'completed' 
                ? 'עדיין לא השלמת קורסים' 
                : activeTab === 'in-progress'
                  ? 'עדיין לא התחלת קורסים או שהשלמת את כולם'
                  : 'אין קורסים זמינים'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'completed' 
                ? 'המשך ללמוד והקורסים שתשלים יופיעו כאן'
                : activeTab === 'in-progress'
                  ? 'הירשם לקורס מלשונית "כל הקורסים"'
                  : isOwnerOrManager 
                    ? 'צור את הקורס הראשון שלך'
                    : 'בקרוב יתווספו קורסים חדשים'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition group border border-gray-100 relative"
              >
                {/* Edit/Delete Buttons for Owner/Author */}
                {canEditCourse(course) && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1">
                    <Link
                      href={`/communities/${communityId}/courses/${course.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white/90 hover:bg-white text-gray-600 rounded-lg shadow-sm transition"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={(e) => openDeleteModal(course.id, course.title, e)}
                      className="p-2 bg-white/90 hover:bg-white text-red-500 rounded-lg shadow-sm transition"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Course Image - Clickable */}
                <Link href={`/communities/${communityId}/courses/${course.id}`} className="block">
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {course.image ? (
                      <Image
                        src={course.image.startsWith('http') ? course.image : `http://localhost:4000${course.image}`}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                        <FaBook className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <FaPlay className="w-6 h-6 text-gray-800 mr-[-2px]" />
                      </div>
                    </div>

                    {/* Unpublished badge */}
                    {!course.isPublished && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                        טיוטה
                      </div>
                    )}
                  </div>
                </Link>

                {/* Course Info - Clickable */}
                <Link href={`/communities/${communityId}/courses/${course.id}`} className="block p-5 overflow-hidden no-underline">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 truncate">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px] break-words overflow-hidden">
                    {course.description}
                  </p>

                  {/* Duration and Lessons - Grey badges */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                      <FaClock className="w-3.5 h-3.5 flex-shrink-0" />
                      {formatDuration(course.totalDuration)}
                    </span>
                    <span className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                      <FaBook className="w-3.5 h-3.5 flex-shrink-0" />
                      {course.totalLessons} שיעורים
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">התקדמות</span>
                      <span className="font-semibold text-gray-700">{Math.round(course.enrollment?.progress || 0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${course.enrollment?.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setDeleteModal({ open: false, courseId: null, courseTitle: '' })} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" dir="rtl">
            <button
              onClick={() => !deleting && setDeleteModal({ open: false, courseId: null, courseTitle: '' })}
              className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-full transition"
              disabled={deleting}
            >
              <FaTimes className="w-5 h-5 text-gray-400" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">מחיקת קורס</h3>
              <p className="text-gray-600 mb-6">
                האם אתה בטוח שברצונך למחוק את הקורס <span className="font-semibold">"{deleteModal.courseTitle}"</span>?
                <br />
                <span className="text-red-500 text-sm">פעולה זו לא ניתנת לביטול.</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteModal({ open: false, courseId: null, courseTitle: '' })}
                  disabled={deleting}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  ביטול
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={deleting}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? 'מוחק...' : 'מחק קורס'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
