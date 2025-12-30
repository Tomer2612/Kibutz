'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaCheck, FaChevronDown, FaChevronUp, FaClock, FaEdit, FaTrash, FaFileAlt, FaVideo, FaUsers, FaCog, FaSignOutAlt, FaUser, FaTimes, FaQuestionCircle, FaCheckCircle, FaTimesCircle, FaLink, FaImage, FaLayerGroup } from 'react-icons/fa';
import NotificationBell from '../../../../components/NotificationBell';

// Declare YouTube Player types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: {
        events?: {
          onStateChange?: (event: { data: number }) => void;
          onReady?: () => void;
        };
      }) => { destroy: () => void };
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'radio' | 'checkbox';
  order: number;
  options: QuizOption[];
}

interface LessonQuiz {
  id: string;
  questions: QuizQuestion[];
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  duration: number;
  order: number;
  lessonType: 'content' | 'quiz';
  images: string[];
  files: { name: string; url: string }[];
  links: string[];
  contentOrder: string[];
  quiz: LessonQuiz | null;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  image: string | null;
  totalLessons: number;
  totalDuration: number;
  isPublished: boolean;
  authorId: string;
  author: { id: string; name: string; profileImage: string | null };
  community: { id: string; name: string; ownerId: string; logo?: string | null };
  chapters: Chapter[];
  enrollment: { progress: number; completedAt: string | null } | null;
  lessonProgress: Record<string, boolean>;
  _count: { enrollments: number };
}

function CourseViewerContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = params.id as string;
  const courseId = params.courseId as string;
  const lessonIdFromUrl = searchParams.get('lesson');

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [completingLesson, setCompletingLesson] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [lessonStartTime, setLessonStartTime] = useState<number | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasVideoEnded, setHasVideoEnded] = useState(false);
  const [contentNeedsScroll, setContentNeedsScroll] = useState(false);
  // Track clicked links and viewed images for auto-complete
  const [clickedLinks, setClickedLinks] = useState<Set<number>>(new Set());
  const [viewedImages, setViewedImages] = useState<Set<number>>(new Set());
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  // Video facade - load iframe only when clicked
  const [videoActivated, setVideoActivated] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);

    // Read cached profile immediately
    const cached = localStorage.getItem('userProfileCache');
    if (cached) {
      try { setUserProfile(JSON.parse(cached)); } catch {}
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.sub);
        setUserEmail(payload.email);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              const profile = { name: data.name, profileImage: data.profileImage };
              setUserProfile(profile);
              localStorage.setItem('userProfileCache', JSON.stringify(profile));
            }
          })
          .catch(console.error);
      } catch (e) { console.error('Failed to decode token'); }
    }
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (course && course.chapters.length > 0) {
      // Check if user has access (enrolled or owner/author)
      const isOwnerOrAuthor = userId && (course.authorId === userId || course.community.ownerId === userId);
      if (course.enrollment || isOwnerOrAuthor) {
        setExpandedChapters(new Set(course.chapters.map(c => c.id)));
        if (lessonIdFromUrl) {
          const lesson = findLessonById(lessonIdFromUrl);
          if (lesson) { setCurrentLesson(lesson); return; }
        }
        if (course.chapters[0]?.lessons.length > 0) setCurrentLesson(course.chapters[0].lessons[0]);
      }
      
      // Auto-enroll owner/author if not already enrolled
      if (isOwnerOrAuthor && !course.enrollment) {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/enroll`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
          }).then(res => {
            if (res.ok) fetchCourse();
          }).catch(console.error);
        }
      }
    }
  }, [course, lessonIdFromUrl, userId]);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Check if all conditions are met to auto-complete
  const checkAutoComplete = useCallback(() => {
    if (!currentLesson || !course?.enrollment) return;
    if (course.lessonProgress[currentLesson.id]) return;
    if (!lessonStartTime || Date.now() - lessonStartTime < 5000) return; // 5 seconds minimum
    
    const hasVideo = !!currentLesson.videoUrl;
    const hasText = !!currentLesson.content;
    const lessonLinks = currentLesson.links || [];
    const hasLinksContent = lessonLinks.length > 0;
    const lessonImages = currentLesson.images || [];
    const hasImagesContent = lessonImages.length > 0;
    
    // Check individual conditions
    const videoComplete = !hasVideo || hasVideoEnded;
    const textComplete = !hasText || hasScrolledToBottom || !contentNeedsScroll;
    const linksComplete = !hasLinksContent || clickedLinks.size >= lessonLinks.length;
    const imagesComplete = !hasImagesContent || viewedImages.size >= lessonImages.length;
    
    // All conditions must be met
    if (videoComplete && textComplete && linksComplete && imagesComplete) {
      // At least one content type must exist
      if (hasVideo || hasText || hasLinksContent || hasImagesContent) {
        handleCompleteLesson(currentLesson.id);
      }
    }
  }, [currentLesson, course, lessonStartTime, hasVideoEnded, hasScrolledToBottom, contentNeedsScroll, clickedLinks, viewedImages]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setHasVideoEnded(true);
  }, []);

  // Initialize YouTube player when lesson changes
  useEffect(() => {
    if (!currentLesson?.videoUrl || !course?.enrollment) return;
    
    // Cleanup previous player
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          events: {
            onStateChange: (event: { data: number }) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                handleVideoEnd();
              }
            },
          },
        });
      }
    };

    // Wait for API to load
    if (window.YT && window.YT.Player) {
      setTimeout(initPlayer, 500);
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [currentLesson?.id, course?.enrollment, handleVideoEnd]);

  // Reset state when lesson changes
  useEffect(() => {
    if (!currentLesson || !course?.enrollment) return;
    if (course.lessonProgress[currentLesson.id]) return; // Already completed
    
    setLessonStartTime(Date.now());
    setHasScrolledToBottom(false);
    setHasVideoEnded(false);
    setContentNeedsScroll(false);
    // Reset quiz state
    setQuizAnswers({});
    setQuizSubmitted({});
    // Reset click/view tracking
    setClickedLinks(new Set());
    setViewedImages(new Set());
    
    // Check if content needs scroll after a short delay
    setTimeout(() => {
      if (contentRef.current) {
        const needsScroll = contentRef.current.scrollHeight > contentRef.current.clientHeight + 50;
        setContentNeedsScroll(needsScroll);
        // If no scroll needed, mark as scrolled
        if (!needsScroll) {
          setHasScrolledToBottom(true);
        }
      }
    }, 500);
  }, [currentLesson?.id]);

  // Handle content scroll
  const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!currentLesson || !course?.enrollment) return;
    if (course.lessonProgress[currentLesson.id]) return;
    
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  }, [currentLesson, course, hasScrolledToBottom]);

  // Check periodically if auto-complete conditions are met
  useEffect(() => {
    if (!currentLesson || !course?.enrollment) return;
    if (course.lessonProgress[currentLesson.id]) return;

    const checkInterval = setInterval(() => {
      checkAutoComplete();
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [currentLesson, course, checkAutoComplete]);

  // Also check immediately when conditions change
  useEffect(() => {
    checkAutoComplete();
  }, [hasVideoEnded, hasScrolledToBottom, clickedLinks, viewedImages, checkAutoComplete]);

  const findLessonById = (lessonId: string): Lesson | null => {
    if (!course) return null;
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find(l => l.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  };

  const fetchCourse = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setCourse(await res.json());
      else router.push(`/communities/${communityId}/courses`);
    } catch (err) { console.error('Failed to fetch course:', err); }
    finally { setLoading(false); }
  };

  const handleEnroll = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setEnrolling(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/enroll`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchCourse();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Enrollment failed:', res.status, errorData);
        alert('שגיאה בהרשמה לקורס: ' + (errorData.message || res.statusText));
      }
    } catch (err) { 
      console.error('Failed to enroll:', err);
      alert('שגיאה בהרשמה לקורס');
    }
    finally { setEnrolling(false); }
  };

  const handleUnenroll = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setUnenrolling(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/enroll`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowUnenrollModal(false);
        router.push(`/communities/${communityId}/courses`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Unenroll failed:', res.status, errorData);
        alert('שגיאה בביטול הרשמה: ' + (errorData.message || res.statusText));
      }
    } catch (err) { 
      console.error('Failed to unenroll:', err);
      alert('שגיאה בביטול הרשמה');
    }
    finally { setUnenrolling(false); }
  };

  const handleCompleteLesson = async (lessonId?: string) => {
    const targetLessonId = lessonId || currentLesson?.id;
    if (!targetLessonId || !course?.enrollment) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const isCompleted = course.lessonProgress[targetLessonId];
    
    // Optimistic update - immediately update UI
    setCourse(prev => {
      if (!prev) return prev;
      const newProgress = { ...prev.lessonProgress, [targetLessonId]: !isCompleted };
      const totalLessons = prev.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
      const completedLessons = Object.values(newProgress).filter(Boolean).length;
      const newProgressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return {
        ...prev,
        lessonProgress: newProgress,
        enrollment: prev.enrollment ? { ...prev.enrollment, progress: newProgressPercent } : null,
      };
    });
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/lessons/${targetLessonId}/complete`, {
        method: isCompleted ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Revert on error
        setCourse(prev => {
          if (!prev) return prev;
          return { ...prev, lessonProgress: { ...prev.lessonProgress, [targetLessonId]: isCompleted } };
        });
      }
    } catch (err) {
      console.error('Failed to toggle lesson completion:', err);
      // Revert on error
      setCourse(prev => {
        if (!prev) return prev;
        return { ...prev, lessonProgress: { ...prev.lessonProgress, [targetLessonId]: isCompleted } };
      });
    }
  };

  const handleDeleteCourse = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) router.push(`/communities/${communityId}/courses`);
    } catch (err) { console.error('Failed to delete course:', err); }
    finally { setDeleting(false); setShowDeleteModal(false); }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) newSet.delete(chapterId);
      else newSet.add(chapterId);
      return newSet;
    });
  };

  const selectLesson = (lesson: Lesson) => {
    // Allow owners/authors to view lessons without enrollment
    const canAccess = course?.enrollment || (course && userId && (course.authorId === userId || course.community.ownerId === userId));
    if (!canAccess) return;
    setCurrentLesson(lesson);
    setVideoActivated(false); // Reset video facade when changing lessons
    router.push(`/communities/${communityId}/courses/${courseId}?lesson=${lesson.id}`, { scroll: false });
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&autoplay=1`;
    return url;
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const getChapterCompletion = (chapter: Chapter) => {
    const total = chapter.lessons.length;
    const completed = chapter.lessons.filter(l => course?.lessonProgress[l.id]).length;
    return { completed, total };
  };

  const calculateProgress = (): number => {
    if (!course) return 0;
    const totalLessons = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
    if (totalLessons === 0) return 0;
    const completedLessons = Object.values(course.lessonProgress).filter(Boolean).length;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  const isOwnerOrAuthor = course && userId && (course.authorId === userId || course.community.ownerId === userId);
  const isCourseAuthor = course && userId && course.authorId === userId;
  const isVideoLesson = (lesson: Lesson) => !!lesson.videoUrl;
  const isQuizLesson = (lesson: Lesson) => lesson.lessonType === 'quiz';
  const hasImages = (lesson: Lesson) => lesson.images && lesson.images.length > 0;
  const hasLinks = (lesson: Lesson) => lesson.links && lesson.links.length > 0;
  
  const getLessonIcon = (lesson: Lesson, isCompleted: boolean) => {
    const iconClass = `w-3.5 h-3.5 ${isCompleted ? 'text-gray-700' : 'text-gray-500'}`;
    if (lesson.lessonType === 'quiz') return <FaQuestionCircle className={iconClass} />;
    // Check if combined (multiple content types)
    const contentTypes = [
      !!lesson.videoUrl,
      !!lesson.content,
      hasLinks(lesson),
      hasImages(lesson)
    ].filter(Boolean).length;
    if (contentTypes > 1) return <FaLayerGroup className={iconClass} />;
    // Single content type
    if (lesson.videoUrl) return <FaVideo className={iconClass} />;
    if (hasLinks(lesson)) return <FaLink className={iconClass} />;
    if (hasImages(lesson)) return <FaImage className={iconClass} />;
    return <FaFileAlt className={iconClass} />;
  };

  if (!course) return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-500">הקורס לא נמצא</p></div>;

  const progress = calculateProgress();

  const Navbar = () => (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200" dir="rtl">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">Kibutz</Link>
        <div className="flex items-center gap-2">
          {course.community.logo ? (
            <img src={`${process.env.NEXT_PUBLIC_API_URL}${course.community.logo}`} alt={course.community.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><FaUsers className="w-4 h-4 text-gray-400" /></div>
          )}
          <Link href={`/communities/feed?communityId=${communityId}`} className="font-medium text-black hover:underline">{course.community.name}</Link>
        </div>
      </div>
      <nav className="flex items-center gap-4">
        {[
          { label: 'עמוד בית', href: `/communities/feed?communityId=${communityId}` },
          { label: 'קורסים', href: `/communities/${communityId}/courses` },
          { label: 'חברי קהילה', href: `/communities/${communityId}/members` },
          { label: 'יומן אירועים', href: `/communities/events?communityId=${communityId}` },
          { label: 'לוח תוצאות', href: `/communities/${communityId}/leaderboard` },
          { label: 'אודות', href: `/communities/${communityId}/about` },
          ...(isOwnerOrAuthor ? [{ label: 'ניהול קהילה', href: `/communities/${communityId}/manage` }] : []),
        ].map((link) => (
          <Link key={link.label} href={link.href} className="text-sm transition px-3 py-1.5 rounded-full text-gray-500 hover:text-black hover:bg-gray-50">{link.label}</Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {userEmail && <NotificationBell />}
        {userEmail ? (
          <div className="relative">
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="relative focus:outline-none">
              {userProfile?.profileImage ? (
                <img src={`${process.env.NEXT_PUBLIC_API_URL}${userProfile.profileImage}`} alt={userProfile.name || 'User'} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-600">{userProfile?.name?.charAt(0) || userEmail.charAt(0).toUpperCase()}</div>
              )}
              <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </button>
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50" dir="rtl">
                  <button onClick={() => { setProfileMenuOpen(false); if (userId) router.push(`/profile/${userId}`); }} className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"><FaUser className="w-4 h-4" />הפרופיל שלי</button>
                  <button onClick={() => { setProfileMenuOpen(false); router.push('/settings'); }} className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"><FaCog className="w-4 h-4" />הגדרות</button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('userProfileCache'); router.push('/'); location.reload(); }} className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"><FaSignOutAlt className="w-4 h-4" />התנתקות</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/login" className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition">התחברות</Link>
        )}
      </div>
    </header>
  );

  // If not enrolled, show enrollment page
  if (!course.enrollment && !isOwnerOrAuthor) {
    return (
      <main className="min-h-screen bg-gray-100" dir="rtl">
        <Navbar />
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            {course.image && <img src={course.image.startsWith('http') ? course.image : `${process.env.NEXT_PUBLIC_API_URL}${course.image}`} alt={course.title} className="w-full h-64 object-cover rounded-xl mb-8" />}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{course.description}</p>
            <div className="flex items-center justify-center gap-6 mb-8 text-gray-500">
              <span className="flex items-center gap-2"><FaVideo className="w-5 h-5" />{course.totalLessons} שיעורים</span>
              <span className="flex items-center gap-2"><FaClock className="w-5 h-5" />{course.totalDuration} דקות</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={handleEnroll} disabled={enrolling} className="px-8 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition disabled:opacity-50 text-lg">{enrolling ? 'נרשם...' : 'הרשמה לקורס (חינם)'}</button>
              <Link href={`/communities/${communityId}/courses`} className="px-6 py-3 text-gray-600 hover:text-gray-900 transition">חזרה לקורסים</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Enrolled or Owner - show course viewer
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white" dir="rtl">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{course.title}</h2>
            <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap break-words">{course.description}</p>
            {course.enrollment && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>התקדמות</span><span className="font-medium">{progress}%</span></div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
            )}
            {isCourseAuthor && (
              <div className="flex items-center gap-2 mt-3">
                <Link href={`/communities/${communityId}/courses/${courseId}/edit`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-xs"><FaEdit className="w-3 h-3" />עריכה</Link>
                <button onClick={() => setShowDeleteModal(true)} disabled={deleting} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-xs disabled:opacity-50"><FaTrash className="w-3 h-3" />מחיקה</button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto" dir="ltr">
            <div dir="rtl">
            {course.chapters.map((chapter, chapterIndex) => {
              const { completed, total } = getChapterCompletion(chapter);
              const isExpanded = expandedChapters.has(chapter.id);
              return (
                <div key={chapter.id} className={chapterIndex > 0 ? 'border-t border-gray-200' : ''}>
                  <button onClick={() => toggleChapter(chapter.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-right">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{chapter.title}</span>
                        {completed === total && total > 0 && <span className="text-xs text-gray-600">✓ הושלם</span>}
                      </div>
                    </div>
                    {isExpanded ? <FaChevronUp className="w-3 h-3 text-gray-400" /> : <FaChevronDown className="w-3 h-3 text-gray-400" />}
                  </button>
                  {isExpanded && (
                    <div className="bg-gray-50">
                      {chapter.lessons.map((lesson, lessonIndex) => {
                        const isCompleted = course.lessonProgress[lesson.id];
                        const isCurrent = currentLesson?.id === lesson.id;
                        return (
                          <div key={lesson.id} className={`flex items-center gap-2 px-4 py-3 ${lessonIndex > 0 ? 'border-t border-gray-200' : ''} ${isCurrent ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                            <button onClick={() => selectLesson(lesson)} className="flex-1 flex items-center gap-3 text-right transition">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-gray-300' : 'bg-gray-200'}`}>
                                {getLessonIcon(lesson, isCompleted)}
                              </div>
                              <div className="flex-1 min-w-0"><p className={`text-sm truncate ${isCurrent ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{lesson.title}</p></div>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompleteLesson(lesson.id); }}
                              disabled={completingLesson}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${isCompleted ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-900'}`}
                            >
                              {isCompleted && <FaCheck className="w-3 h-3 text-white" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
          {/* Unenroll button at bottom */}
          {course.enrollment && !isOwnerOrAuthor && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowUnenrollModal(true)}
                className="w-full py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
              >
                ביטול הרשמה לקורס
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main ref={contentRef} onScroll={handleContentScroll} className="flex-1 overflow-y-auto bg-gray-100" dir="ltr">
          <div dir="rtl" className="p-4">
          {currentLesson ? (
            <div className="max-w-3xl">
              {/* Title Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h2>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {(() => {
                        if (currentLesson.lessonType === 'quiz') return <><FaQuestionCircle className="w-4 h-4" /> בוחן</>;
                        const hasVideo = !!currentLesson.videoUrl;
                        const hasText = !!currentLesson.content;
                        const hasLinks = currentLesson.links && currentLesson.links.length > 0;
                        const hasImages = currentLesson.images && currentLesson.images.length > 0;
                        const contentTypes = [hasVideo, hasText, hasLinks, hasImages].filter(Boolean).length;
                        if (contentTypes > 1) return <><FaLayerGroup className="w-4 h-4" /> שיעור משולב</>;
                        if (hasVideo) return <><FaVideo className="w-4 h-4" /> סרטון</>;
                        if (hasImages) return <><FaImage className="w-4 h-4" /> תמונות</>;
                        if (hasLinks) return <><FaLink className="w-4 h-4" /> קישורים</>;
                        return <><FaFileAlt className="w-4 h-4" /> שיעור טקסט</>;
                      })()}
                    </span>
                    <span className="flex items-center gap-1"><FaClock className="w-4 h-4" />{currentLesson.duration} דקות</span>
                  </div>
                </div>
              </div>

              {/* Video Card - only for content type lessons */}
              {currentLesson.lessonType === 'content' && (() => {
                const contentOrder = currentLesson.contentOrder || ['video', 'text', 'links', 'images'];
                
                const renderVideo = () => {
                  if (!currentLesson.videoUrl) return null;
                  const thumbnail = getYouTubeThumbnail(currentLesson.videoUrl);
                  
                  return (
                    <div key="video" className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                      <div className="aspect-video relative">
                        {videoActivated ? (
                          <iframe 
                            id="youtube-player" 
                            ref={videoRef} 
                            src={getYouTubeEmbedUrl(currentLesson.videoUrl)} 
                            className="w-full h-full" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen 
                          />
                        ) : (
                          <button
                            onClick={() => setVideoActivated(true)}
                            className="w-full h-full relative group cursor-pointer"
                          >
                            {thumbnail && (
                              <img 
                                src={thumbnail} 
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                <svg className="w-8 h-8 md:w-10 md:h-10 text-white mr-[-4px]" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                };
                
                const renderText = () => currentLesson.content ? (
                  <div key="text" className="bg-white rounded-xl shadow-sm p-6 mb-4">
                    <div className="prose prose-lg max-w-none text-right leading-relaxed" dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                  </div>
                ) : null;
                
                const renderLinks = () => currentLesson.links && currentLesson.links.length > 0 ? (
                  <div key="links" className="bg-white rounded-xl shadow-sm p-6 mb-4">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FaLink className="w-4 h-4 text-blue-500" />
                      קישורים נוספים
                    </h3>
                    <div className="space-y-2">
                      {currentLesson.links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setClickedLinks(prev => new Set([...prev, index]))}
                          className={`block hover:underline ${clickedLinks.has(index) ? 'text-gray-500' : 'text-blue-500 hover:text-blue-600'}`}
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null;
                
                const renderImages = () => currentLesson.images && currentLesson.images.length > 0 ? (
                  <div key="images" className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FaImage className="w-4 h-4 text-green-500" />
                        תמונות
                      </h3>
                    </div>
                    <div className="space-y-4 p-4">
                      {currentLesson.images.map((image, index) => (
                        <a
                          key={index}
                          href={`${image}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setViewedImages(prev => new Set([...prev, index]))}
                          className="block"
                        >
                          <div className="relative w-full" style={{ maxHeight: '500px' }}>
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${image}`}
                              alt={`תמונה ${index + 1}`}
                              className="w-full h-auto max-h-[500px] object-contain rounded-lg border border-gray-200 hover:shadow-lg transition"
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null;
                
                const renderers: Record<string, () => React.ReactNode> = {
                  video: renderVideo,
                  text: renderText,
                  links: renderLinks,
                  images: renderImages,
                };
                
                return contentOrder.map(type => renderers[type]?.());
              })()}

              {/* Quiz Card - only for quiz type lessons */}
              {currentLesson.lessonType === 'quiz' && currentLesson.quiz && (
                <div className="space-y-4">
                  {currentLesson.quiz.questions.map((question, qIndex) => {
                    const questionId = question.id;
                    const selectedAnswers = quizAnswers[questionId] || [];
                    const isSubmitted = quizSubmitted[questionId];
                    
                    const handleOptionClick = (optionId: string) => {
                      if (isSubmitted) return;
                      
                      if (question.questionType === 'radio') {
                        setQuizAnswers(prev => ({ ...prev, [questionId]: [optionId] }));
                      } else {
                        const newAnswers = selectedAnswers.includes(optionId)
                          ? selectedAnswers.filter(id => id !== optionId)
                          : [...selectedAnswers, optionId];
                        setQuizAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
                      }
                    };
                    
                    const handleCheckAnswer = () => {
                      setQuizSubmitted(prev => {
                        const newSubmitted = { ...prev, [questionId]: true };
                        
                        // Check if this answer is correct
                        const thisAnswerCorrect = selectedAnswers.length === correctOptionIds.length && 
                          selectedAnswers.every(id => correctOptionIds.includes(id));
                        
                        // If correct, check if all questions are now answered correctly
                        if (thisAnswerCorrect && currentLesson?.quiz) {
                          const allQuestionsCorrect = currentLesson.quiz.questions.every(q => {
                            if (q.id === questionId) return thisAnswerCorrect;
                            const qCorrectIds = q.options.filter(o => o.isCorrect).map(o => o.id);
                            const qAnswers = quizAnswers[q.id] || [];
                            const isQSubmitted = newSubmitted[q.id];
                            return isQSubmitted && qAnswers.length === qCorrectIds.length && 
                              qAnswers.every(id => qCorrectIds.includes(id));
                          });
                          
                          // Auto-complete quiz if all correct
                          if (allQuestionsCorrect && !course?.lessonProgress[currentLesson.id]) {
                            setTimeout(() => handleCompleteLesson(currentLesson.id), 500);
                          }
                        }
                        
                        return newSubmitted;
                      });
                    };
                    
                    const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
                    const isCorrect = isSubmitted && 
                      selectedAnswers.length === correctOptionIds.length && 
                      selectedAnswers.every(id => correctOptionIds.includes(id));
                    
                    return (
                      <div key={questionId} className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center font-bold text-sm">
                            {qIndex + 1}
                          </span>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{question.question}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {question.questionType === 'radio' ? 'בחר תשובה אחת' : 'בחר את כל התשובות הנכונות'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {question.options.map((option) => {
                            const isSelected = selectedAnswers.includes(option.id);
                            // Only show correct answers as green when user got the question correct
                            const showCorrect = isSubmitted && isCorrect && option.isCorrect;
                            // Show wrong for selected options that are incorrect
                            const showWrong = isSubmitted && isSelected && !option.isCorrect;
                            // Show selected-but-wrong styling for selected correct options when answer is wrong
                            const showSelectedWrong = isSubmitted && !isCorrect && isSelected && option.isCorrect;
                            
                            return (
                              <button
                                key={option.id}
                                onClick={() => handleOptionClick(option.id)}
                                disabled={isSubmitted}
                                className={`w-full p-4 rounded-lg border-2 text-right transition flex items-center gap-3 ${
                                  isSubmitted
                                    ? showCorrect
                                      ? 'border-green-500 bg-green-50'
                                      : showWrong
                                        ? 'border-red-500 bg-red-50'
                                        : showSelectedWrong
                                          ? 'border-gray-400 bg-gray-100'
                                          : isSelected
                                            ? 'border-gray-400 bg-gray-100'
                                            : 'border-gray-200 bg-gray-50'
                                    : isSelected
                                      ? 'border-gray-900 bg-gray-100'
                                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSubmitted
                                    ? showCorrect
                                      ? 'border-green-500 bg-green-500'
                                      : showWrong
                                        ? 'border-red-500 bg-red-500'
                                        : 'border-gray-300'
                                    : isSelected
                                      ? 'border-gray-900 bg-gray-900'
                                      : 'border-gray-300'
                                }`}>
                                  {isSubmitted ? (
                                    showCorrect ? <FaCheckCircle className="w-4 h-4 text-white" /> : showWrong ? <FaTimesCircle className="w-4 h-4 text-white" /> : null
                                  ) : (
                                    isSelected && <FaCheck className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <span className={`flex-1 ${
                                  isSubmitted
                                    ? showCorrect
                                      ? 'text-green-700 font-medium'
                                      : showWrong
                                        ? 'text-red-700'
                                        : 'text-gray-600'
                                    : 'text-gray-700'
                                }`}>
                                  {option.text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {!isSubmitted && selectedAnswers.length > 0 && (
                          <button
                            onClick={handleCheckAnswer}
                            className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
                          >
                            בדוק תשובה
                          </button>
                        )}
                        
                        {isSubmitted && (
                          <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isCorrect ? (
                                  <>
                                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="font-bold text-green-700">נכון! כל הכבוד! 🎉</span>
                                  </>
                                ) : (
                                  <>
                                    <FaTimesCircle className="w-5 h-5 text-red-500" />
                                    <span className="font-bold text-red-700">לא נכון, נסה שוב</span>
                                  </>
                                )}
                              </div>
                              {!isCorrect && (
                                <button
                                  onClick={() => {
                                    setQuizAnswers(prev => ({ ...prev, [questionId]: [] }));
                                    setQuizSubmitted(prev => ({ ...prev, [questionId]: false }));
                                  }}
                                  className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
                                >
                                  נסה שוב
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-73px)]"><p className="text-gray-500">בחר שיעור מהתפריט</p></div>
          )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" dir="rtl">
            <button
              onClick={() => !deleting && setShowDeleteModal(false)}
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
                האם אתה בטוח שברצונך למחוק את הקורס <span className="font-semibold">"{course?.title}"</span>?
                <br />
                <span className="text-red-500 text-sm">פעולה זו לא ניתנת לביטול.</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
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

      {/* Unenroll Confirmation Modal */}
      {showUnenrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !unenrolling && setShowUnenrollModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" dir="rtl">
            <button
              onClick={() => !unenrolling && setShowUnenrollModal(false)}
              className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-full transition"
              disabled={unenrolling}
            >
              <FaTimes className="w-5 h-5 text-gray-400" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ביטול הרשמה לקורס</h3>
              <p className="text-gray-600 mb-6">
                האם אתה בטוח שברצונך לבטל את ההרשמה לקורס <span className="font-semibold">"{course?.title}"</span>?
                <br />
                <span className="text-orange-500 text-sm">ההתקדמות שלך בקורס תימחק.</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowUnenrollModal(false)}
                  disabled={unenrolling}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  השאר אותי רשום
                </button>
                <button
                  onClick={handleUnenroll}
                  disabled={unenrolling}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {unenrolling ? 'מבטל...' : 'בטל הרשמה'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <CourseViewerContent />
    </Suspense>
  );
}
