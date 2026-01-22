'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaPlus, FaTrash, FaGripVertical, FaImage, FaSave, FaPlay, FaChevronDown, FaChevronUp, FaCog, FaSignOutAlt, FaUser, FaVideo, FaFileAlt, FaLink, FaQuestionCircle, FaCheckCircle, FaFile, FaTimes, FaLayerGroup, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import NotificationBell from '../../../../components/NotificationBell';
import { MessagesBell } from '../../../../components/ChatWidget';

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
  isNew?: boolean;
  expanded?: boolean;
  // New fields
  lessonType: 'content' | 'quiz';
  images: string[];
  imageFiles: File[];
  files: { name: string; url: string; size: number; file?: File }[];
  links: string[];
  quiz: QuizQuestionForm[];
  contentOrder: ('video' | 'text' | 'images' | 'links')[];
}

interface ChapterForm {
  id?: string;
  title: string;
  order: number;
  lessons: LessonForm[];
  isNew?: boolean;
  expanded: boolean;
}

interface CourseForm {
  title: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
  chapters: ChapterForm[];
}

export default function CreateCoursePage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<CourseForm>({
    title: '',
    description: '',
    image: null,
    imagePreview: null,
    chapters: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Validation constants
  const MAX_TITLE_LENGTH = 20;
  const MAX_DESCRIPTION_LENGTH = 100;
  const MAX_CHAPTER_TITLE_LENGTH = 80;
  const MAX_LESSON_TITLE_LENGTH = 80;
  const MAX_LESSON_DURATION = 480; // 8 hours max
  const MIN_LESSON_DURATION = 1;

  useEffect(() => {
    setMounted(true);

    // Read cached profile immediately
    const cached = localStorage.getItem('userProfileCache');
    if (cached) {
      try { setUserProfile(JSON.parse(cached)); } catch {}
    }

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
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            const profile = { name: data.name, profileImage: data.profileImage };
            setUserProfile(profile);
            localStorage.setItem('userProfileCache', JSON.stringify(profile));
          }
        })
        .catch(console.error);
    } catch (e) {
      console.error('Failed to decode token');
      router.push('/login');
    }
  }, [router]);

  const addChapter = () => {
    setCourse(prev => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        {
          title: `פרק ${prev.chapters.length + 1}`,
          order: prev.chapters.length,
          lessons: [],
          isNew: true,
          expanded: true,
        },
      ],
    }));
  };

  const updateChapter = (index: number, updates: Partial<ChapterForm>) => {
    setCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    }));
  };

  const removeChapter = (index: number) => {
    setCourse(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index).map((c, i) => ({ ...c, order: i })),
    }));
  };

  const toggleChapter = (index: number) => {
    updateChapter(index, { expanded: !course.chapters[index].expanded });
  };

  const toggleLesson = (chapterIndex: number, lessonIndex: number) => {
    updateLesson(chapterIndex, lessonIndex, { expanded: !course.chapters[chapterIndex].lessons[lessonIndex].expanded });
  };

  const addLesson = (chapterIndex: number) => {
    setCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map((chapter, i) =>
        i === chapterIndex
          ? {
              ...chapter,
              lessons: [
                ...chapter.lessons,
                {
                  title: `שיעור ${chapter.lessons.length + 1}`,
                  content: '',
                  videoUrl: '',
                  duration: 10,
                  order: chapter.lessons.length,
                  isNew: true,
                  expanded: true,
                  lessonType: 'content',
                  images: [],
                  imageFiles: [],
                  files: [],
                  links: [],
                  quiz: [],
                  contentOrder: ['video', 'text', 'images', 'links'],
                },
              ],
            }
          : chapter
      ),
    }));
  };

  const updateLesson = (chapterIndex: number, lessonIndex: number, updates: Partial<LessonForm>) => {
    setCourse(prev => ({
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
    }));
  };

  const removeLesson = (chapterIndex: number, lessonIndex: number) => {
    setCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map((chapter, ci) =>
        ci === chapterIndex
          ? {
              ...chapter,
              lessons: chapter.lessons
                .filter((_, li) => li !== lessonIndex)
                .map((l, i) => ({ ...l, order: i })),
            }
          : chapter
      ),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCourse(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const validateForm = (): boolean => {
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

    // Image required
    if (!course.image) {
      newErrors.image = 'יש להעלות תמונה לקורס';
    }

    // At least one chapter required
    if (course.chapters.length === 0) {
      newErrors.chapters = 'יש להוסיף לפחות פרק אחד';
    }

    // Chapters and lessons validation
    course.chapters.forEach((chapter, ci) => {
      if (!chapter.title.trim()) {
        newErrors[`chapter_${ci}_title`] = 'שם הפרק הוא שדה חובה';
      } else if (chapter.title.length > MAX_CHAPTER_TITLE_LENGTH) {
        newErrors[`chapter_${ci}_title`] = `שם הפרק לא יכול להכיל יותר מ-${MAX_CHAPTER_TITLE_LENGTH} תווים`;
      }

      // At least one lesson per chapter required
      if (chapter.lessons.length === 0) {
        newErrors[`chapter_${ci}_lessons`] = 'יש להוסיף לפחות שיעור אחד';
      }

      chapter.lessons.forEach((lesson, li) => {
        if (!lesson.title.trim()) {
          newErrors[`lesson_${ci}_${li}_title`] = 'שם השיעור הוא שדה חובה';
        } else if (lesson.title.length > MAX_LESSON_TITLE_LENGTH) {
          newErrors[`lesson_${ci}_${li}_title`] = `שם השיעור לא יכול להכיל יותר מ-${MAX_LESSON_TITLE_LENGTH} תווים`;
        }

        if (!lesson.duration || lesson.duration < MIN_LESSON_DURATION) {
          newErrors[`lesson_${ci}_${li}_duration`] = `משך השיעור חייב להיות לפחות ${MIN_LESSON_DURATION} דקה`;
        } else if (lesson.duration > MAX_LESSON_DURATION) {
          newErrors[`lesson_${ci}_${li}_duration`] = `משך השיעור לא יכול לעלות על ${MAX_LESSON_DURATION} דקות`;
        }

        // Quiz validation
        if (lesson.lessonType === 'quiz') {
          if (!lesson.quiz || lesson.quiz.length === 0) {
            newErrors[`lesson_${ci}_${li}_quiz`] = 'בוחן חייב להכיל לפחות שאלה אחת';
          } else {
            lesson.quiz.forEach((question, qi) => {
              if (!question.question.trim()) {
                newErrors[`lesson_${ci}_${li}_quiz_${qi}_question`] = `שאלה ${qi + 1}: יש להזין טקסט לשאלה`;
              }
              
              if (question.questionType === 'radio') {
                // Radio: at least 2 options, exactly 1 correct
                if (question.options.length < 2) {
                  newErrors[`lesson_${ci}_${li}_quiz_${qi}_options`] = `שאלה ${qi + 1}: נדרשות לפחות 2 אפשרויות`;
                }
                const correctCount = question.options.filter(o => o.isCorrect).length;
                if (correctCount !== 1) {
                  newErrors[`lesson_${ci}_${li}_quiz_${qi}_correct`] = `שאלה ${qi + 1}: יש לבחור תשובה נכונה אחת`;
                }
                // Check all options have text
                question.options.forEach((opt, oi) => {
                  if (!opt.text.trim()) {
                    newErrors[`lesson_${ci}_${li}_quiz_${qi}_opt_${oi}`] = `שאלה ${qi + 1}: אפשרות ${oi + 1} חייבת להכיל טקסט`;
                  }
                });
              } else if (question.questionType === 'checkbox') {
                // Checkbox: at least 4 options, at least 2 correct
                if (question.options.length < 4) {
                  newErrors[`lesson_${ci}_${li}_quiz_${qi}_options`] = `שאלה ${qi + 1}: נדרשות לפחות 4 אפשרויות לבחירה מרובה`;
                }
                const correctCount = question.options.filter(o => o.isCorrect).length;
                if (correctCount < 2) {
                  newErrors[`lesson_${ci}_${li}_quiz_${qi}_correct`] = `שאלה ${qi + 1}: יש לבחור לפחות 2 תשובות נכונות`;
                }
                // Check all options have text
                question.options.forEach((opt, oi) => {
                  if (!opt.text.trim()) {
                    newErrors[`lesson_${ci}_${li}_quiz_${qi}_opt_${oi}`] = `שאלה ${qi + 1}: אפשרות ${oi + 1} חייבת להכיל טקסט`;
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

  const scrollToFirstError = (errors: Record<string, string>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;
    
    const firstErrorKey = errorKeys[0];
    let elementId = '';
    
    if (firstErrorKey === 'title') {
      elementId = 'course-title';
    } else if (firstErrorKey === 'description') {
      elementId = 'course-description';
    } else if (firstErrorKey === 'image') {
      elementId = 'course-image-section';
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
    if (!validateForm()) {
      scrollToFirstError(errors);
      return;
    }

    setSaving(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Create the course
      const formData = new FormData();
      formData.append('title', course.title);
      formData.append('description', course.description);
      formData.append('communityId', communityId);
      if (course.image) {
        formData.append('image', course.image);
      }

      console.log('Creating course with:', { title: course.title, description: course.description, communityId });
      
      const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      console.log('Course response status:', courseRes.status);
      
      if (!courseRes.ok) {
        const errorText = await courseRes.text();
        console.error('Course creation error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to create course');
        } catch {
          throw new Error(`Failed to create course: ${errorText}`);
        }
      }

      const newCourse = await courseRes.json();

      // Create chapters and lessons
      for (const chapter of course.chapters) {
        const chapterRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${newCourse.id}/chapters`, {
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

        if (!chapterRes.ok) {
          throw new Error('Failed to create chapter');
        }

        const newChapter = await chapterRes.json();

        // Create lessons for this chapter
        for (const lesson of chapter.lessons) {
          // Upload image files first
          const uploadedImageUrls: string[] = [...(lesson.images || [])];
          if (lesson.imageFiles && lesson.imageFiles.length > 0) {
            for (const file of lesson.imageFiles) {
              const imageFormData = new FormData();
              imageFormData.append('image', file);
              const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/lessons/upload-image`, {
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

          // Prepare quiz data if lesson is a quiz type
          const quizData = lesson.lessonType === 'quiz' && lesson.quiz && lesson.quiz.length > 0 ? {
            questions: lesson.quiz.map((q, qIndex) => ({
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

          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/chapters/${newChapter.id}/lessons`, {
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
              images: uploadedImageUrls,
              files: lesson.files,
              links: lesson.links.filter(link => link.trim() !== ''),
              contentOrder: lesson.contentOrder,
              quiz: quizData,
            }),
          });
        }
      }

      // Navigate to the course
      router.push(`/communities/${communityId}/courses/${newCourse.id}`);
    } catch (err) {
      console.error('Failed to save course:', err);
      setError('שגיאה בשמירת הקורס');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
          Kibutz
        </Link>
        <div className="flex items-center gap-3">
          {mounted && <MessagesBell />}
          {mounted && <NotificationBell />}
          {mounted ? (
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="relative focus:outline-none"
            >
              {userProfile?.profileImage ? (
                <img 
                  src={userProfile.profileImage.startsWith('http') ? userProfile.profileImage : `${process.env.NEXT_PUBLIC_API_URL}${userProfile.profileImage}`}
                  alt={userProfile.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
            ) : (
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-600">
                {userProfile?.name?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 left-0 w-3 h-3 bg-[#A7EA7B] border-2 border-white rounded-full"></span>
          </button>
          
          {profileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 z-50" dir="rtl">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (userId) router.push(`/profile/${userId}`);
                  }}
                  className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 rounded-lg"
                >
                  <FaUser className="w-4 h-4" />
                  הפרופיל שלי
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 rounded-lg"
                >
                  <FaCog className="w-4 h-4" />
                  הגדרות
                </button>
                <div className="border-t border-gray-100 my-1 mx-1"></div>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userProfileCache');
                    router.push('/');
                    location.reload();
                  }}
                  className="w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2 rounded-lg"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  התנתקות
                </button>
              </div>
            </>
          )}
          </div>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>
      </header>

      {/* Form Section */}
      <section className="min-h-[calc(100vh-80px)] px-4 py-10">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">צרו קורס חדש</h1>
            <p className="text-gray-600">בנו קורס מקצועי לקהילה שלכם</p>
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
                    className={`w-full p-3 border rounded-lg focus:border-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="לדוגמה: מבוא לבישול ביתי"
                    maxLength={MAX_TITLE_LENGTH}
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
                    rows={4}
                    className={`w-full p-3 border rounded-lg focus:border-blue-500 text-right ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="תאר את הקורס בכמה משפטים..."
                    maxLength={MAX_DESCRIPTION_LENGTH}
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

              {course.chapters.length === 0 ? (
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
                  {course.chapters.map((chapter, chapterIndex) => (
                    <div key={chapterIndex} id={`chapter-${chapterIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
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
                          {chapter.lessons.length} שיעורים
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
                            const hasMultipleContent = [
                              lesson.videoUrl,
                              lesson.content,
                              lesson.images?.length > 0 || lesson.imageFiles?.length > 0,
                              lesson.files?.length > 0,
                              lesson.links?.length > 0,
                            ].filter(Boolean).length > 1;
                            
                            const lessonLabel = lesson.lessonType === 'quiz' 
                              ? 'בוחן' 
                              : hasMultipleContent 
                                ? 'שיעור משולב' 
                                : 'שיעור';
                            
                            // Determine lesson type icon and label
                            const getLessonIcon = () => {
                              if (lesson.lessonType === 'quiz') return <FaQuestionCircle className="w-4 h-4 text-gray-500" />;
                              if (hasMultipleContent) return <FaLayerGroup className="w-4 h-4 text-gray-500" />;
                              if (lesson.videoUrl) return <FaVideo className="w-4 h-4 text-gray-500" />;
                              if (lesson.links?.length > 0) return <FaLink className="w-4 h-4 text-gray-500" />;
                              if (lesson.images?.length > 0 || lesson.imageFiles?.length > 0) return <FaImage className="w-4 h-4 text-gray-500" />;
                              return <FaFileAlt className="w-4 h-4 text-gray-500" />;
                            };
                            
                            const getLessonTypeLabel = () => {
                              if (lesson.lessonType === 'quiz') return 'בוחן';
                              if (hasMultipleContent) return 'שיעור משולב';
                              if (lesson.videoUrl) return 'סרטון';
                              if (lesson.links?.length > 0) return 'קישורים';
                              if (lesson.images?.length > 0 || lesson.imageFiles?.length > 0) return 'תמונות';
                              return 'שיעור';
                            };
                            
                            return (
                            <div key={lessonIndex} id={`lesson-${chapterIndex}-${lessonIndex}`} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600 font-medium">{getLessonTypeLabel()} {lessonIndex + 1}</span>
                                  {getLessonIcon()}
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
                                    onClick={() => updateLesson(chapterIndex, lessonIndex, { lessonType: 'content' })}
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
                                    onClick={() => updateLesson(chapterIndex, lessonIndex, { lessonType: 'quiz' })}
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
                                      if (e.target.value.length <= MAX_LESSON_TITLE_LENGTH) {
                                        updateLesson(chapterIndex, lessonIndex, { title: e.target.value });
                                        if (errors[`lesson_${chapterIndex}_${lessonIndex}_title`]) {
                                          setErrors(prev => ({ ...prev, [`lesson_${chapterIndex}_${lessonIndex}_title`]: '' }));
                                        }
                                      }
                                    }}
                                    className={`w-full p-2 border rounded focus:border-blue-500 ${
                                      errors[`lesson_${chapterIndex}_${lessonIndex}_title`] ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="כותרת השיעור"
                                    maxLength={MAX_LESSON_TITLE_LENGTH}
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
                                    className={`w-full p-2 border rounded focus:border-blue-500 ${
                                      errors[`lesson_${chapterIndex}_${lessonIndex}_duration`] ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                    min={MIN_LESSON_DURATION}
                                    max={MAX_LESSON_DURATION}
                                  />
                                  {errors[`lesson_${chapterIndex}_${lessonIndex}_duration`] && (
                                    <span className="text-xs text-red-500">{errors[`lesson_${chapterIndex}_${lessonIndex}_duration`]}</span>
                                  )}
                                </div>
                              </div>

                              {/* Content Type Lesson */}
                              {lesson.lessonType === 'content' && (
                                <div className="mt-3 space-y-3">
                                  {/* Content Order Section - Option B: Vertical List with Drag */}
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
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

                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      קישור לסרטון (YouTube) <span className="text-gray-400">(אופציונלי)</span>
                                      <FaVideo className="inline w-3 h-3 mr-2" />
                                    </label>
                                    <input
                                      type="text"
                                      value={lesson.videoUrl}
                                      onChange={(e) => updateLesson(chapterIndex, lessonIndex, { videoUrl: e.target.value })}
                                      className="w-full p-2 border border-gray-200 rounded focus:border-blue-500"
                                      placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      תוכן השיעור <span className="text-gray-400">(אופציונלי)</span>
                                      <FaFileAlt className="inline w-3 h-3 mr-2" />
                                    </label>
                                    <textarea
                                      value={lesson.content}
                                      onChange={(e) => updateLesson(chapterIndex, lessonIndex, { content: e.target.value })}
                                      rows={3}
                                      className="w-full p-2 border border-gray-200 rounded focus:border-blue-500 text-right"
                                      placeholder="תוכן טקסט לשיעור..."
                                    />
                                  </div>
                                  
                                  {/* Images */}
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      תמונות <span className="text-gray-400">(אופציונלי)</span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {(lesson.imageFiles || []).map((file, imgIndex) => (
                                        <div key={imgIndex} className="relative group">
                                          <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="w-full h-24 object-cover rounded border border-gray-200"
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
                                  
                                  {/* Links */}
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      קישורים <span className="text-gray-400">(אופציונלי)</span>
                                      <FaLink className="inline w-3 h-3 mr-2" />
                                    </label>
                                    <div className="space-y-2">
                                      {(lesson.links || []).map((link, linkIndex) => (
                                        <div key={linkIndex} className="flex gap-2">
                                          <input
                                            type="url"
                                            value={link}
                                            onChange={(e) => {
                                              const newLinks = [...(lesson.links || [])];
                                              newLinks[linkIndex] = e.target.value;
                                              updateLesson(chapterIndex, lessonIndex, { links: newLinks });
                                            }}
                                            className="flex-1 p-2 border border-gray-200 rounded focus:border-blue-500 text-sm"
                                            dir="ltr"
                                            placeholder="https://example.com"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newLinks = (lesson.links || []).filter((_, i) => i !== linkIndex);
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
                                        onClick={() => {
                                          const newLinks = [...(lesson.links || []), ''];
                                          updateLesson(chapterIndex, lessonIndex, { links: newLinks });
                                        }}
                                        className="text-sm text-blue-500 hover:text-blue-600"
                                      >
                                        הוסף קישור
                                        <FaPlus className="inline w-3 h-3 mr-2" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Quiz Type Lesson */}
                              {lesson.lessonType === 'quiz' && (
                                <div className="mt-3 space-y-3">
                                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                      <label className="block text-sm font-medium text-gray-700">
                                        שאלות הבוחן
                                        <FaQuestionCircle className="inline w-4 h-4 mr-2" />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newQuiz = [...(lesson.quiz || []), {
                                            question: '',
                                            questionType: 'radio' as const,
                                            order: (lesson.quiz || []).length,
                                            options: [
                                              { text: '', isCorrect: false, order: 0 },
                                              { text: '', isCorrect: false, order: 1 },
                                            ],
                                          }];
                                          updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
                                        }}
                                        className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900"
                                      >
                                        הוסף שאלה
                                        <FaPlus className="inline w-3 h-3 mr-2" />
                                      </button>
                                    </div>

                                    {(lesson.quiz || []).length === 0 ? (
                                      <p className="text-sm text-gray-600 text-center py-4">
                                        לחץ על "הוסף שאלה" כדי להתחיל לבנות את הבוחן
                                      </p>
                                    ) : (
                                      <div className="space-y-4">
                                        {(lesson.quiz || []).map((question, qIndex) => (
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
                                                    const newQuiz = [...(lesson.quiz || [])];
                                                    newQuiz[qIndex] = { ...newQuiz[qIndex], question: e.target.value };
                                                    updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
                                                  }}
                                                  className={`w-full p-2 border rounded focus:border-gray-400 text-sm ${
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
                                                  const newQuiz = (lesson.quiz || []).filter((_, i) => i !== qIndex);
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
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
                                                  const newQuiz = [...(lesson.quiz || [])];
                                                  const currentOptions = newQuiz[qIndex].options || [];
                                                  // Trim to 2 options when switching to radio (keep first 2)
                                                  let newOptions = currentOptions.slice(0, 2);
                                                  // Ensure we have at least 2 options
                                                  while (newOptions.length < 2) {
                                                    newOptions.push({ text: '', isCorrect: false, order: newOptions.length });
                                                  }
                                                  // Make sure only one is correct (keep the first correct one)
                                                  let foundCorrect = false;
                                                  newOptions = newOptions.map(o => {
                                                    if (o.isCorrect && !foundCorrect) {
                                                      foundCorrect = true;
                                                      return o;
                                                    }
                                                    return { ...o, isCorrect: false };
                                                  });
                                                  // Don't auto-select first option - let user choose
                                                  newQuiz[qIndex] = { ...newQuiz[qIndex], questionType: 'radio', options: newOptions };
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
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
                                                  const newQuiz = [...(lesson.quiz || [])];
                                                  const currentOptions = newQuiz[qIndex].options || [];
                                                  // Keep existing options and add to reach 4 if needed
                                                  const newOptions = [...currentOptions];
                                                  // Add options to reach 4 if less than 4
                                                  while (newOptions.length < 4) {
                                                    newOptions.push({ text: '', isCorrect: false, order: newOptions.length });
                                                  }
                                                  newQuiz[qIndex] = { ...newQuiz[qIndex], questionType: 'checkbox', options: newOptions };
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
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
                                              {question.options.map((option, oIndex) => (
                                                <div key={oIndex}>
                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const newQuiz = [...(lesson.quiz || [])];
                                                        if (question.questionType === 'radio') {
                                                          // For radio, only one can be correct
                                                          newQuiz[qIndex].options = question.options.map((o, i) => ({
                                                            ...o,
                                                            isCorrect: i === oIndex,
                                                          }));
                                                        } else {
                                                          // For checkbox, toggle
                                                          newQuiz[qIndex].options[oIndex] = {
                                                            ...option,
                                                            isCorrect: !option.isCorrect,
                                                          };
                                                        }
                                                        updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
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
                                                        const newQuiz = [...(lesson.quiz || [])];
                                                        newQuiz[qIndex].options[oIndex] = {
                                                          ...option,
                                                          text: e.target.value,
                                                        };
                                                        updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
                                                      }}
                                                      className={`flex-1 p-1.5 border rounded text-sm focus:border-gray-400 ${
                                                        errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_opt_${oIndex}`]
                                                          ? 'border-red-500'
                                                          : 'border-gray-200'
                                                      }`}
                                                      placeholder={`אפשרות ${oIndex + 1}`}
                                                    />
                                                    {((question.questionType === 'radio' && question.options.length > 2) || 
                                                      (question.questionType === 'checkbox' && question.options.length > 4)) && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const newQuiz = [...(lesson.quiz || [])];
                                                          newQuiz[qIndex].options = question.options.filter((_, i) => i !== oIndex);
                                                          updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
                                                        }}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                      >
                                                        <FaTimes className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                  {errors[`lesson_${chapterIndex}_${lessonIndex}_quiz_${qIndex}_opt_${oIndex}`] && (
                                                    <span className="text-xs text-red-500 mr-7">חובה למלא טקסט</span>
                                                  )}
                                                </div>
                                              ))}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newQuiz = [...(lesson.quiz || [])];
                                                  newQuiz[qIndex].options = [
                                                    ...question.options,
                                                    { text: '', isCorrect: false, order: question.options.length },
                                                  ];
                                                  updateLesson(chapterIndex, lessonIndex, { quiz: newQuiz });
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
                              </>
                              )}
                            </div>
                          )})}

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
                  ))}
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
                  className={`w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition ${
                    errors.image ? 'border-red-400 text-red-400' : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'
                  }`}
                >
                  <FaImage className="w-8 h-8 mb-2" />
                  <span>לחץ להעלאת תמונה</span>
                </button>
              )}
              {errors.image && (
                <p className="mt-2 text-sm text-red-500">{errors.image}</p>
              )}
            </div>

            {/* Course Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-lg text-gray-800 mb-4">סיכום</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">מספר פרקים:</span>
                  <span className="font-medium">{course.chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">מספר שיעורים:</span>
                  <span className="font-medium">
                    {course.chapters.reduce((sum, c) => sum + c.lessons.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">משך כולל:</span>
                  <span className="font-medium">
                    {course.chapters.reduce((sum, c) => sum + c.lessons.reduce((s, l) => s + l.duration, 0), 0)} דקות
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Link
              href={`/communities/${communityId}/courses`}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ביטול
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? 'יוצר...' : 'שמור קורס'}
              <FaSave className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
