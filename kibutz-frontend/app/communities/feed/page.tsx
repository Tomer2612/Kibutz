'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import {
  FaPlus,
  FaUsers,
  FaComments,
  FaHeart,
  FaRegHeart,
  FaEdit,
  FaTrash,
  FaEllipsisH,
  FaTimes,
  FaBookmark,
  FaRegBookmark,
  FaImage,
  FaLink,
  FaFile,
  FaFilePdf,
  FaCheck,
  FaExternalLinkAlt,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaThumbtack,
  FaTrophy,
  FaMedal,
  FaPoll,
  FaCalendarAlt,
  FaVideo,
  FaMapMarkerAlt,
  FaUser,
} from 'react-icons/fa';
import NotificationBell from '../../components/NotificationBell';

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  logo?: string | null;
  ownerId: string;
  createdAt: string;
  topic?: string | null;
  memberCount?: number | null;
  rules?: string[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    profileImage?: string | null;
  };
}

interface Post {
  id: string;
  title?: string | null;
  content: string;
  images?: string[];
  files?: { url: string; name: string }[];
  links?: string[];
  category?: string | null;
  isPinned?: boolean;
  pinnedAt?: string | null;
  createdAt: string;
  author: {
    id: string;
    email: string;
    name: string;
    profileImage?: string | null;
  };
  _count?: {
    likes: number;
    comments: number;
    savedBy?: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  poll?: {
    id: string;
    question: string;
    expiresAt?: string | null;
    totalVotes: number;
    userVotedOptionId: string | null;
    options: {
      id: string;
      text: string;
      votes: number;
      percentage: number;
    }[];
  } | null;
}

// Post categories with colors
const POST_CATEGORIES = [
  { value: 'הודעות', label: 'הודעות', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'שאלות', label: 'שאלות', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'טיפים', label: 'טיפים', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'פרסום', label: 'פרסום', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
];

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

interface TopMember {
  rank: number;
  userId: string;
  name: string;
  email: string;
  profileImage: string | null;
  points: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  locationType: string;
  locationName?: string;
  _count?: { rsvps: number };
}

// NAV_LINKS will be generated dynamically based on communityId

function CommunityFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCommunityId = searchParams.get('communityId');

  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(initialCommunityId);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<string>('');
  const [newPostImages, setNewPostImages] = useState<File[]>([]);
  const [newPostFiles, setNewPostFiles] = useState<File[]>([]);
  const [newPostLinks, setNewPostLinks] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string }[]>([]);
  const [newLinkInput, setNewLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [addingEditLink, setAddingEditLink] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostLiked' | 'mostCommented'>('newest');
  
  // Edit/Delete state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]); // Existing images
  const [editFiles, setEditFiles] = useState<{ url: string; name: string }[]>([]); // Existing files
  const [editLinks, setEditLinks] = useState<string[]>([]); // Existing links
  const [newEditImages, setNewEditImages] = useState<File[]>([]); // New images to add
  const [newEditFiles, setNewEditFiles] = useState<File[]>([]); // New files to add
  const [newEditImagePreviews, setNewEditImagePreviews] = useState<string[]>([]);
  const [newEditFilePreviews, setNewEditFilePreviews] = useState<{ name: string }[]>([]);
  const [editLinkInput, setEditLinkInput] = useState('');
  const [showEditLinkInput, setShowEditLinkInput] = useState(false);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [linksToRemove, setLinksToRemove] = useState<string[]>([]);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  
  // Filter state
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [commentMenuOpenId, setCommentMenuOpenId] = useState<string | null>(null);
  
  // Mention autocomplete state
  const [mentionSuggestions, setMentionSuggestions] = useState<{ id: string; name: string; profileImage: string | null }[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState<string | null>(null); // postId where dropdown is shown
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  
  // Delete post modal state
  const [deletePostModalId, setDeletePostModalId] = useState<string | null>(null);
  
  // Link previews state
  const [linkPreviews, setLinkPreviews] = useState<Record<string, { title?: string; description?: string; image?: string; url: string }>>({});
  
  // Poll state for new post
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [, setCanEdit] = useState(false);
  const [, setCanDelete] = useState(false);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  
  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        prevImage(); // RTL - right goes to previous
      } else if (e.key === 'ArrowLeft') {
        nextImage(); // RTL - left goes to next
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, lightboxImages.length]);

  useEffect(() => {
    setMounted(true);

    // Read cached profile immediately
    const cached = localStorage.getItem('userProfileCache');
    if (cached) {
      try { setUserProfile(JSON.parse(cached)); } catch {}
    }

    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);
        
        // Fetch user profile and memberships
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
          });
        
        // Fetch user's community memberships
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/user/memberships`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            setUserMemberships(data);
          })
          .catch(console.error);
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities`);
        if (!res.ok) throw new Error('Failed to fetch communities');
        const data = await res.json();
        setCommunities(data);
        if (!selectedCommunityId && data.length > 0) {
          setSelectedCommunityId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching communities:', err);
      }
    };

    fetchCommunities();
  }, [selectedCommunityId]);

  useEffect(() => {
    const fetchCommunityDetails = async () => {
      if (!selectedCommunityId) {
        setCommunity(null);
        setPosts([]);
        return;
      }

      const token = localStorage.getItem('token');
      
      try {
        setLoading(true);
        
        // First check membership
        if (token) {
          const membershipRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/communities/${selectedCommunityId}/membership`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (membershipRes.ok) {
            const membershipData = await membershipRes.json();
            setIsMember(membershipData.isMember);
            setIsOwner(membershipData.isOwner || false);
            setIsManager(membershipData.isManager || false);
            setCanEdit(membershipData.canEdit || false);
            setCanDelete(membershipData.canDelete || false);
            
            // If not a member, don't fetch posts
            if (!membershipData.isMember) {
              const communityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${selectedCommunityId}`);
              if (communityRes.ok) {
                setCommunity(await communityRes.json());
              }
              setPosts([]);
              setLoading(false);
              return;
            }
          }
        } else {
          // Not logged in - can't be a member
          setIsMember(false);
          setIsOwner(false);
          setIsManager(false);
          setCanEdit(false);
          setCanDelete(false);
          const communityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${selectedCommunityId}`);
          if (communityRes.ok) {
            setCommunity(await communityRes.json());
          }
          setPosts([]);
          setLoading(false);
          return;
        }
        
        const [communityRes, postsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/${selectedCommunityId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/community/${selectedCommunityId}${userId ? `?userId=${userId}` : ''}`),
        ]);

        if (!communityRes.ok) {
          // Community not found - reset to first available community or show empty state
          console.warn(`Community ${selectedCommunityId} not found`);
          setCommunity(null);
          setPosts([]);
          // Try to select first available community
          if (communities.length > 0) {
            setSelectedCommunityId(communities[0].id);
          }
          setLoading(false);
          return;
        }
        const communityData = await communityRes.json();
        setCommunity(communityData);

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        } else {
          setPosts([]);
        }

        // Fetch top members
        if (token) {
          try {
            const topMembersRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/communities/${selectedCommunityId}/top-members`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (topMembersRes.ok) {
              const topMembersData = await topMembersRes.json();
              setTopMembers(topMembersData);
            }
          } catch (err) {
            console.error('Error fetching top members:', err);
          }
        }

        // Fetch online members count
        try {
          const onlineRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/communities/${selectedCommunityId}/online-count`
          );
          if (onlineRes.ok) {
            const onlineData = await onlineRes.json();
            setOnlineCount(onlineData.onlineCount);
          }
        } catch (err) {
          console.error('Error fetching online count:', err);
        }

        // Fetch upcoming events
        try {
          const eventsRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/events/community/${selectedCommunityId}/upcoming?limit=3`,
            token ? { headers: { Authorization: `Bearer ${token}` } } : {}
          );
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setUpcomingEvents(eventsData);
          }
        } catch (err) {
          console.error('Error fetching upcoming events:', err);
        }
      } catch (err) {
        console.error('Error loading community feed:', err);
        setCommunity(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityDetails();
  }, [selectedCommunityId, userId, communities]);

  // Refresh online count every 30 seconds
  useEffect(() => {
    if (!selectedCommunityId) return;
    
    const refreshOnlineCount = async () => {
      try {
        const onlineRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/communities/${selectedCommunityId}/online-count`
        );
        if (onlineRes.ok) {
          const onlineData = await onlineRes.json();
          setOnlineCount(onlineData.onlineCount);
        }
      } catch (err) {
        // Silently ignore
      }
    };

    const interval = setInterval(refreshOnlineCount, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [selectedCommunityId]);

  // Refresh posts (including poll data) every 15 seconds
  useEffect(() => {
    if (!selectedCommunityId || !userId) return;
    
    const refreshPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const postsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts/community/${selectedCommunityId}?userId=${userId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }
      } catch (err) {
        // Silently ignore refresh errors
      }
    };

    const interval = setInterval(refreshPosts, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [selectedCommunityId, userId]);

  // Redirect non-members to homepage
  useEffect(() => {
    if (isMember === false) {
      router.push('/');
    }
  }, [isMember, router]);

  // Fetch link previews for posts
  useEffect(() => {
    const fetchLinkPreviews = async () => {
      const allLinks: string[] = [];
      posts.forEach(post => {
        if (post.links && post.links.length > 0) {
          post.links.forEach(link => {
            if (!linkPreviews[link]) {
              allLinks.push(link);
            }
          });
        }
      });

      // Fetch previews for new links using backend endpoint
      for (const link of allLinks) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/link-preview?url=${encodeURIComponent(link)}`);
          if (res.ok) {
            const preview = await res.json();
            setLinkPreviews(prev => ({
              ...prev,
              [link]: preview
            }));
          } else {
            // Fallback to basic info
            const url = new URL(link);
            setLinkPreviews(prev => ({
              ...prev,
              [link]: {
                url: link,
                title: url.hostname.replace('www.', ''),
                description: undefined,
                image: undefined,
              }
            }));
          }
        } catch (err) {
          // Invalid URL or fetch error, use fallback
          try {
            const url = new URL(link);
            setLinkPreviews(prev => ({
              ...prev,
              [link]: {
                url: link,
                title: url.hostname.replace('www.', ''),
                description: undefined,
                image: undefined,
              }
            }));
          } catch {
            // Skip invalid URLs
          }
        }
      }
    };

    if (posts.length > 0) {
      fetchLinkPreviews();
    }
  }, [posts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedCommunityId) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו כדי לפרסם פוסט');
      return;
    }

    try {
      setPostSubmitting(true);
      
      const formData = new FormData();
      formData.append('content', newPostContent);
      if (newPostTitle.trim()) {
        formData.append('title', newPostTitle.trim());
      }
      if (newPostCategory) {
        formData.append('category', newPostCategory);
      }
      
      // Append multiple images and files
      [...newPostImages, ...newPostFiles].forEach(file => {
        formData.append('files', file);
      });
      
      // Append links as JSON
      if (newPostLinks.length > 0) {
        formData.append('links', JSON.stringify(newPostLinks));
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/community/${selectedCommunityId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to create post');
      const newPost = await res.json();
      
      // If poll was added, create it
      if (showPollCreator && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
        try {
          const pollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${newPost.id}/poll`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              question: pollQuestion.trim(),
              options: pollOptions.filter(o => o.trim()),
            }),
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            newPost.poll = pollData;
          }
        } catch (pollErr) {
          console.error('Poll creation error:', pollErr);
        }
      }
      
      setPosts((prev) => [newPost, ...prev]);
      setNewPostContent('');
      setNewPostTitle('');
      setNewPostCategory('');
      setNewPostImages([]);
      setNewPostFiles([]);
      setNewPostLinks([]);
      setImagePreviews([]);
      setFilePreviews([]);
      setNewLinkInput('');
      setShowLinkInput(false);
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      console.error('Create post error:', err);
      alert('שגיאה בפרסום הפוסט');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // Check image limit
        if (newPostImages.length >= 5) {
          alert('ניתן להעלות עד 5 תמונות');
          continue;
        }
        setNewPostImages(prev => [...prev, file]);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        // Check file limit
        if (newPostFiles.length >= 5) {
          alert('ניתן להעלות עד 5 קבצים');
          continue;
        }
        setNewPostFiles(prev => [...prev, file]);
        setFilePreviews(prev => [...prev, { name: file.name }]);
      }
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeSelectedImage = (index: number) => {
    setNewPostImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedFile = (index: number) => {
    setNewPostFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (addingLink) return;
    const trimmedLink = newLinkInput.trim();
    if (trimmedLink) {
      if (newPostLinks.length >= 10) {
        alert('ניתן להוסיף עד 10 קישורים');
        return;
      }
      if (newPostLinks.includes(trimmedLink)) {
        alert('קישור זה כבר קיים');
        return;
      }
      setAddingLink(true);
      setNewPostLinks(prev => [...prev, trimmedLink]);
      setNewLinkInput('');
      setAddingLink(false);
    }
  };

  const removeNewLink = (index: number) => {
    setNewPostLinks(prev => prev.filter((_, i) => i !== index));
  };

  // Like/Unlike handler
  const handleToggleLike = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו כדי לתת לייק');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to toggle like');
      const { liked } = await res.json();

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: liked,
                _count: {
                  ...post._count,
                  likes: (post._count?.likes || 0) + (liked ? 1 : -1),
                  comments: post._count?.comments || 0,
                },
              }
            : post
        )
      );
    } catch (err) {
      console.error('Toggle like error:', err);
    }
  };

  // Edit post handler - full edit with all attachments
  const handleEditPost = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token || !editContent.trim() || editSubmitting) return;

    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', editContent);
      if (editTitle.trim()) formData.append('title', editTitle.trim());
      
      // Append new images and files
      [...newEditImages, ...newEditFiles].forEach(file => {
        formData.append('files', file);
      });
      
      // Append new links (combined with kept existing links)
      const keptLinks = editLinks.filter(link => !linksToRemove.includes(link));
      if (keptLinks.length > 0) {
        formData.append('links', JSON.stringify(keptLinks));
      }
      
      // Append items to remove
      if (imagesToRemove.length > 0) {
        formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }
      if (filesToRemove.length > 0) {
        formData.append('filesToRemove', JSON.stringify(filesToRemove));
      }
      if (linksToRemove.length > 0) {
        formData.append('linksToRemove', JSON.stringify(linksToRemove));
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to update post');
      const updatedPost = await res.json();

      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { 
          ...post, 
          ...updatedPost,
        } : post))
      );
      resetEditState();
    } catch (err) {
      console.error('Edit post error:', err);
      alert('שגיאה בעדכון הפוסט');
    } finally {
      setEditSubmitting(false);
    }
  };

  const resetEditState = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditTitle('');
    setEditImages([]);
    setEditFiles([]);
    setEditLinks([]);
    setNewEditImages([]);
    setNewEditFiles([]);
    setNewEditImagePreviews([]);
    setNewEditFilePreviews([]);
    setEditLinkInput('');
    setShowEditLinkInput(false);
    setImagesToRemove([]);
    setFilesToRemove([]);
    setLinksToRemove([]);
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const currentTotal = editImages.length - imagesToRemove.length + newEditImages.length;
        if (currentTotal >= 5) {
          alert('ניתן להעלות עד 5 תמונות');
          continue;
        }
        setNewEditImages(prev => [...prev, file]);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewEditImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        const currentTotal = editFiles.length - filesToRemove.length + newEditFiles.length;
        if (currentTotal >= 5) {
          alert('ניתן להעלות עד 5 קבצים');
          continue;
        }
        setNewEditFiles(prev => [...prev, file]);
        setNewEditFilePreviews(prev => [...prev, { name: file.name }]);
      }
    }
    
    e.target.value = '';
  };

  const removeNewEditImage = (index: number) => {
    setNewEditImages(prev => prev.filter((_, i) => i !== index));
    setNewEditImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewEditFile = (index: number) => {
    setNewEditFiles(prev => prev.filter((_, i) => i !== index));
    setNewEditFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const undoRemoveImage = (image: string) => {
    // Check if undoing would exceed limit
    const currentKept = editImages.length - imagesToRemove.length + 1; // +1 for the one being restored
    const totalAfterUndo = currentKept + newEditImages.length;
    if (totalAfterUndo > 5) {
      alert('לא ניתן לבטל - חריגה ממגבלת 5 תמונות. הסר תמונה חדשה קודם.');
      return;
    }
    setImagesToRemove(prev => prev.filter(i => i !== image));
  };

  const undoRemoveFile = (fileUrl: string) => {
    // Check if undoing would exceed limit
    const currentKept = editFiles.length - filesToRemove.length + 1; // +1 for the one being restored
    const totalAfterUndo = currentKept + newEditFiles.length;
    if (totalAfterUndo > 5) {
      alert('לא ניתן לבטל - חריגה ממגבלת 5 קבצים. הסר קובץ חדש קודם.');
      return;
    }
    setFilesToRemove(prev => prev.filter(f => f !== fileUrl));
  };

  const addEditLink = () => {
    if (addingEditLink) return;
    const trimmedLink = editLinkInput.trim();
    if (trimmedLink) {
      const currentTotal = editLinks.length - linksToRemove.length;
      if (currentTotal >= 10) {
        alert('ניתן להוסיף עד 10 קישורים');
        return;
      }
      if (editLinks.includes(trimmedLink) && !linksToRemove.includes(trimmedLink)) {
        alert('קישור זה כבר קיים');
        return;
      }
      setAddingEditLink(true);
      setEditLinks(prev => [...prev, trimmedLink]);
      setEditLinkInput('');
      setAddingEditLink(false);
    }
  };

  const removeEditLink = (link: string) => {
    if (editLinks.includes(link)) {
      // Mark existing link for removal
      setLinksToRemove(prev => [...prev, link]);
    }
  };

  const undoRemoveEditLink = (link: string) => {
    // Check if undoing would exceed limit
    const currentKept = editLinks.length - linksToRemove.length + 1; // +1 for the one being restored
    if (currentKept > 10) {
      alert('לא ניתן לבטל - חריגה ממגבלת 10 קישורים.');
      return;
    }
    setLinksToRemove(prev => prev.filter(l => l !== link));
  };

  // Download file handler - needed for cross-origin downloads
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  // Save/Unsave handler
  const handleToggleSave = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו כדי לשמור פוסט');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to toggle save');
      const { saved } = await res.json();

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isSaved: saved,
                _count: {
                  ...post._count,
                  likes: post._count?.likes || 0,
                  comments: post._count?.comments || 0,
                  savedBy: (post._count?.savedBy || 0) + (saved ? 1 : -1),
                },
              }
            : post
        )
      );
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  // Pin/Unpin handler (owner/manager only)
  const handleTogglePin = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/pin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'שגיאה בהצמדת הפוסט');
        return;
      }

      const updatedPost = await res.json();

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, isPinned: updatedPost.isPinned, pinnedAt: updatedPost.pinnedAt }
            : post
        ).sort((a, b) => {
          // Re-sort: pinned first, then by pinnedAt, then by createdAt
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.isPinned && b.isPinned) {
            return new Date(b.pinnedAt || 0).getTime() - new Date(a.pinnedAt || 0).getTime();
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    } catch (err) {
      console.error('Toggle pin error:', err);
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete post');
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setDeletePostModalId(null);
    } catch (err) {
      console.error('Delete post error:', err);
      alert('שגיאה במחיקת הפוסט');
    }
  };

  // Load comments for a post
  const handleLoadComments = async (postId: string) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => ({ ...prev, [postId]: false }));
      return;
    }

    setLoadingComments((prev) => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      const comments = await res.json();
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    } catch (err) {
      console.error('Load comments error:', err);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Add comment handler
  const handleAddComment = async (postId: string) => {
    const token = localStorage.getItem('token');
    const content = newCommentContent[postId]?.trim();
    if (!token || !content || submittingComment[postId]) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error('Failed to add comment');
      const newComment = await res.json();

      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setNewCommentContent((prev) => ({ ...prev, [postId]: '' }));
      
      // Update comment count
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                _count: {
                  ...post._count,
                  likes: post._count?.likes || 0,
                  comments: (post._count?.comments || 0) + 1,
                },
              }
            : post
        )
      );
    } catch (err) {
      console.error('Add comment error:', err);
      alert('שגיאה בהוספת התגובה');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Search users for @mention autocomplete
  const searchUsersForMention = async (query: string) => {
    if (!query || query.length < 1) {
      setMentionSuggestions([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const users = await res.json();
        setMentionSuggestions(users);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  // Handle comment input change with @mention detection
  const handleCommentInputChange = (postId: string, value: string, cursorPosition: number) => {
    setNewCommentContent((prev) => ({ ...prev, [postId]: value }));
    
    // Find if we're typing after an @
    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([\w\u0590-\u05FF]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionCursorPos(cursorPosition);
      setShowMentionDropdown(postId);
      searchUsersForMention(query);
    } else {
      setShowMentionDropdown(null);
      setMentionSuggestions([]);
    }
  };

  // Insert selected mention into comment
  const insertMention = (postId: string, userName: string) => {
    const currentContent = newCommentContent[postId] || '';
    const textBeforeCursor = currentContent.slice(0, mentionCursorPos);
    const textAfterCursor = currentContent.slice(mentionCursorPos);
    
    // Find and replace the @query with @username
    const mentionMatch = textBeforeCursor.match(/@([\w\u0590-\u05FF]*)$/);
    if (mentionMatch) {
      const newTextBeforeCursor = textBeforeCursor.slice(0, -mentionMatch[0].length) + '@' + userName + ' ';
      setNewCommentContent((prev) => ({ ...prev, [postId]: newTextBeforeCursor + textAfterCursor }));
    }
    
    setShowMentionDropdown(null);
    setMentionSuggestions([]);
  };

  // Vote on poll handler
  const handleVotePoll = async (pollId: string, optionId: string, postId: string, currentVotedOptionId: string | null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו כדי להצביע');
      return;
    }

    setVotingPollId(pollId);
    try {
      // If clicking the same option, remove the vote
      if (currentVotedOptionId === optionId) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/polls/${pollId}/vote`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const updatedPoll = await res.json();
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId ? { ...p, poll: updatedPoll } : p
            )
          );
        }
      } else {
        // Vote for new option
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/polls/${pollId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ optionId }),
        });

        if (res.ok) {
          const updatedPoll = await res.json();
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId ? { ...p, poll: updatedPoll } : p
            )
          );
        }
      }
    } catch (err) {
      console.error('Vote poll error:', err);
      alert('שגיאה בהצבעה');
    } finally {
      setVotingPollId(null);
    }
  };

  // Delete comment handler
  const handleDeleteComment = async (commentId: string, postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      setPostComments((prev) => ({
        ...prev,
        [postId]: prev[postId]?.filter((c) => c.id !== commentId) || [],
      }));
      
      // Update comment count
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                _count: {
                  ...post._count,
                  likes: post._count?.likes || 0,
                  comments: Math.max((post._count?.comments || 0) - 1, 0),
                },
              }
            : post
        )
      );
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  // Edit comment handler
  const handleEditComment = async (commentId: string, postId: string) => {
    const token = localStorage.getItem('token');
    const content = editCommentContent.trim();
    if (!token || !content) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error('Failed to edit comment');
      const updatedComment = await res.json();

      setPostComments((prev) => ({
        ...prev,
        [postId]: prev[postId]?.map((c) =>
          c.id === commentId ? { ...c, content: updatedComment.content } : c
        ) || [],
      }));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (err) {
      console.error('Edit comment error:', err);
      alert('שגיאה בעריכת התגובה');
    }
  };

  if (!selectedCommunityId && !loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">
        <div className="text-center space-y-4">
          <p className="text-xl">אין קהילות להצגה כרגע.</p>
          <Link
            href="/communities/create"
            className="inline-flex flex-row-reverse items-center gap-2 bg-black text-white px-6 py-3 rounded-full"
          >
            <span className="inline-flex items-center justify-center text-xl leading-none">+</span>
            צרו קהילה חדשה
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-right">
      {/* Header with community picker */}
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        {/* Right side of screen (RTL first): Kibutz Logo + Community picker */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <div className="relative flex items-center gap-2">
            {community?.logo ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${community.logo}`}
                alt={community.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <FaUsers className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <div className="relative">
              <select
                value={selectedCommunityId || ''}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="border-none text-sm bg-transparent focus:outline-none font-medium text-black appearance-none cursor-pointer pr-1 pl-6"
              >
                {communities
                  .filter((c) => userMemberships.includes(c.id) || c.id === selectedCommunityId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <svg className="w-4 h-4 text-gray-400 pointer-events-none absolute left-0 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Center: Nav links */}
        <nav className="flex items-center gap-4">
          {[
            { label: 'עמוד בית', href: `/communities/feed?communityId=${selectedCommunityId}`, active: true },
            { label: 'קורסים', href: `/communities/${selectedCommunityId}/courses` },
            { label: 'חברי קהילה', href: `/communities/${selectedCommunityId}/members` },
            { label: 'יומן אירועים', href: `/communities/events?communityId=${selectedCommunityId}` },
            { label: 'לוח תוצאות', href: `/communities/${selectedCommunityId}/leaderboard` },
            { label: 'אודות', href: `/communities/${selectedCommunityId}/about` },
            ...((isOwner || isManager) ? [{ label: 'ניהול קהילה', href: `/communities/${selectedCommunityId}/manage` }] : []),
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

        {/* Left side of screen (RTL last): Search + User Avatar */}
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
          
          {/* Notification Bell */}
          {userEmail && <NotificationBell />}
          
          {/* User Avatar with Dropdown */}
          {userEmail && (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="relative focus:outline-none"
              >
                {userProfile?.profileImage ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${userProfile.profileImage}`}
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
              
              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
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
                        localStorage.removeItem('userProfileCache');
                        router.push('/');
                        location.reload();
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

      {/* Main 3-column layout - only show if member */}
      {isMember !== false && (
      <section className="flex">
        {/* LEFT: Fixed sidebar attached to left edge */}
        <div className="hidden lg:block w-[240px] flex-shrink-0 bg-white border-l border-gray-200 min-h-[calc(100vh-64px)]">
          {/* Recent Posts button */}
          <div className="p-2">
            <button 
              onClick={() => setShowSavedOnly(false)}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-xl ${
                !showSavedOnly 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1.5" opacity="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" opacity="0.6"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" opacity="0.6"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" opacity="0.3"/>
              </svg>
              <span className="text-sm font-medium">פוסטים אחרונים</span>
            </button>
          </div>

          {/* Saved Posts button */}
          {userEmail && (
            <div className="px-2 pb-2">
              <button 
                onClick={() => setShowSavedOnly(true)}
                className={`w-full px-4 py-3 flex items-center gap-3 rounded-xl ${
                  showSavedOnly 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaBookmark className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">פוסטים שמורים</span>
              </button>
            </div>
          )}

          {/* Category filter pills */}
          <div className="px-4 py-3 border-t border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-xs mb-2">סינון לפי קטגוריה</h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  categoryFilter === '' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                הכל
              </button>
              {POST_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    categoryFilter === cat.value 
                      ? cat.color + ' ring-1 ring-gray-400'
                      : cat.color + ' opacity-60 hover:opacity-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting options */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-xs mb-2">מיון לפי</h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'newest' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                חדש ביותר
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'oldest' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ישן ביותר
              </button>
              <button
                onClick={() => setSortBy('mostLiked')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'mostLiked' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                הכי אהוב
              </button>
              <button
                onClick={() => setSortBy('mostCommented')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'mostCommented' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                הכי מדובר
              </button>
            </div>
          </div>

          {/* אזור מצטרפים חדשים */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">אזור מצטרפים חדשים</h3>
            <div className="space-y-1.5 text-sm text-gray-600">
              <a href="#" className="flex items-center gap-2 hover:text-gray-900 py-1">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>בואו נתחיל</span>
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-gray-900 py-1">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                <span>הציגו את עצמכם</span>
              </a>
            </div>
          </div>

          {/* קהילה */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">קהילה</h3>
            <div className="space-y-1.5 text-sm text-gray-600">
              <a href="#" className="flex items-center gap-2 hover:text-gray-900 py-1">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span>עדכונים וחדשות</span>
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-gray-900 py-1">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <span>דיבורים</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 py-6 px-4 lg:px-6">
          {/* Mobile filters - shown on mobile only */}
          <div className="lg:hidden mb-4 space-y-2">
            <button 
              onClick={() => setShowSavedOnly(false)}
              className={`w-full rounded-xl px-4 py-2.5 text-sm flex items-center gap-3 ${
                !showSavedOnly ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1.5" opacity="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" opacity="0.6"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" opacity="0.6"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" opacity="0.3"/>
              </svg>
              <span className="font-medium">פוסטים אחרונים</span>
            </button>
            {userEmail && (
              <button 
                onClick={() => setShowSavedOnly(true)}
                className={`w-full rounded-xl px-4 py-2.5 text-sm flex items-center gap-3 ${
                  showSavedOnly ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <FaBookmark className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">פוסטים שמורים</span>
              </button>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  categoryFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                הכל
              </button>
              {POST_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    categoryFilter === cat.value ? cat.color + ' ring-1 ring-gray-400' : cat.color + ' opacity-60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {/* Mobile sorting */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-xs text-gray-500 w-full mb-1">מיון:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'newest' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                חדש ביותר
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'oldest' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                ישן ביותר
              </button>
              <button
                onClick={() => setSortBy('mostLiked')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'mostLiked' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                הכי אהוב
              </button>
              <button
                onClick={() => setSortBy('mostCommented')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  sortBy === 'mostCommented' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                הכי מדובר
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] max-w-5xl mx-auto">

          {/* CENTER: Posts feed */}
          <div className="space-y-6">
            {/* Post composer - hide when viewing saved posts */}
            {userEmail && !showSavedOnly && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  {userProfile?.profileImage ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_URL}${userProfile.profileImage}`}
                      alt={userProfile.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600 flex-shrink-0">
                      {userProfile?.name?.charAt(0) || userEmail.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="כותרת (אופציונלי)"
                    className="flex-1 text-right text-black font-medium placeholder-gray-400 focus:outline-none"
                  />
                  {/* Category selector */}
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">קטגוריה</option>
                    {POST_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="שתפו משהו עם הקהילה..."
                      className="w-full text-right text-gray-600 placeholder-gray-400 focus:outline-none resize-none"
                      rows={3}
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                </div>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-24 object-cover rounded-lg border-2 border-purple-200"
                        />
                        <button
                          onClick={() => removeSelectedImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {newPostImages.length < 5 && (
                      <span className="text-xs text-gray-400 self-center">({newPostImages.length}/5)</span>
                    )}
                  </div>
                )}
                
                {/* File Previews */}
                {filePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {filePreviews.map((file, index) => (
                      <div key={index} className="relative flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
                        {file.name.endsWith('.pdf') ? (
                          <FaFilePdf className="w-5 h-5 text-orange-500" />
                        ) : (
                          <FaFile className="w-5 h-5 text-orange-500" />
                        )}
                        <span className="text-sm text-orange-700 max-w-[150px] truncate">{file.name}</span>
                        <button
                          onClick={() => removeSelectedFile(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {newPostFiles.length < 3 && (
                      <span className="text-xs text-gray-400 self-center">({newPostFiles.length}/5)</span>
                    )}
                  </div>
                )}
                
                {/* Link Input and List */}
                {showLinkInput && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="url"
                        value={newLinkInput}
                        onChange={(e) => setNewLinkInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                        placeholder="https://example.com"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        disabled={addingLink}
                      />
                      <button
                        onClick={addLink}
                        disabled={!newLinkInput.trim() || addingLink}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingLink ? '...' : 'הוסף'}
                      </button>
                      <button
                        onClick={() => { setShowLinkInput(false); setNewLinkInput(''); }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                    {newPostLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newPostLinks.map((link, index) => (
                          <div key={index} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1 border border-blue-200">
                            <FaLink className="w-3 h-3 text-blue-500" />
                            <span className="text-sm text-blue-700 max-w-[200px] truncate">{link}</span>
                            <button
                              onClick={() => removeNewLink(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <span className="text-xs text-gray-400 self-center">({newPostLinks.length}/10)</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Poll Creator */}
                {showPollCreator && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <FaPoll className="w-4 h-4 text-indigo-500" />
                        יצירת סקר
                      </h4>
                      <button
                        onClick={() => {
                          setShowPollCreator(false);
                          setPollQuestion('');
                          setPollOptions(['', '']);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="שאלת הסקר..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                    <div className="space-y-2">
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...pollOptions];
                              newOptions[index] = e.target.value;
                              setPollOptions(newOptions);
                            }}
                            placeholder={`אפשרות ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                              className="p-2 text-red-400 hover:text-red-600"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {pollOptions.length < 6 && (
                      <button
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="mt-2 text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <FaPlus className="w-3 h-3" />
                        הוסף אפשרות
                      </button>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  {/* Attachment buttons */}
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 text-purple-500 hover:text-purple-700 transition">
                      <FaImage className="w-5 h-5" />
                      <span className="text-sm">תמונה {newPostImages.length > 0 && `(${newPostImages.length}/5)`}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={newPostImages.length >= 5}
                      />
                    </label>
                    
                    <label className="cursor-pointer flex items-center gap-2 text-orange-500 hover:text-orange-700 transition">
                      <FaFile className="w-5 h-5" />
                      <span className="text-sm">קובץ {newPostFiles.length > 0 && `(${newPostFiles.length}/5)`}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={newPostFiles.length >= 5}
                      />
                    </label>
                    
                    <button
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      className={`flex items-center gap-2 transition ${showLinkInput ? 'text-blue-600' : 'text-blue-500 hover:text-blue-700'}`}
                    >
                      <FaLink className="w-5 h-5" />
                      <span className="text-sm">קישור {newPostLinks.length > 0 && `(${newPostLinks.length}/10)`}</span>
                    </button>
                    
                    <button
                      onClick={() => setShowPollCreator(!showPollCreator)}
                      className={`flex items-center gap-2 transition ${showPollCreator ? 'text-indigo-600' : 'text-indigo-500 hover:text-indigo-700'}`}
                    >
                      <FaPoll className="w-5 h-5" />
                      <span className="text-sm">סקר</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={(e) => handleCreatePost(e as unknown as React.FormEvent)}
                    disabled={postSubmitting || !newPostContent.trim()}
                    className="px-5 py-2 bg-black text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {postSubmitting ? (
                      <span>...</span>
                    ) : (
                      <>
                        פרסם
                        <FaPlus className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Posts list */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
                  טוען פוסטים...
                </div>
              ) : (() => {
                const filteredPosts = posts
                  .filter(p => !showSavedOnly || p.isSaved)
                  .filter(p => !categoryFilter || p.category === categoryFilter)
                  .filter(p => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      p.content?.toLowerCase().includes(query) ||
                      p.title?.toLowerCase().includes(query) ||
                      p.author?.name?.toLowerCase().includes(query)
                    );
                  })
                  .sort((a, b) => {
                    // Pinned posts always first
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    // Then sort by selected criteria
                    if (sortBy === 'newest') {
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    } else if (sortBy === 'oldest') {
                      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    } else if (sortBy === 'mostLiked') {
                      return (b._count?.likes || 0) - (a._count?.likes || 0);
                    } else if (sortBy === 'mostCommented') {
                      return (b._count?.comments || 0) - (a._count?.comments || 0);
                    }
                    return 0;
                  });
                
                return filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                  <div key={post.id} className={`bg-white border rounded-2xl p-5 ${post.isPinned ? 'border-[#3F3F46] border-2' : 'border-gray-200'}`}>
                    {/* Pinned indicator */}
                    {post.isPinned && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm font-medium mb-3 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                        <FaThumbtack className="w-3 h-3" />
                        <span>פוסט מוצמד</span>
                      </div>
                    )}
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-4">
                      {/* Profile picture - rightmost (RTL) */}
                      <Link href={`/profile/${post.author?.id}`} className="cursor-pointer hover:opacity-80 transition">
                        {post.author?.profileImage ? (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL}${post.author.profileImage}`} 
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600">
                            {post.author?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      
                      {/* Author info - next to profile pic */}
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${post.author?.id}`} className="font-semibold text-black hover:underline">
                            {post.author?.name || 'משתמש אנונימי'}
                          </Link>
                          {post.category && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                              POST_CATEGORIES.find(c => c.value === post.category)?.color || 'bg-gray-100 text-gray-700'
                            }`}>
                              {POST_CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString('he-IL')} • פורסם במתכונים
                        </p>
                      </div>
                      
                      {/* Actions - leftmost (RTL) */}
                      {/* Save button */}
                      {userEmail && (
                        <button
                          onClick={() => handleToggleSave(post.id)}
                          className={`p-1 rounded-full transition ${
                            post.isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={post.isSaved ? 'הסר משמורים' : 'שמור פוסט'}
                        >
                          {post.isSaved ? <FaBookmark className="w-4 h-4" /> : <FaRegBookmark className="w-4 h-4" />}
                        </button>
                      )}
                      {/* Post menu for author OR owner/manager */}
                      {(userId === post.author?.id || isOwner || isManager) && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <FaEllipsisH className="w-4 h-4" />
                          </button>
                          {menuOpenPostId === post.id && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                              {/* Pin/Unpin - only for owner/manager */}
                              {(isOwner || isManager) && (
                                <button
                                  onClick={() => {
                                    handleTogglePin(post.id);
                                    setMenuOpenPostId(null);
                                  }}
                                  className={`w-full px-4 py-2 text-right text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                    post.isPinned ? 'text-yellow-600' : 'text-gray-700'
                                  }`}
                                >
                                  <FaThumbtack className="w-3 h-3" />
                                  {post.isPinned ? 'בטל הצמדה' : 'הצמד פוסט'}
                                </button>
                              )}
                              {/* Edit - only for author */}
                              {userId === post.author?.id && (
                                <button
                                  onClick={() => {
                                    setEditingPostId(post.id);
                                    setEditTitle(post.title || '');
                                    setEditContent(post.content);
                                    setEditImages(post.images || []);
                                    setEditFiles(post.files || []);
                                    setEditLinks(post.links || []);
                                    setNewEditImages([]);
                                    setNewEditFiles([]);
                                    setNewEditImagePreviews([]);
                                    setNewEditFilePreviews([]);
                                    setEditLinkInput('');
                                    setShowEditLinkInput(false);
                                    setImagesToRemove([]);
                                    setFilesToRemove([]);
                                    setLinksToRemove([]);
                                    setMenuOpenPostId(null);
                                  }}
                                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <FaEdit className="w-3 h-3" />
                                  עריכה
                                </button>
                              )}
                              {/* Delete - for author or owner/manager */}
                              {(userId === post.author?.id || isOwner || isManager) && (
                                <button
                                  onClick={() => {
                                    setDeletePostModalId(post.id);
                                    setMenuOpenPostId(null);
                                  }}
                                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <FaTrash className="w-3 h-3" />
                                  מחיקה
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Post Content - Editable or Display */}
                    {editingPostId === post.id ? (
                      <div className="mb-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="כותרת (אופציונלי)"
                          className="w-full p-3 mb-2 border border-gray-200 rounded-lg text-right font-medium focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg text-right resize-none focus:outline-none focus:ring-2 focus:ring-black"
                          rows={4}
                          style={{ direction: 'ltr' }}
                        />
                        
                        {/* Attachments in Edit Mode - Full editing */}
                        <div className="mt-3 space-y-3">
                          {/* Existing Images */}
                          {editImages.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">תמונות קיימות:</p>
                              <div className="flex flex-wrap gap-2">
                                {editImages.map((image, index) => (
                                  <div key={index} className={`relative ${imagesToRemove.includes(image) ? 'opacity-50' : ''}`}>
                                    <img
                                      src={`${process.env.NEXT_PUBLIC_API_URL}${image}`}
                                      alt={`תמונה ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg border-2 border-purple-200"
                                    />
                                    {imagesToRemove.includes(image) ? (
                                      <button
                                        onClick={() => undoRemoveImage(image)}
                                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 text-xs"
                                        title="בטל הסרה"
                                      >
                                        ↩
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setImagesToRemove(prev => [...prev, image])}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* New Images to add */}
                          {newEditImagePreviews.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">תמונות חדשות:</p>
                              <div className="flex flex-wrap gap-2">
                                {newEditImagePreviews.map((preview, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={preview}
                                      alt={`תמונה חדשה ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg border-2 border-green-300"
                                    />
                                    <button
                                      onClick={() => removeNewEditImage(index)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                      <FaTimes className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Existing Files */}
                          {editFiles.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">קבצים קיימים:</p>
                              <div className="flex flex-wrap gap-2">
                                {editFiles.map((file, index) => (
                                  <div key={index} className={`flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-1 border border-orange-200 ${filesToRemove.includes(file.url) ? 'opacity-50 line-through' : ''}`}>
                                    <FaFile className="w-4 h-4 text-orange-500" />
                                    <span className="text-xs text-orange-700 max-w-[100px] truncate">{file.name}</span>
                                    {filesToRemove.includes(file.url) ? (
                                      <button
                                        onClick={() => undoRemoveFile(file.url)}
                                        className="text-blue-500 hover:text-blue-700 text-xs"
                                      >
                                        ↩
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setFilesToRemove(prev => [...prev, file.url])}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* New Files to add */}
                          {newEditFilePreviews.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">קבצים חדשים:</p>
                              <div className="flex flex-wrap gap-2">
                                {newEditFilePreviews.map((file, index) => (
                                  <div key={index} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-1 border border-green-300">
                                    <FaFile className="w-4 h-4 text-green-500" />
                                    <span className="text-xs text-green-700 max-w-[100px] truncate">{file.name}</span>
                                    <button
                                      onClick={() => removeNewEditFile(index)}
                                      className="text-red-500 hover:text-red-600"
                                    >
                                      <FaTimes className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Existing Links */}
                          {editLinks.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">קישורים:</p>
                              <div className="flex flex-wrap gap-2">
                                {editLinks.map((link, index) => (
                                  <div key={index} className={`flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1 border border-blue-200 ${linksToRemove.includes(link) ? 'opacity-50 line-through' : ''}`}>
                                    <FaLink className="w-3 h-3 text-blue-500" />
                                    <span className="text-xs text-blue-700 max-w-[150px] truncate">{link}</span>
                                    {linksToRemove.includes(link) ? (
                                      <button
                                        onClick={() => undoRemoveEditLink(link)}
                                        className="text-blue-500 hover:text-blue-700 text-xs"
                                      >
                                        ↩
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => removeEditLink(link)}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Add Link Input */}
                          {showEditLinkInput && (
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={editLinkInput}
                                onChange={(e) => setEditLinkInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditLink(); } }}
                                placeholder="https://example.com"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                disabled={addingEditLink}
                              />
                              <button
                                onClick={addEditLink}
                                disabled={!editLinkInput.trim() || addingEditLink}
                                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {addingEditLink ? '...' : 'הוסף'}
                              </button>
                              <button
                                onClick={() => { setShowEditLinkInput(false); setEditLinkInput(''); }}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          
                          {/* Add attachment buttons */}
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400">הוסף:</span>
                            <label className="cursor-pointer flex items-center gap-1 text-purple-500 hover:text-purple-700 text-sm transition">
                              <FaImage className="w-4 h-4" />
                              <span>תמונה ({editImages.length - imagesToRemove.length + newEditImages.length}/5)</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleEditFileSelect}
                                className="hidden"
                                disabled={editImages.length - imagesToRemove.length + newEditImages.length >= 5}
                              />
                            </label>
                            <label className="cursor-pointer flex items-center gap-1 text-orange-500 hover:text-orange-700 text-sm transition">
                              <FaFile className="w-4 h-4" />
                              <span>קובץ ({editFiles.length - filesToRemove.length + newEditFiles.length}/5)</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                multiple
                                onChange={handleEditFileSelect}
                                className="hidden"
                                disabled={editFiles.length - filesToRemove.length + newEditFiles.length >= 5}
                              />
                            </label>
                            {!showEditLinkInput && (
                              <button
                                onClick={() => setShowEditLinkInput(true)}
                                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm transition"
                              >
                                <FaLink className="w-4 h-4" />
                                <span>קישור ({editLinks.length - linksToRemove.length}/10)</span>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3 justify-end">
                          <button
                            onClick={resetEditState}
                            disabled={editSubmitting}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                          >
                            ביטול
                          </button>
                          <button
                            onClick={() => handleEditPost(post.id)}
                            disabled={editSubmitting || !editContent.trim()}
                            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editSubmitting ? '...' : 'שמור'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        {post.title && (
                          <h3 className="text-lg font-bold text-black mb-2">{post.title}</h3>
                        )}
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        
                        {/* Poll Display */}
                        {post.poll && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <FaPoll className="w-4 h-4 text-indigo-500" />
                              <h4 className="font-medium text-gray-900">{post.poll.question}</h4>
                            </div>
                            <div className="space-y-2">
                              {post.poll.options.map((option) => {
                                const isVoted = post.poll?.userVotedOptionId === option.id;
                                const hasVoted = !!post.poll?.userVotedOptionId;
                                const isVoting = votingPollId === post.poll?.id;
                                
                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => post.poll && handleVotePoll(post.poll.id, option.id, post.id, post.poll.userVotedOptionId)}
                                    disabled={isVoting}
                                    className={`w-full relative overflow-hidden rounded-lg border transition ${
                                      isVoted 
                                        ? 'border-indigo-400 bg-indigo-50' 
                                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                    }`}
                                  >
                                    {/* Progress bar background */}
                                    <div 
                                      className={`absolute inset-y-0 right-0 transition-all duration-500 ${isVoted ? 'bg-indigo-100' : 'bg-gray-100'}`}
                                      style={{ width: `${option.percentage}%` }}
                                    />
                                    <div className="relative flex items-center justify-between px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        {isVoted && <FaCheck className="w-3 h-3 text-indigo-600" />}
                                        <span className={`text-sm ${isVoted ? 'font-medium text-indigo-700' : 'text-gray-700'}`}>
                                          {option.text}
                                        </span>
                                      </div>
                                      <span className={`text-sm font-medium ${isVoted ? 'text-indigo-600' : 'text-gray-500'}`}>
                                        {option.votes} ({option.percentage}%)
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                              {post.poll.totalVotes} {post.poll.totalVotes === 1 ? 'הצבעה' : 'הצבעות'}
                            </p>
                          </div>
                        )}
                        
                        {/* Images Display - Dynamic sizing based on count */}
                        {post.images && post.images.length > 0 && (
                          <div className={`mt-3 grid gap-2 ${
                            post.images.length === 1 ? 'grid-cols-1' : 
                            post.images.length === 2 ? 'grid-cols-2' : 
                            post.images.length === 3 ? 'grid-cols-3' :
                            post.images.length === 4 ? 'grid-cols-2' :
                            'grid-cols-3'
                          }`}>
                            {post.images.slice(0, 5).map((image, index) => (
                              <div 
                                key={index} 
                                className={`relative ${
                                  post.images!.length === 1 ? '' : 
                                  post.images!.length === 3 && index === 0 ? 'col-span-3' :
                                  post.images!.length === 5 && index < 2 ? 'col-span-1' :
                                  ''
                                }`}
                              >
                                <img
                                  src={`${process.env.NEXT_PUBLIC_API_URL}${image}`}
                                  alt={`תמונה ${index + 1}`}
                                  className={`w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition ${
                                    post.images!.length === 1 ? 'max-h-[500px]' :
                                    post.images!.length === 2 ? 'h-64' :
                                    post.images!.length === 3 && index === 0 ? 'h-64' :
                                    post.images!.length === 3 ? 'h-40' :
                                    post.images!.length === 4 ? 'h-48' :
                                    'h-40'
                                  }`}
                                  onClick={() => openLightbox(post.images!, index)}
                                />
                                {/* Show remaining count on 5th image if more than 5 */}
                                {index === 4 && post.images!.length > 5 && (
                                  <div 
                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                                    onClick={() => openLightbox(post.images!, index)}
                                  >
                                    <span className="text-white text-2xl font-bold">+{post.images!.length - 5}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Files Display */}
                        {post.files && post.files.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {post.files.map((file, index) => (
                              <button
                                key={index}
                                onClick={() => handleDownload(
                                  `${file.url}`,
                                  file.name || 'file'
                                )}
                                className="w-full flex items-center gap-3 bg-orange-50 rounded-lg px-4 py-3 border border-orange-200 hover:bg-orange-100 transition text-right"
                              >
                                {file.name?.endsWith('.pdf') ? (
                                  <FaFilePdf className="w-6 h-6 text-orange-600" />
                                ) : (
                                  <FaFile className="w-6 h-6 text-orange-500" />
                                )}
                                <span className="flex-1 text-sm text-orange-700">{file.name || 'קובץ מצורף'}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Links Display with Preview */}
                        {post.links && post.links.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {post.links.map((link, index) => {
                              const preview = linkPreviews[link];
                              return (
                                <a
                                  key={index}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
                                >
                                  {preview?.image && (
                                    <div className="w-full h-40 bg-gray-100">
                                      <img 
                                        src={preview.image} 
                                        alt={preview.title || link}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="p-3">
                                    <div className="flex items-start gap-2">
                                      <FaLink className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        {preview?.title ? (
                                          <>
                                            <p className="font-medium text-gray-900 text-sm truncate">{preview.title}</p>
                                            {preview.description && (
                                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{preview.description}</p>
                                            )}
                                            <p className="text-xs text-blue-500 mt-1 truncate">{new URL(link).hostname}</p>
                                          </>
                                        ) : (
                                          <p className="text-sm text-blue-600 truncate">{link}</p>
                                        )}
                                      </div>
                                      <FaExternalLinkAlt className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Like & Comment Buttons */}
                    <div className="flex items-center gap-4 text-gray-400 text-sm border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1 transition ${
                          post.isLiked ? 'text-red-500' : 'hover:text-red-500'
                        }`}
                      >
                        {post.isLiked ? <FaHeart className="w-4 h-4" /> : <FaRegHeart className="w-4 h-4" />}
                        <span>{post._count?.likes || 0}</span>
                      </button>
                      <button
                        onClick={() => handleLoadComments(post.id)}
                        className="flex items-center gap-1 hover:text-blue-500"
                      >
                        <FaComments className="w-4 h-4" />
                        <span>{post._count?.comments || 0}</span>
                      </button>
                    </div>
                    
                    {/* Comments Section */}
                    {expandedComments[post.id] && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        {/* Comments List */}
                        {loadingComments[post.id] ? (
                          <p className="text-sm text-gray-400 text-center">טוען תגובות...</p>
                        ) : (
                          <div className="space-y-3 mb-4">
                            {postComments[post.id]?.length > 0 ? (
                              postComments[post.id].map((comment) => (
                                <div key={comment.id} className="flex gap-2 items-start" dir="rtl">
                                  <Link href={`/profile/${comment.user?.id}`} className="flex-shrink-0">
                                    {comment.user?.profileImage ? (
                                      <img 
                                        src={`${process.env.NEXT_PUBLIC_API_URL}${comment.user.profileImage}`} 
                                        alt={comment.user.name}
                                        className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 hover:opacity-80 transition">
                                        {comment.user?.name?.charAt(0) || '?'}
                                      </div>
                                    )}
                                  </Link>
                                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <Link href={`/profile/${comment.user?.id}`} className="font-medium text-sm text-black hover:underline">
                                        {comment.user?.name || 'משתמש'}
                                      </Link>
                                      <span className="text-xs text-gray-400">
                                        {new Date(comment.createdAt).toLocaleDateString('he-IL')}
                                      </span>
                                    </div>
                                    {editingCommentId === comment.id ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={editCommentContent}
                                          onChange={(e) => setEditCommentContent(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && editCommentContent.trim()) {
                                              handleEditComment(comment.id, post.id);
                                            } else if (e.key === 'Escape') {
                                              setEditingCommentId(null);
                                              setEditCommentContent('');
                                            }
                                          }}
                                          className="flex-1 px-2 py-1 border border-blue-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleEditComment(comment.id, post.id)}
                                          className="text-green-500 hover:text-green-600 p-1"
                                          title="שמור"
                                        >
                                          <FaCheck className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => { setEditingCommentId(null); setEditCommentContent(''); }}
                                          className="text-gray-400 hover:text-gray-600 p-1"
                                          title="בטל"
                                        >
                                          <FaTimes className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700 text-right">{comment.content}</p>
                                    )}
                                  </div>
                                  {userId === comment.user?.id && editingCommentId !== comment.id && (
                                    <div className="relative" dir="ltr">
                                      <button
                                        onClick={() => setCommentMenuOpenId(commentMenuOpenId === comment.id ? null : comment.id)}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                      >
                                        <FaEllipsisH className="w-3 h-3" />
                                      </button>
                                      {commentMenuOpenId === comment.id && (
                                        <>
                                          <div 
                                            className="fixed inset-0 z-10"
                                            onClick={() => setCommentMenuOpenId(null)}
                                          />
                                          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[100px]">
                                            <button
                                              onClick={() => { 
                                                setEditingCommentId(comment.id); 
                                                setEditCommentContent(comment.content);
                                                setCommentMenuOpenId(null);
                                              }}
                                              className="w-full px-3 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                              <FaEdit className="w-3 h-3" />
                                              עריכה
                                            </button>
                                            <button
                                              onClick={() => {
                                                handleDeleteComment(comment.id, post.id);
                                                setCommentMenuOpenId(null);
                                              }}
                                              className="w-full px-3 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                              <FaTrash className="w-3 h-3" />
                                              מחיקה
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-400 text-center">אין תגובות עדיין</p>
                            )}
                          </div>
                        )}
                        
                        {/* Add Comment Input */}
                        {userEmail && (
                          <div className="relative flex gap-2 items-center">
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newCommentContent[post.id]?.trim() || submittingComment[post.id]}
                              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submittingComment[post.id] ? '...' : 'שלח'}
                            </button>
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={newCommentContent[post.id] || ''}
                                onChange={(e) => handleCommentInputChange(post.id, e.target.value, e.target.selectionStart || 0)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setShowMentionDropdown(null);
                                    setMentionSuggestions([]);
                                  } else if (e.key === 'Enter' && !showMentionDropdown && newCommentContent[post.id]?.trim() && !submittingComment[post.id]) {
                                    handleAddComment(post.id);
                                  }
                                }}
                                onBlur={() => {
                                  // Delay hiding to allow click on suggestion
                                  setTimeout(() => setShowMentionDropdown(null), 200);
                                }}
                                disabled={submittingComment[post.id]}
                                placeholder="כתבו תגובה... (הקלידו @ לאזכור)"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                              />
                              {/* Mention Autocomplete Dropdown */}
                              {showMentionDropdown === post.id && mentionSuggestions.length > 0 && (
                                <div className="absolute bottom-full right-0 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                  {mentionSuggestions.map((user) => (
                                    <button
                                      key={user.id}
                                      type="button"
                                      onClick={() => insertMention(post.id, user.name)}
                                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 text-right"
                                    >
                                      {user.profileImage ? (
                                        <img 
                                          src={`${process.env.NEXT_PUBLIC_API_URL}${user.profileImage}`}
                                          alt={user.name}
                                          className="w-6 h-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-600">
                                          {user.name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="text-sm text-gray-800">{user.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {userProfile?.profileImage ? (
                              <img 
                                src={`${process.env.NEXT_PUBLIC_API_URL}${userProfile.profileImage}`}
                                alt={userProfile.name || 'User'}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 flex-shrink-0">
                                {userProfile?.name?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
                  {searchQuery.trim() ? (
                    <div className="space-y-2">
                      <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p>לא נמצאו תוצאות עבור "{searchQuery}"</p>
                    </div>
                  ) : showSavedOnly ? (
                    <div className="space-y-2">
                      <FaRegBookmark className="w-8 h-8 mx-auto text-gray-300" />
                      <p>אין לכם פוסטים שמורים עדיין</p>
                      <p className="text-sm">לחצו על סימן השמירה בפוסט כדי לשמור אותו</p>
                    </div>
                  ) : (
                    'עדיין אין פוסטים בקהילה זו.'
                  )}
                </div>
              );
            })()}
            </div>
          </div>

          {/* RIGHT: Sidebar with online members, rules, events, top members */}
          <div className="space-y-4">
            {/* Online Members */}
            <div className="bg-[#F7F8FA] rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 left-0 animate-ping opacity-75"></div>
                </div>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-black">{onlineCount}</span> חברים מחוברים עכשיו
                </span>
              </div>
            </div>

            {/* כללי הקהילה */}
            <div className="bg-[#F7F8FA] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="font-semibold text-black">כללי הקהילה</h3>
              </div>
              {community?.rules && community.rules.length > 0 ? (
                <>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {(rulesExpanded ? community.rules : community.rules.slice(0, 3)).map((rule, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                  {community.rules.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setRulesExpanded(!rulesExpanded)}
                      className="mt-3 text-sm text-gray-500 hover:text-gray-700 transition"
                    >
                      {rulesExpanded ? 'הצג פחות' : `הצג עוד ${community.rules.length - 3} כללים`}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm text-center py-2">
                  {(isOwner || isManager) ? (
                    <Link href={`/communities/${selectedCommunityId}/manage`} className="text-blue-600 hover:underline">
                      הוסיפו כללים לקהילה
                    </Link>
                  ) : (
                    'לא הוגדרו כללים לקהילה זו'
                  )}
                </p>
              )}
            </div>

            {/* אירועים קרובים */}
            <div className="bg-[#F7F8FA] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 flex-shrink-0 text-gray-500" />
                  <h3 className="font-semibold text-black">אירועים קרובים</h3>
                </div>
                <Link 
                  href={`/communities/events?communityId=${selectedCommunityId}`}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  הכל
                </Link>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map(event => {
                    const eventDate = new Date(event.date);
                    const formatEventTime = eventDate.toLocaleTimeString('he-IL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    
                    return (
                      <Link
                        key={event.id}
                        href={`/communities/events?communityId=${selectedCommunityId}`}
                        className="block p-3 bg-white rounded-xl hover:shadow-sm transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-black text-white rounded-xl flex flex-col items-center justify-center text-sm font-medium flex-shrink-0">
                            <span className="text-lg font-bold">{eventDate.getDate()}</span>
                            <span className="text-[10px] opacity-70">
                              {eventDate.toLocaleDateString('he-IL', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">{event.title}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              {event.locationType === 'online' ? (
                                <FaVideo className="w-3 h-3" />
                              ) : (
                                <FaMapMarkerAlt className="w-3 h-3" />
                              )}
                              <span>{formatEventTime}</span>
                              {event._count?.rsvps ? (
                                <>
                                  <span>·</span>
                                  <span>{event._count.rsvps} מגיעים</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-2">אין אירועים קרובים</p>
              )}
            </div>

            {/* חברי קהילה מובילים */}
            <div className="bg-[#F7F8FA] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FaUsers className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <h3 className="font-semibold text-black">חברי קהילה מובילים</h3>
              </div>
              <div className="space-y-4 text-sm">
                {topMembers.length > 0 ? (
                  topMembers.map((member) => {
                    const getRankIcon = (rank: number) => {
                      switch (rank) {
                        case 1:
                          return <FaTrophy className="w-5 h-5" style={{ color: '#FFD700' }} />;
                        case 2:
                          return <FaMedal className="w-5 h-5" style={{ color: '#A8A8A8' }} />;
                        case 3:
                          return <FaMedal className="w-5 h-5" style={{ color: '#CD7F32' }} />;
                        default:
                          return <span className="text-gray-500 text-xs font-bold">{rank}</span>;
                      }
                    };
                    return (
                      <div key={member.userId} className="flex items-center gap-3">
                        {/* Rank medal */}
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {getRankIcon(member.rank)}
                        </div>
                        {/* Profile picture */}
                        <Link href={`/profile/${member.userId}`} className="flex-shrink-0">
                          {member.profileImage ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${member.profileImage}`}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:opacity-80 transition">
                              {member.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </Link>
                        {/* Name */}
                        <Link href={`/profile/${member.userId}`} className="font-medium text-black flex-1 hover:underline">
                          {member.name}
                        </Link>
                        {/* Score */}
                        <span className="text-gray-400 font-medium">{member.points}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">אין נתונים עדיין</p>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
      )}

      {/* Lightbox Modal */}
      {showLightbox && lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
          >
            <FaTimes className="w-8 h-8" />
          </button>

          {/* Image counter */}
          {lightboxImages.length > 1 && (
            <div className="absolute top-4 left-4 text-white text-lg font-medium bg-black bg-opacity-50 px-3 py-1 rounded-lg">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}

          {/* Previous button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Main image */}
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${lightboxImages[lightboxIndex]}`}
            alt={`תמונה ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Thumbnail strip for multiple images */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-lg">
              {lightboxImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                    idx === lightboxIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${img}`}
                    alt={`תמונה ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {deletePostModalId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
          onClick={() => setDeletePostModalId(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FaTrash className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">מחיקת פוסט</h3>
              <p className="text-gray-600 mb-6">האם אתם בטוחים שברצונכם למחוק את הפוסט? פעולה זו לא ניתנת לביטול.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletePostModalId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  ביטול
                </button>
                <button
                  onClick={() => handleDeletePost(deletePostModalId)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                >
                  מחיקה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CommunityFeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <CommunityFeedContent />
    </Suspense>
  );
}
