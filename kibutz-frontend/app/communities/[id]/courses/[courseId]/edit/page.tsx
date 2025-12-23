'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaPlus, FaTrash, FaGripVertical, FaImage, FaSave, FaPlay, FaChevronDown, FaChevronUp, FaCog, FaSignOutAlt, FaUser, FaVideo, FaFileAlt, FaLink, FaQuestionCircle, FaCheckCircle, FaTimes, FaLayerGroup, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import NotificationBell from '../../../../../components/NotificationBell';

interface QuizOptionForm {
  id?: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface QuizQuestionForm {
  id?: string;
  question: string;
  questionType: 'radio' | 'checkbox';
  order: number;
  options: QuizOptionForm[];
}

interface LessonForm {
  id?: string;
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  order: number;
  lessonType: 'content' | 'quiz';
  images: string[];
  imageFiles: File[];
  files: { name: string; url: string }[];
  links: string[];
  quiz: {
    questions: QuizQuestionForm[];
  } | null;
  contentOrder: ('video' | 'text' | 'images' | 'links')[];
  isNew?: boolean;
  isDeleted?: boolean;
  expanded?: boolean;
}

interface ChapterForm {
  id?: string;
  title: string;
  order: number;
  lessons: LessonForm[];
  isNew?: boolean;
  isDeleted?: boolean;
  expanded: boolean;
}

interface CourseForm {
  id: string;
  title: string;
  description: string;
  image: string | null;
  newImage: File | null;
  imagePreview: string | null;
  chapters: ChapterForm[];
  isPublished: boolean;
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const courseId = params.courseId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<CourseForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Validation constants
  const MAX_TITLE_LENGTH = 20;
  const MAX_DESCRIPTION_LENGTH = 100;
  const MAX_CHAPTER_TITLE_LENGTH = 80;
  const MAX_LESSON_TITLE_LENGTH = 80;
  const MAX_LESSON_DURATION = 480;
  const MIN_LESSON_DURATION = 1;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

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
      router.push('/login');
    }

    fetchCourse();
  }, [courseId, router]);

  const fetchCourse = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/courses/${courseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCourse({
          id: data.id,
          title: data.title,
          description: data.description || '',
          image: data.image,
          newImage: null,
          imagePreview: data.image ? `http://localhost:4000${data.image}` : null,
          isPublished: data.isPublished,
          chapters: data.chapters.map((c: any) => ({
            id: c.id,
            title: c.title,
            order: c.order,
            expanded: true,
            lessons: c.lessons.map((l: any) => ({
              id: l.id,
              title: l.title,
              content: l.content || '',
              videoUrl: l.videoUrl || '',
              duration: l.duration,
              order: l.order,
              lessonType: l.lessonType || 'content',
              images: l.images || [],
              imageFiles: [],
              files: l.files || [],
              links: l.links || [],
              quiz: l.quiz ? {
                questions: l.quiz.questions.map((q: any, qIndex: number) => ({
                  id: q.id,
                  question: q.question,
                  questionType: q.questionType,
                  order: q.order ?? qIndex,
                  options: q.options.map((opt: any, optIndex: number) => ({
                    id: opt.id,
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: opt.order ?? optIndex,
                  })),
                })),
              } : null,
            })),
          })),
        });
      } else {
        router.push(`/communities/${communityId}/courses`);
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => {
    if (!course) return;
    setCourse(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: [
          ...prev.chapters,
          {
            title: `פרק ${prev.chapters.filter(c => !c.isDeleted).length + 1}`,
            order: prev.chapters.length,
            lessons: [],
            isNew: true,
            expanded: true,
          },
        ],
      };
    });
  };

  const updateChapter = (index: number, updates: Partial<ChapterForm>) => {
    if (!course) return;
    setCourse(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((c, i) => (i === index ? { ...c, ...updates } : c)),
      };
    });
  };

  const removeChapter = (index: number) => {
    if (!course) return;
    const chapter = course.chapters[index];
    if (chapter.isNew) {
      setCourse(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          chapters: prev.chapters.filter((_, i) => i !== index),
        };
      });
    } else {
      updateChapter(index, { isDeleted: true });
    }
  };

  const toggleChapter = (index: number) => {
    if (!course) return;
    updateChapter(index, { expanded: !course.chapters[index].expanded });
  };

  const toggleLesson = (chapterIndex: number, lessonIndex: number) => {
    if (!course) return;
    updateLesson(chapterIndex, lessonIndex, { expanded: !course.chapters[chapterIndex].lessons[lessonIndex].expanded });
  };

  const addLesson = (chapterIndex: number) => {
    if (!course) return;
    setCourse(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((chapter, i) =>
          i === chapterIndex
            ? {
                ...chapter,
                lessons: [
                  ...chapter.lessons,
                  {
                    title: `שיעור ${chapter.lessons.filter(l => !l.isDeleted).length + 1}`,
                    content: '',
                    videoUrl: '',
                    duration: 10,
                    order: chapter.lessons.length,
                    lessonType: 'content' as const,
                    images: [],
                    imageFiles: [],
                    files: [],
                    links: [],
                    quiz: null,
                    contentOrder: ['video', 'text', 'images', 'links'],
                    isNew: true,
                    expanded: true,
                  },
                ],
              }
            : chapter
        ),
      };
    });
  };

  const updateLesson = (chapterIndex: number, lessonIndex: number, updates: Partial<LessonForm>) => {
    if (!course) return;
    setCourse(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((chapter, ci) =>
          ci === chapterIndex
            ? {
                ...chapter,
                lessons: chapter.lessons.map((lesson, li) =>
                  li === lessonIndex ? { ...lesson, ...updates } : lesson
                ),
              }
            : chapter
        ),
      };
    });
  };

  const removeLesson = (chapterIndex: number, lessonIndex: number) => {
    if (!course) return;
    const lesson = course.chapters[chapterIndex].lessons[lessonIndex];
    if (lesson.isNew) {
      setCourse(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          chapters: prev.chapters.map((chapter, ci) =>
            ci === chapterIndex
              ? {
                  ...chapter,
                  lessons: chapter.lessons.filter((_, li) => li !== lessonIndex),
                }
              : chapter
          ),
        };
      });
    } else {
      updateLesson(chapterIndex, lessonIndex, { isDeleted: true });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCourse(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          newImage: file,
          imagePreview: URL.createObjectURL(file),
        };
      });
    }
  };

  const validateForm = (): boolean => {
    if (!course) return false;
    const newErrors: Record<string, string> = {};

    // Course title validation
    if (!course.title.trim()) {
      newErrors.title = 'שם הקורס הוא שדה חובה';
    } else if (course.title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `שם הקורס לא יכול להכיל יותר מ-${MAX_TITLE_LENGTH} תווים`;
    }

    // Description validation
    if (course.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `התיאור לא יכול להכיל יותר מ-${MAX_DESCRIPTION_LENGTH} תווים`;
    }

    // At least one chapter required
    const activeChapters = course.chapters.filter(c => !c.isDeleted);
    if (activeChapters.length === 0) {
      newErrors.chapters = 'יש להוסיף לפחות פרק אחד';
    }

    // Chapters and lessons validation
    activeChapters.forEach((chapter, ci) => {
      const chapterIndex = course.chapters.findIndex(c => c === chapter);
      if (!chapter.title.trim()) {
        newErrors[`chapter_${chapterIndex}_title`] = 'שם הפרק הוא שדה חובה';
      } else if (chapter.title.length > MAX_CHAPTER_TITLE_LENGTH) {
        newErrors[`chapter_${chapterIndex}_title`] = `שם הפרק לא יכול להכיל יותר מ-${MAX_CHAPTER_TITLE_LENGTH} תווים`;
      }

      // At least one lesson per chapter required
      const activeLessons = chapter.lessons.filter(l => !l.isDeleted);
      if (activeLessons.length === 0) {
        newErrors[`chapter_${chapterIndex}_lessons`] = 'יש להוסיף לפחות שיעור אחד';
      }

      activeLessons.forEach((lesson, li) => {
        const lessonIndex = chapter.lessons.findIndex(l => l === lesson);
        if (!lesson.title.trim()) {
          newErrors[`lesson_${chapterIndex}_${lessonIndex}_title`] = 'שם השיעור הוא שדה חובה';
        } else if (lesson.title.length > MAX_LESSON_TITLE_LENGTH) {
          newErrors[`lesson_${chapterIndex}_${lessonIndex}_title`] = `שם השיעור לא יכול להכיל יותר מ-${MAX_LESSON_TITLE_LENGTH} תווים`;
        }

        if (!lesson.duration || lesson.duration < MIN_LESSON_DURATION) {
          newErrors[`lesson_${chapterIndex}_${lessonIndex}_duration`] = `משך השיעור חייב להיות לפחות ${MIN_LESSON_DURATION} דקה`;
        } else if (lesson.duration > MAX_LESSON_DURATION) {
          newErrors[`lesson_${chapterIndex}_${lessonIndex}_duration`] = `משך השיעור לא יכול לעלות על ${MAX_LESSON_DURATION} דקות`;
        }

        // Quiz validation
        if (lesson.lessonType === 'quiz') {
          if (!lesson.quiz || lesson.quiz.questions.length === 0) {
            newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz`] = 'בוחן חייב להכיל לפחות שאלה אחת';
          } else {
            lesson.quiz.questions.forEach((question, qi) => {
              if (!question.question.trim()) {
                newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qi}_question`] = `שאלה ${qi + 1}: יש להזין טקסט לשאלה`;
              }
              
              if (question.questionType === 'radio') {
                // Radio: at least 2 options, exactly 1 correct
                if (question.options.length < 2) {
                  newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qi}_options`] = `שאלה ${qi + 1}: נדרשות לפחות 2 אפשרויות`;
                }
                const correctCount = question.options.filter(o => o.isCorrect).length;
                if (correctCount !== 1) {
                  newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qi}_correct`] = `שאלה ${qi + 1}: יש לבחור תשובה נכונה אחת`;
                }
                // Check all options have text
                question.options.forEach((opt, oi) => {
                  if (!opt.text.trim()) {
                    newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qi}_opt_${oi}`] = `שאלה ${qi + 1}: אפשרות ${oi + 1} חייבת להכיל טקסט`;
                  }
                });
              } else if (question.questionType === 'checkbox') {
                // Checkbox: at least 4 options, at least 2 correct
                if (question.options.length < 4) {
                  newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qi}_options`] = `שאלה ${qi + 1}: נדרשות לפחות 4 אפשרויות לבחירה מרובה`;
                }
                const correctCount = question.options.filter(o => o.isCorrect).length;
                if (correctCount < 2) {
                  newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qi}_correct`] = `שאלה ${qi + 1}: יש לבחור לפחות 2 תשובות נכונות`;
                }
                // Check all options have text
                question.options.forEach((opt, oi) => {
                  if (!opt.text.trim()) {
                    newErrors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qi}_opt_${oi}`] = `שאלה ${qi + 1}: אפשרות ${oi + 1} חייבת להכיל טקסט`;
                  }
                });
              }
            });
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToFirstError = (errorObj: Record<string, string>) => {
    const errorKeys = Object.keys(errorObj);
    if (errorKeys.length === 0) return;
    
    const firstErrorKey = errorKeys[0];
    let elementId = '';
    
    if (firstErrorKey === 'title') {
      elementId = 'course-title';
    } else if (firstErrorKey === 'description') {
      elementId = 'course-description';
    } else if (firstErrorKey === 'chapters') {
      elementId = 'chapters-section';
    } else if (firstErrorKey.startsWith('chapter_')) {
      const match = firstErrorKey.match(/chapter_(\d+)/);
      if (match) elementId = `chapter-${match[1]}`;
    } else if (firstErrorKey.startsWith('lesson_')) {
      const match = firstErrorKey.match(/lesson_(\d+)_(\d+)/);
      if (match) elementId = `lesson-${match[1]}-${match[2]}`;
    }
    
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus?.();
      }
    }
  };

  const handleSave = async () => {
    if (!course) return;
    
    const newErrors: Record<string, string> = {};
    
    if (!validateForm()) {
      // Need to wait for state update
      setTimeout(() => scrollToFirstError(errors), 100);
      return;
    }

    setSaving(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Helper function to upload lesson images
    const uploadLessonImages = async (lesson: LessonForm): Promise<string[]> => {
      const uploadedImageUrls: string[] = [...(lesson.images || [])];
      if (lesson.imageFiles && lesson.imageFiles.length > 0) {
        for (const file of lesson.imageFiles) {
          const imageFormData = new FormData();
          imageFormData.append('image', file);
          const uploadRes = await fetch('http://localhost:4000/courses/lessons/upload-image', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: imageFormData,
          });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            uploadedImageUrls.push(url);
          }
        }
      }
      return uploadedImageUrls;
    };

    try {
      // Update course details
      const formData = new FormData();
      formData.append('title', course.title);
      formData.append('description', course.description);
      formData.append('isPublished', 'true');
      if (course.newImage) {
        formData.append('image', course.newImage);
      }

      await fetch(`http://localhost:4000/courses/${courseId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      // Process chapters
      for (const chapter of course.chapters) {
        if (chapter.isDeleted && chapter.id) {
          // Delete chapter
          await fetch(`http://localhost:4000/courses/chapters/${chapter.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (chapter.isNew) {
          // Create new chapter
          const chapterRes = await fetch(`http://localhost:4000/courses/${courseId}/chapters`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: chapter.title,
              order: chapter.order,
            }),
          });

          const newChapter = await chapterRes.json();

          // Create lessons for new chapter
          for (const lesson of chapter.lessons) {
            if (!lesson.isDeleted) {
              // Upload images first
              const uploadedImages = await uploadLessonImages(lesson);

              // Prepare quiz data if lesson is a quiz type
              const quizData = lesson.lessonType === 'quiz' && lesson.quiz ? {
                questions: lesson.quiz.questions.map((q, qIndex) => ({
                  question: q.question,
                  questionType: q.questionType,
                  order: qIndex,
                  options: q.options.map((opt, optIndex) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: optIndex,
                  })),
                })),
              } : null;

              await fetch(`http://localhost:4000/courses/chapters/${newChapter.id}/lessons`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: lesson.title,
                  content: lesson.content,
                  videoUrl: lesson.videoUrl || null,
                  duration: lesson.duration,
                  order: lesson.order,
                  lessonType: lesson.lessonType,
                  images: uploadedImages,
                  files: lesson.files,
                  links: lesson.links.filter(link => link.trim() !== ''),
                  contentOrder: lesson.contentOrder,
                  quiz: quizData,
                }),
              });
            }
          }
        } else if (chapter.id) {
          // Update existing chapter
          await fetch(`http://localhost:4000/courses/chapters/${chapter.id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: chapter.title,
              order: chapter.order,
            }),
          });

          // Process lessons
          for (const lesson of chapter.lessons) {
            if (lesson.isDeleted && lesson.id) {
              await fetch(`http://localhost:4000/courses/lessons/${lesson.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
            } else if (lesson.isNew) {
              // Upload images first
              const uploadedImages = await uploadLessonImages(lesson);

              // Prepare quiz data if lesson is a quiz type
              const quizData = lesson.lessonType === 'quiz' && lesson.quiz ? {
                questions: lesson.quiz.questions.map((q, qIndex) => ({
                  question: q.question,
                  questionType: q.questionType,
                  order: qIndex,
                  options: q.options.map((opt, optIndex) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: optIndex,
                  })),
                })),
              } : null;

              await fetch(`http://localhost:4000/courses/chapters/${chapter.id}/lessons`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: lesson.title,
                  content: lesson.content,
                  videoUrl: lesson.videoUrl || null,
                  duration: lesson.duration,
                  order: lesson.order,
                  lessonType: lesson.lessonType,
                  images: uploadedImages,
                  files: lesson.files,
                  links: lesson.links.filter(link => link.trim() !== ''),
                  contentOrder: lesson.contentOrder,
                  quiz: quizData,
                }),
              });
            } else if (lesson.id) {
              // Upload images first
              const uploadedImages = await uploadLessonImages(lesson);

              // Prepare quiz data if lesson is a quiz type
              const quizData = lesson.lessonType === 'quiz' && lesson.quiz ? {
                questions: lesson.quiz.questions.map((q, qIndex) => ({
                  question: q.question,
                  questionType: q.questionType,
                  order: qIndex,
                  options: q.options.map((opt, optIndex) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: optIndex,
                  })),
                })),
              } : null;

              await fetch(`http://localhost:4000/courses/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: lesson.title,
                  content: lesson.content,
                  videoUrl: lesson.videoUrl || null,
                  duration: lesson.duration,
                  order: lesson.order,
                  lessonType: lesson.lessonType,
                  images: uploadedImages,
                  files: lesson.files,
                  links: lesson.links.filter(link => link.trim() !== ''),
                  contentOrder: lesson.contentOrder,
                  quiz: quizData,
                }),
              });
            }
          }
        }
      }

      router.push(`/communities/${communityId}/courses/${courseId}`);
    } catch (err) {
      console.error('Failed to save course:', err);
      setError('שגיאה בשמירת הקורס');
    } finally {
      setSaving(false);
    }
  };



  if (loading || !course) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  const activeChapters = course.chapters.filter(c => !c.isDeleted);

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
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
                {userProfile?.name?.charAt(0) || userEmail?.charAt(0)?.toUpperCase()}
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
        </div>
      </header>

      {/* Form Section */}
      <section className="min-h-[calc(100vh-80px)] px-4 py-10">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">עריכת הקורס</h1>
            <p className="text-gray-600">עדכנו את פרטי הקורס</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-lg text-gray-800 mb-4">פרטי הקורס</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם הקורס <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="course-title"
                    type="text"
                    value={course.title}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_TITLE_LENGTH) {
                        setCourse({ ...course, title: e.target.value });
                        if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                      }
                    }}
                    maxLength={MAX_TITLE_LENGTH}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="לדוגמה: מבוא לבישול ביתי"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.title && <span className="text-xs text-red-500">{errors.title}</span>}
                    <span className={`text-xs mr-auto ${course.title.length > MAX_TITLE_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {course.title.length}/{MAX_TITLE_LENGTH}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור הקורס <span className="text-gray-400 text-xs">(אופציונלי)</span>
                  </label>
                  <textarea
                    id="course-description"
                    value={course.description}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                        setCourse({ ...course, description: e.target.value });
                        if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                      }
                    }}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    rows={4}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="תאר את הקורס בכמה משפטים..."
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
                    <span className={`text-xs mr-auto ${course.description.length > MAX_DESCRIPTION_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {course.description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters */}
            <div id="chapters-section" className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-800">פרקים ושיעורים</h2>
                <button
                  onClick={addChapter}
                  className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <FaPlus className="w-4 h-4" />
                  הוסף פרק
                </button>
              </div>

              {errors.chapters && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {errors.chapters}
                </div>
              )}

              {activeChapters.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <FaPlay className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-4">עדיין אין פרקים בקורס</p>
                  <button
                    onClick={addChapter}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    הוסף פרק ראשון
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.chapters.map((chapter, chapterIndex) => {
                    if (chapter.isDeleted) return null;
                    const activeLessons = chapter.lessons.filter(l => !l.isDeleted);
                    
                    return (
                      <div key={chapter.id || chapterIndex} id={`chapter-${chapterIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Chapter Header */}
                        <div className="bg-gray-50 p-4 flex items-center gap-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={chapter.title}
                              onChange={(e) => {
                                if (e.target.value.length <= MAX_CHAPTER_TITLE_LENGTH) {
                                  updateChapter(chapterIndex, { title: e.target.value });
                                  if (errors[`chapter_${chapterIndex}_title`]) {
                                    setErrors(prev => ({ ...prev, [`chapter_${chapterIndex}_title`]: '' }));
                                  }
                                }
                              }}
                              className={`w-full bg-transparent font-medium text-gray-800 focus:outline-none border-b ${
                                errors[`chapter_${chapterIndex}_title`] ? 'border-red-500' : 'border-transparent focus:border-blue-500'
                              }`}
                              placeholder="שם הפרק *"
                              maxLength={MAX_CHAPTER_TITLE_LENGTH}
                            />
                            {errors[`chapter_${chapterIndex}_title`] && (
                              <span className="text-xs text-red-500">{errors[`chapter_${chapterIndex}_title`]}</span>
                            )}
                            {errors[`chapter_${chapterIndex}_lessons`] && (
                              <span className="text-xs text-red-500 block mt-1">{errors[`chapter_${chapterIndex}_lessons`]}</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {activeLessons.length} שיעורים
                          </span>
                          <button
                            onClick={() => toggleChapter(chapterIndex)}
                            className="p-2 hover:bg-gray-200 rounded transition"
                          >
                            {chapter.expanded ? (
                              <FaChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <FaChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            onClick={() => removeChapter(chapterIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Chapter Lessons */}
                        {chapter.expanded && (
                          <div className="p-4 space-y-3">
                            {chapter.lessons.map((lesson, lessonIndex) => {
                              if (lesson.isDeleted) return null;
                              
                              // Determine lesson label based on content
                              const hasVideo = !!lesson.videoUrl;
                              const hasText = !!lesson.content;
                              const hasLinks = lesson.links.length > 0;
                              const hasImages = (lesson.images?.length > 0) || (lesson.imageFiles?.length > 0);
                              const contentTypes = [hasVideo, hasText, hasLinks, hasImages].filter(Boolean).length;
                              const isQuiz = lesson.lessonType === 'quiz';
                              
                              // Determine lesson type icon and label
                              const getLessonIcon = () => {
                                if (isQuiz) return <FaQuestionCircle className="w-4 h-4 text-gray-500" />;
                                if (contentTypes > 1) return <FaLayerGroup className="w-4 h-4 text-gray-500" />;
                                if (hasVideo) return <FaVideo className="w-4 h-4 text-gray-500" />;
                                if (hasLinks) return <FaLink className="w-4 h-4 text-gray-500" />;
                                if (hasImages) return <FaImage className="w-4 h-4 text-gray-500" />;
                                return <FaFileAlt className="w-4 h-4 text-gray-500" />;
                              };
                              
                              const getLessonTypeLabel = () => {
                                if (isQuiz) return 'בוחן';
                                if (contentTypes > 1) return 'שיעור משולב';
                                if (hasVideo) return 'סרטון';
                                if (hasLinks) return 'קישורים';
                                if (hasImages) return 'תמונות';
                                return 'שיעור';
                              };
                              
                              return (
                                <div key={lesson.id || lessonIndex} id={`lesson-${chapterIndex}-${lessonIndex}`} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      {getLessonIcon()}
                                      <span className="text-sm text-gray-600 font-medium">{getLessonTypeLabel()} {lessonIndex + 1}</span>
                                    </div>
                                    <div className="mr-auto flex items-center gap-1">
                                      <button
                                        onClick={() => toggleLesson(chapterIndex, lessonIndex)}
                                        className="p-1.5 hover:bg-gray-200 rounded transition"
                                      >
                                        {lesson.expanded !== false ? (
                                          <FaChevronUp className="w-3.5 h-3.5 text-gray-500" />
                                        ) : (
                                          <FaChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => removeLesson(chapterIndex, lessonIndex)}
                                        className="p-1.5 text-red-500 hover:bg-red-100 rounded transition"
                                      >
                                        <FaTrash className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {lesson.expanded !== false && (
                                  <>
                                  {/* Lesson Type Selector */}
                                  <div className="mb-3 mt-3">
                                    <label className="block text-xs text-gray-500 mb-1">סוג שיעור</label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateLesson(chapterIndex, lessonIndex, { lessonType: 'content', quiz: null })}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                          lesson.lessonType === 'content'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                      >
                                        תוכן
                                        <FaFileAlt className="inline w-3 h-3 mr-2" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateLesson(chapterIndex, lessonIndex, { 
                                          lessonType: 'quiz', 
                                          quiz: lesson.quiz || { questions: [{ question: '', questionType: 'radio' as const, order: 0, options: [{ text: '', isCorrect: false, order: 0 }, { text: '', isCorrect: false, order: 1 }] }] }
                                        })}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                          lesson.lessonType === 'quiz'
                                            ? 'bg-gray-800 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                      >
                                        בוחן
                                        <FaQuestionCircle className="inline w-3 h-3 mr-2" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">כותרת <span className="text-red-500">*</span></label>
                                      <input
                                        type="text"
                                        value={lesson.title}
                                        onChange={(e) => {
                                          updateLesson(chapterIndex, lessonIndex, { title: e.target.value });
                                          if (errors[`lesson_${chapterIndex}_${lessonIndex}_title`]) {
                                            setErrors(prev => ({ ...prev, [`lesson_${chapterIndex}_${lessonIndex}_title`]: '' }));
                                          }
                                        }}
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${
                                          errors[`lesson_${chapterIndex}_${lessonIndex}_title`] ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                        placeholder="כותרת השיעור"
                                      />
                                      {errors[`lesson_${chapterIndex}_${lessonIndex}_title`] && (
                                        <span className="text-xs text-red-500">{errors[`lesson_${chapterIndex}_${lessonIndex}_title`]}</span>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">משך (דקות) <span className="text-red-500">*</span></label>
                                      <input
                                        type="number"
                                        value={lesson.duration}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          if (val >= 0 && val <= MAX_LESSON_DURATION) {
                                            updateLesson(chapterIndex, lessonIndex, { duration: val });
                                            if (errors[`lesson_${chapterIndex}_${lessonIndex}_duration`]) {
                                              setErrors(prev => ({ ...prev, [`lesson_${chapterIndex}_${lessonIndex}_duration`]: '' }));
                                            }
                                          }
                                        }}
                                        className={`w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 ${
                                          errors[`lesson_${chapterIndex}_${lessonIndex}_duration`] ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                        min={MIN_LESSON_DURATION}
                                        max={MAX_LESSON_DURATION}
                                      />
                                      {errors[`lesson_${chapterIndex}_${lessonIndex}_duration`] && (
                                        <span className="text-xs text-red-500">{errors[`lesson_${chapterIndex}_${lessonIndex}_duration`]}</span>
                                      )}
                                    </div>
                                    
                                    {/* Content type fields */}
                                    {lesson.lessonType === 'content' && (
                                      <>
                                        {/* Content Order Section - Option B: Vertical List with Drag */}
                                        <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                          <label className="block text-xs text-gray-500 mb-2">
                                            סדר תצוגת התוכן
                                          </label>
                                          <div className="space-y-1">
                                            {(lesson.contentOrder || ['video', 'text', 'images', 'links']).map((item, orderIndex) => {
                                              const labels: Record<string, string> = { video: 'סרטון', text: 'טקסט', images: 'תמונות', links: 'קישורים' };
                                              const icons: Record<string, React.ReactNode> = { 
                                                video: <FaVideo className="w-3 h-3" />, 
                                                text: <FaFileAlt className="w-3 h-3" />, 
                                                images: <FaImage className="w-3 h-3" />, 
                                                links: <FaLink className="w-3 h-3" /> 
                                              };
                                              return (
                                                <div 
                                                  key={item} 
                                                  draggable
                                                  onDragStart={(e) => {
                                                    e.dataTransfer.setData('text/plain', orderIndex.toString());
                                                    e.currentTarget.classList.add('opacity-50');
                                                  }}
                                                  onDragEnd={(e) => {
                                                    e.currentTarget.classList.remove('opacity-50');
                                                  }}
                                                  onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
                                                  }}
                                                  onDragLeave={(e) => {
                                                    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                                                  }}
                                                  onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                                                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                    const toIndex = orderIndex;
                                                    if (fromIndex !== toIndex) {
                                                      const currentOrder = lesson.contentOrder || ['video', 'text', 'images', 'links'];
                                                      const newOrder = [...currentOrder];
                                                      const [removed] = newOrder.splice(fromIndex, 1);
                                                      newOrder.splice(toIndex, 0, removed);
                                                      updateLesson(chapterIndex, lessonIndex, { contentOrder: newOrder });
                                                    }
                                                  }}
                                                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition cursor-grab active:cursor-grabbing"
                                                >
                                                  <span className="text-gray-400">
                                                    <FaGripVertical className="w-3 h-3" />
                                                  </span>
                                                  <span className="text-sm text-gray-700">{orderIndex + 1}. {labels[item]}</span>
                                                  <span className="text-gray-400 mr-1">{icons[item]}</span>
                                                  <div className="flex gap-1 mr-auto">
                                                    <button
                                                      type="button"
                                                      disabled={orderIndex === 0}
                                                      onClick={() => {
                                                        const currentOrder = lesson.contentOrder || ['video', 'text', 'images', 'links'];
                                                        const newOrder = [...currentOrder];
                                                        [newOrder[orderIndex - 1], newOrder[orderIndex]] = [newOrder[orderIndex], newOrder[orderIndex - 1]];
                                                        updateLesson(chapterIndex, lessonIndex, { contentOrder: newOrder });
                                                      }}
                                                      className={`p-1 rounded ${orderIndex === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                      <FaArrowUp className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={orderIndex === (lesson.contentOrder || ['video', 'text', 'images', 'links']).length - 1}
                                                      onClick={() => {
                                                        const currentOrder = lesson.contentOrder || ['video', 'text', 'images', 'links'];
                                                        const newOrder = [...currentOrder];
                                                        [newOrder[orderIndex], newOrder[orderIndex + 1]] = [newOrder[orderIndex + 1], newOrder[orderIndex]];
                                                        updateLesson(chapterIndex, lessonIndex, { contentOrder: newOrder });
                                                      }}
                                                      className={`p-1 rounded ${orderIndex === (lesson.contentOrder || ['video', 'text', 'images', 'links']).length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                      <FaArrowDown className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        <div className="md:col-span-2">
                                          <label className="block text-xs text-gray-500 mb-1">
                                            קישור לסרטון (YouTube) <span className="text-gray-400">(אופציונלי)</span>
                                            <FaVideo className="inline w-3 h-3 mr-2" />
                                          </label>
                                          <input
                                            type="text"
                                            value={lesson.videoUrl}
                                            onChange={(e) => updateLesson(chapterIndex, lessonIndex, { videoUrl: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                          />
                                        </div>
                                        <div className="md:col-span-2">
                                          <label className="block text-xs text-gray-500 mb-1">
                                            תוכן השיעור <span className="text-gray-400">(אופציונלי)</span>
                                            <FaFileAlt className="inline w-3 h-3 mr-2" />
                                          </label>
                                          <textarea
                                            value={lesson.content}
                                            onChange={(e) => updateLesson(chapterIndex, lessonIndex, { content: e.target.value })}
                                            rows={3}
                                            className="w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                                            placeholder="תוכן טקסט לשיעור..."
                                          />
                                        </div>
                                        
                                        {/* Images Section */}
                                        <div className="md:col-span-2">
                                          <label className="block text-xs text-gray-500 mb-1">
                                            תמונות <span className="text-gray-400">(אופציונלי)</span>
                                            <FaImage className="inline w-3 h-3 mr-2" />
                                          </label>
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {(lesson.images || []).map((imageUrl, imgIndex) => (
                                              <div key={`saved-${imgIndex}`} className="relative group">
                                                <img
                                                  src={`http://localhost:4000${imageUrl}`}
                                                  alt={`תמונה ${imgIndex + 1}`}
                                                  className="w-full h-24 object-cover rounded border border-gray-200"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newImages = (lesson.images || []).filter((_, i) => i !== imgIndex);
                                                    updateLesson(chapterIndex, lessonIndex, { images: newImages });
                                                  }}
                                                  className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
                                                >
                                                  <FaTimes className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                            {(lesson.imageFiles || []).map((file, imgIndex) => (
                                              <div key={`new-${imgIndex}`} className="relative group">
                                                <img
                                                  src={URL.createObjectURL(file)}
                                                  alt={file.name}
                                                  className="w-full h-24 object-cover rounded border border-green-300"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newFiles = (lesson.imageFiles || []).filter((_, i) => i !== imgIndex);
                                                    updateLesson(chapterIndex, lessonIndex, { imageFiles: newFiles });
                                                  }}
                                                  className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
                                                >
                                                  <FaTimes className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
                                              <FaPlus className="w-4 h-4 text-gray-400 mb-1" />
                                              <span className="text-xs text-gray-500">הוסף תמונה</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    updateLesson(chapterIndex, lessonIndex, { 
                                                      imageFiles: [...(lesson.imageFiles || []), file] 
                                                    });
                                                  }
                                                  e.target.value = '';
                                                }}
                                              />
                                            </label>
                                          </div>
                                        </div>
                                        
                                        {/* Links Section */}
                                        <div className="md:col-span-2">
                                          <label className="block text-xs text-gray-500 mb-1">
                                            קישורים <span className="text-gray-400">(אופציונלי)</span>
                                            <FaLink className="inline w-3 h-3 mr-2" />
                                          </label>
                                          <div className="space-y-2">
                                            {lesson.links.map((link, linkIndex) => (
                                              <div key={linkIndex} className="flex gap-2">
                                                <input
                                                  type="url"
                                                  value={link}
                                                  onChange={(e) => {
                                                    const newLinks = [...lesson.links];
                                                    newLinks[linkIndex] = e.target.value;
                                                    updateLesson(chapterIndex, lessonIndex, { links: newLinks });
                                                  }}
                                                  className="flex-1 p-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                                  dir="ltr"
                                                  placeholder="https://example.com"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newLinks = lesson.links.filter((_, i) => i !== linkIndex);
                                                    updateLesson(chapterIndex, lessonIndex, { links: newLinks });
                                                  }}
                                                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                  <FaTimes className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              onClick={() => updateLesson(chapterIndex, lessonIndex, { links: [...lesson.links, ''] })}
                                              className="text-sm text-blue-500 hover:text-blue-600"
                                            >
                                              הוסף קישור
                                              <FaPlus className="inline w-3 h-3 mr-2" />
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    
                                    {/* Quiz type fields */}
                                    {lesson.lessonType === 'quiz' && lesson.quiz && (
                                      <div className="md:col-span-2">
                                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                          <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                              שאלות הבוחן
                                              <FaQuestionCircle className="inline w-4 h-4 mr-2" />
                                            </label>
                                            <button
                                              type="button"
                                            onClick={() => {
                                              const newQuestions = [...lesson.quiz!.questions, { 
                                                question: '', 
                                                questionType: 'radio' as const, 
                                                order: lesson.quiz!.questions.length,
                                                options: [{ text: '', isCorrect: false, order: 0 }, { text: '', isCorrect: false, order: 1 }] 
                                              }];
                                              updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                            }}
                                              className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900"
                                            >
                                              הוסף שאלה
                                              <FaPlus className="inline w-3 h-3 mr-2" />
                                            </button>
                                          </div>

                                          {lesson.quiz.questions.length === 0 ? (
                                            <p className="text-sm text-gray-600 text-center py-4">
                                              לחץ על "הוסף שאלה" כדי להתחיל לבנות את הבוחן
                                            </p>
                                          ) : (
                                            <div className="space-y-4">
                                              {lesson.quiz.questions.map((question, qIndex) => (
                                          <div key={qIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-start gap-2 mb-2">
                                              <span className="text-sm font-medium text-gray-700 mt-2">
                                                {qIndex + 1}.
                                              </span>
                                              <div className="flex-1">
                                                <input
                                                  type="text"
                                                  value={question.question}
                                                  onChange={(e) => {
                                                    const newQuestions = [...lesson.quiz!.questions];
                                                    newQuestions[qIndex] = { ...newQuestions[qIndex], question: e.target.value };
                                                    updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                  }}
                                                  className={`w-full p-2 border rounded focus:ring-1 focus:ring-gray-400 text-sm ${
                                                    errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_question`]
                                                      ? 'border-red-500'
                                                      : 'border-gray-200'
                                                  }`}
                                                  placeholder="הקלד את השאלה..."
                                                />
                                                {errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_question`] && (
                                                  <span className="text-xs text-red-500">חובה למלא שאלה</span>
                                                )}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newQuestions = lesson.quiz!.questions.filter((_, i) => i !== qIndex);
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                }}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                              >
                                                <FaTrash className="w-3 h-3" />
                                              </button>
                                            </div>
                                            
                                            {/* Question Type */}
                                            <div className="flex gap-2 mb-2 mr-5">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newQuestions = [...lesson.quiz!.questions];
                                                  const currentOptions = newQuestions[qIndex].options || [];
                                                  // Trim to 2 options when switching to radio (keep first 2)
                                                  let newOptions = currentOptions.slice(0, 2);
                                                  // Ensure we have at least 2 options
                                                  while (newOptions.length < 2) {
                                                    newOptions.push({ text: '', isCorrect: false, order: newOptions.length });
                                                  }
                                                  // Make sure only one is correct (keep the first correct one)
                                                  let foundCorrect = false;
                                                  newOptions = newOptions.map((o, idx) => {
                                                    if (o.isCorrect && !foundCorrect) {
                                                      foundCorrect = true;
                                                      return { ...o, order: idx };
                                                    }
                                                    return { ...o, isCorrect: false, order: idx };
                                                  });
                                                  // Don't auto-select first option - let user choose
                                                  newQuestions[qIndex] = { ...newQuestions[qIndex], questionType: 'radio', options: newOptions };
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                }}
                                                className={`text-xs px-2 py-1 rounded ${
                                                  question.questionType === 'radio'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}
                                              >
                                                בחירה יחידה
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newQuestions = [...lesson.quiz!.questions];
                                                  const currentOptions = newQuestions[qIndex].options || [];
                                                  // Keep existing options and add to reach 4 if needed
                                                  const newOptions = [...currentOptions].map((o, idx) => ({ ...o, order: idx }));
                                                  // Add options to reach 4 if less than 4
                                                  while (newOptions.length < 4) {
                                                    newOptions.push({ text: '', isCorrect: false, order: newOptions.length });
                                                  }
                                                  newQuestions[qIndex] = { ...newQuestions[qIndex], questionType: 'checkbox', options: newOptions };
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                }}
                                                className={`text-xs px-2 py-1 rounded ${
                                                  question.questionType === 'checkbox'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}
                                              >
                                                בחירה מרובה
                                              </button>
                                            </div>
                                            
                                            {/* Validation hints */}
                                            <div className="text-xs text-gray-500 mb-2 mr-5">
                                              {question.questionType === 'radio' ? (
                                                <span>💡 נדרשות לפחות 2 אפשרויות ותשובה נכונה אחת</span>
                                              ) : (
                                                <span>💡 נדרשות לפחות 4 אפשרויות ולפחות 2 תשובות נכונות</span>
                                              )}
                                            </div>

                                            {/* Show validation errors for this question */}
                                            {errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_options`] && (
                                              <div className="text-xs text-red-500 mb-2 mr-5">
                                                {errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_options`]}
                                              </div>
                                            )}
                                            {errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_correct`] && (
                                              <div className="text-xs text-red-500 mb-2 mr-5">
                                                {errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_correct`]}
                                              </div>
                                            )}
                                            
                                            {/* Options */}
                                            <div className="space-y-2 mr-5">
                                              {question.options.map((option, optIndex) => (
                                                <div key={optIndex}>
                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const newQuestions = [...lesson.quiz!.questions];
                                                        if (question.questionType === 'radio') {
                                                          newQuestions[qIndex].options = newQuestions[qIndex].options.map((o, i) => ({
                                                            ...o,
                                                            isCorrect: i === optIndex
                                                          }));
                                                        } else {
                                                          newQuestions[qIndex].options[optIndex].isCorrect = !option.isCorrect;
                                                        }
                                                        updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                      }}
                                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        option.isCorrect 
                                                          ? 'border-gray-900 bg-gray-900 text-white' 
                                                          : 'border-gray-300'
                                                      }`}
                                                    >
                                                      {option.isCorrect && <FaCheckCircle className="w-3 h-3" />}
                                                    </button>
                                                    <input
                                                      type="text"
                                                      value={option.text}
                                                      onChange={(e) => {
                                                        const newQuestions = [...lesson.quiz!.questions];
                                                        newQuestions[qIndex].options[optIndex].text = e.target.value;
                                                        updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                      }}
                                                      className={`flex-1 p-1.5 border rounded text-sm focus:ring-1 focus:ring-gray-400 ${
                                                        errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_opt_${optIndex}`]
                                                          ? 'border-red-500'
                                                          : 'border-gray-200'
                                                      }`}
                                                      placeholder={`אפשרות ${optIndex + 1}`}
                                                    />
                                                    {((question.questionType === 'radio' && question.options.length > 2) || 
                                                      (question.questionType === 'checkbox' && question.options.length > 4)) && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const newQuestions = [...lesson.quiz!.questions];
                                                          newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== optIndex);
                                                          updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                        }}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                      >
                                                      <FaTimes className="w-3 h-3" />
                                                    </button>
                                                  )}
                                                  </div>
                                                  {errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_opt_${optIndex}`] && (
                                                    <span className="text-xs text-red-500 mr-7">חובה למלא טקסט</span>
                                                  )}
                                                </div>
                                              ))}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newQuestions = [...lesson.quiz!.questions];
                                                  newQuestions[qIndex].options.push({ text: '', isCorrect: false, order: newQuestions[qIndex].options.length });
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: { questions: newQuestions } });
                                                }}
                                                className="text-xs text-gray-700 hover:text-gray-900"
                                              >
                                                הוסף אפשרות
                                                <FaPlus className="inline w-2 h-2 mr-2" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            </>
                            )}
                          </div>
                        );
                      })}

                            <button
                              onClick={() => addLesson(chapterIndex)}
                              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2"
                            >
                              <FaPlus className="w-4 h-4" />
                              הוסף שיעור
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Image */}
            <div id="course-image-section" className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-lg text-gray-800 mb-4">תמונת הקורס <span className="text-red-500">*</span></h2>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              {course.imagePreview ? (
                <div className="relative">
                  <img
                    src={course.imagePreview}
                    alt="Course preview"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 left-2 px-3 py-1 bg-black/50 text-white text-sm rounded hover:bg-black/70 transition"
                  >
                    החלף תמונה
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 transition"
                >
                  <FaImage className="w-8 h-8 mb-2" />
                  <span>לחץ להעלאת תמונה</span>
                </button>
              )}
            </div>

            {/* Course Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-lg text-gray-800 mb-4">סיכום</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">מספר פרקים:</span>
                  <span className="font-medium">{activeChapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">מספר שיעורים:</span>
                  <span className="font-medium">
                    {activeChapters.reduce((sum, c) => sum + c.lessons.filter(l => !l.isDeleted).length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">משך כולל:</span>
                  <span className="font-medium">
                    {activeChapters.reduce((sum, c) => sum + c.lessons.filter(l => !l.isDeleted).reduce((s, l) => s + l.duration, 0), 0)} דקות
                  </span>
                </div>
              </div>


            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Link
              href={`/communities/${communityId}/courses/${courseId}`}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ביטול
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
              <FaSave className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
