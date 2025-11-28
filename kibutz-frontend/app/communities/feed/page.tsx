'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import {
  FaPlus,
  FaLock,
  FaCalendarAlt,
  FaUsers,
  FaMapMarkerAlt,
  FaUserPlus,
  FaBell,
  FaComments,
  FaBook,
  FaLightbulb,
  FaQuestionCircle,
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
  FaDownload,
  FaCheck,
  FaExternalLinkAlt,
  FaCog,
  FaSignOutAlt,
  FaSearch,
} from 'react-icons/fa';
import { TopicIcon } from '../../lib/topicIcons';

interface Community {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  ownerId: string;
  createdAt: string;
  topic?: string | null;
  memberCount?: number | null;
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
  image?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  linkUrl?: string | null;
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
}

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

// NAV_LINKS will be generated dynamically based on communityId

export default function CommunityFeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCommunityId = searchParams.get('communityId');

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(initialCommunityId);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{ type: 'image' | 'file'; name?: string; url?: string } | null>(null);
  const [newPostLink, setNewPostLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postSubmitting, setPostSubmitting] = useState(false);
  
  // Edit/Delete state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [showEditLinkInput, setShowEditLinkInput] = useState(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<{ type: 'image' | 'file'; name?: string; url?: string } | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeFile, setRemoveFile] = useState(false);
  const [removeLink, setRemoveLink] = useState(false);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  
  // Filter state
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  
  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserEmail(decoded.email);
        setUserId(decoded.sub);
        
        // Fetch user profile and memberships
        fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setUserProfile({ name: data.name, profileImage: data.profileImage });
          });
        
        // Fetch user's community memberships
        fetch('http://localhost:4000/communities/user/memberships', {
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
        const res = await fetch('http://localhost:4000/communities');
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
            `http://localhost:4000/communities/${selectedCommunityId}/membership`,
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
              const communityRes = await fetch(`http://localhost:4000/communities/${selectedCommunityId}`);
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
          const communityRes = await fetch(`http://localhost:4000/communities/${selectedCommunityId}`);
          if (communityRes.ok) {
            setCommunity(await communityRes.json());
          }
          setPosts([]);
          setLoading(false);
          return;
        }
        
        const [communityRes, postsRes] = await Promise.all([
          fetch(`http://localhost:4000/communities/${selectedCommunityId}`),
          fetch(`http://localhost:4000/posts/community/${selectedCommunityId}${userId ? `?userId=${userId}` : ''}`),
        ]);

        if (!communityRes.ok) throw new Error('Failed to fetch community');
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
              `http://localhost:4000/communities/${selectedCommunityId}/top-members`,
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
            `http://localhost:4000/communities/${selectedCommunityId}/online-count`
          );
          if (onlineRes.ok) {
            const onlineData = await onlineRes.json();
            setOnlineCount(onlineData.onlineCount);
          }
        } catch (err) {
          console.error('Error fetching online count:', err);
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
  }, [selectedCommunityId, userId]);

  // Refresh online count every 30 seconds
  useEffect(() => {
    if (!selectedCommunityId) return;
    
    const refreshOnlineCount = async () => {
      try {
        const onlineRes = await fetch(
          `http://localhost:4000/communities/${selectedCommunityId}/online-count`
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
      if (newPostFile) {
        formData.append('file', newPostFile);
      }
      if (newPostLink.trim()) {
        formData.append('linkUrl', newPostLink.trim());
      }
      
      const res = await fetch(`http://localhost:4000/posts/community/${selectedCommunityId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to create post');
      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setNewPostContent('');
      setNewPostTitle('');
      setNewPostFile(null);
      setFilePreview(null);
      setNewPostLink('');
      setShowLinkInput(false);
    } catch (err) {
      console.error('Create post error:', err);
      alert('שגיאה בפרסום הפוסט');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview({ type: 'image', url: reader.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview({ type: 'file', name: file.name });
      }
    }
  };

  const removeSelectedFile = () => {
    setNewPostFile(null);
    setFilePreview(null);
  };

  // Like/Unlike handler
  const handleToggleLike = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו כדי לתת לייק');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}/like`, {
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

  // Edit post handler
  const handleEditPost = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token || !editContent.trim()) return;

    try {
      const formData = new FormData();
      formData.append('content', editContent);
      if (editTitle.trim()) formData.append('title', editTitle.trim());
      if (editLink.trim()) formData.append('linkUrl', editLink.trim());
      if (removeImage) formData.append('removeImage', 'true');
      if (removeFile) formData.append('removeFile', 'true');
      if (removeLink) formData.append('removeLink', 'true');
      if (editFile) formData.append('file', editFile);
      
      const res = await fetch(`http://localhost:4000/posts/${postId}`, {
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
    }
  };

  const resetEditState = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditTitle('');
    setEditLink('');
    setShowEditLinkInput(false);
    setEditFile(null);
    setEditFilePreview(null);
    setRemoveImage(false);
    setRemoveFile(false);
    setRemoveLink(false);
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFile(file);
      
      if (file.type.startsWith('image/')) {
        // If adding new image, mark old one for removal
        setRemoveImage(true);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditFilePreview({ type: 'image', url: reader.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        // If adding new file, mark old one for removal
        setRemoveFile(true);
        setEditFilePreview({ type: 'file', name: file.name });
      }
    }
  };

  const removeEditFile = () => {
    setEditFile(null);
    setEditFilePreview(null);
    // Don't reset remove flags - user might still want to remove old ones
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
      const res = await fetch(`http://localhost:4000/posts/${postId}/save`, {
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

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('האם אתם בטוחים שברצונכם למחוק את הפוסט?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete post');
      setPosts((prev) => prev.filter((post) => post.id !== postId));
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
      const res = await fetch(`http://localhost:4000/posts/${postId}/comments`);
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
    if (!token || !content) return;

    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}/comments`, {
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
    }
  };

  // Delete comment handler
  const handleDeleteComment = async (commentId: string, postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/posts/comments/${commentId}`, {
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
      const res = await fetch(`http://localhost:4000/posts/comments/${commentId}`, {
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
      <header dir="rtl" className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        {/* Right side of screen (RTL first): Kibutz Logo + Community picker */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <div className="relative flex items-center gap-2">
            <TopicIcon topic={community?.topic} size="md" />
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
            { label: 'קורס', href: '#' },
            { label: 'חברי קהילה', href: `/communities/${selectedCommunityId}/members` },
            { label: 'יומן', href: '#' },
            { label: 'לוח תוצאות', href: '#' },
            { label: 'אודות', href: `/communities/${selectedCommunityId}/about` },
            ...((isOwner || isManager) ? [{ label: 'ניהול', href: `/communities/${selectedCommunityId}/manage` }] : []),
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
        <div className="flex items-center gap-4">
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
          
          {/* User Avatar with Dropdown */}
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
              
              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
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
          )}
        </div>
      </header>

      {/* Not a member message */}
      {isMember === false && community && (
        <section className="max-w-2xl mx-auto py-16 px-4 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm">
            {community.image ? (
              <img
                src={`http://localhost:4000${community.image}`}
                alt={community.name}
                className="w-32 h-32 rounded-full object-cover mx-auto mb-6 border-4 border-gray-100"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-green-100 mx-auto mb-6 flex items-center justify-center border-4 border-gray-100">
                <FaUsers className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-black mb-3">{community.name}</h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{community.description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
              <span>{community.memberCount ?? 0} חברים</span>
              {community.topic && (
                <>
                  <span>•</span>
                  <span>{community.topic}</span>
                </>
              )}
            </div>
            
            <p className="text-gray-600 mb-6">על מנת להצטרף לקהילה, יש לעשות זאת מהעמוד הראשי</p>
            
            <Link 
              href="/"
              className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition inline-block"
            >
              חזרה לעמוד הראשי
            </Link>
          </div>
        </section>
      )}

      {/* Main 3-column layout - only show if member */}
      {isMember !== false && (
      <section className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_220px]">
          {/* LEFT: White sidebar tabs */}
          <div className="space-y-4 order-2 lg:order-1">
            {/* Filter buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSavedOnly(false)}
                className={`flex-1 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition ${
                  !showSavedOnly ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>פוסטים אחרונים</span>
              </button>
              {userEmail && (
                <button 
                  onClick={() => setShowSavedOnly(true)}
                  className={`flex-1 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition ${
                    showSavedOnly ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <FaBookmark className="w-4 h-4" />
                  <span>שמורים</span>
                </button>
              )}
            </div>

            {/* אזור מצטרפים חדשים */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-black mb-3">אזור מצטרפים חדשים</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <a href="#" className="flex items-center gap-2 hover:text-black">
                  <FaMapMarkerAlt className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>בואו נתחיל</span>
                </a>
                <a href="#" className="flex items-center gap-2 hover:text-black">
                  <FaUserPlus className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>הציגו את עצמכם</span>
                </a>
              </div>
            </div>

            {/* קהילה */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-black mb-3">קהילה</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <a href="#" className="flex items-center gap-2 hover:text-black">
                  <FaBell className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>עדכונים וחדשות</span>
                </a>
                <a href="#" className="flex items-center gap-2 hover:text-black">
                  <FaComments className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>דיבורים</span>
                </a>
              </div>
            </div>

            {/* מדברים אפייה */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-black mb-3">מדברים אפייה</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <a href="#" className="flex items-center gap-2 hover:text-black">
                  <FaBook className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>מתכונים</span>
                </a>
                <a href="#" className="flex items-center gap-2 hover:text-black">
                  <FaLightbulb className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>טיפים לבישול ואפייה</span>
                </a>
                <a href="#" className="flex items-center gap-2 hover:text-black">
                  <FaQuestionCircle className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>שאלות ותשובות</span>
                </a>
              </div>
            </div>

          </div>

          {/* CENTER: Posts feed */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Post composer - hide when viewing saved posts */}
            {userEmail && !showSavedOnly && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  {userProfile?.profileImage ? (
                    <img 
                      src={`http://localhost:4000${userProfile.profileImage}`}
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
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="שתפו משהו עם הקהילה..."
                      className="w-full text-right text-gray-600 placeholder-gray-400 focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* File/Image Preview */}
                {filePreview && (
                  <div className="relative mt-3 inline-block">
                    {filePreview.type === 'image' ? (
                      <div className="relative">
                        <img
                          src={filePreview.url}
                          alt="Preview"
                          className="max-h-48 rounded-lg border-2 border-purple-200"
                        />
                        <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                          תמונה
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-orange-50 rounded-lg px-4 py-3 border border-orange-200">
                        {filePreview.name?.endsWith('.pdf') ? (
                          <FaFilePdf className="w-6 h-6 text-orange-500" />
                        ) : (
                          <FaFile className="w-6 h-6 text-orange-500" />
                        )}
                        <span className="text-sm text-orange-700">{filePreview.name}</span>
                      </div>
                    )}
                    <button
                      onClick={removeSelectedFile}
                      className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {/* Link Input */}
                {showLinkInput && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="url"
                      value={newPostLink}
                      onChange={(e) => setNewPostLink(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      onClick={() => { setShowLinkInput(false); setNewPostLink(''); }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  {/* Attachment buttons */}
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 text-purple-500 hover:text-purple-700 transition">
                      <FaImage className="w-5 h-5" />
                      <span className="text-sm">תמונה</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    
                    <label className="cursor-pointer flex items-center gap-2 text-orange-500 hover:text-orange-700 transition">
                      <FaFile className="w-5 h-5" />
                      <span className="text-sm">קובץ</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    
                    <button
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      className={`flex items-center gap-2 transition ${showLinkInput ? 'text-blue-600' : 'text-blue-500 hover:text-blue-700'}`}
                    >
                      <FaLink className="w-5 h-5" />
                      <span className="text-sm">קישור</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={(e) => handleCreatePost(e as unknown as React.FormEvent)}
                    disabled={postSubmitting || !newPostContent.trim()}
                    className="px-5 py-2 bg-black text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaPlus className="w-3 h-3" />
                    פרסם
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
                  .filter(p => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      p.content?.toLowerCase().includes(query) ||
                      p.title?.toLowerCase().includes(query) ||
                      p.author?.name?.toLowerCase().includes(query)
                    );
                  });
                
                return filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                  <div key={post.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-black">{post.author?.name || 'משתמש אנונימי'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString('he-IL')} • פורסם במתכונים
                        </p>
                      </div>
                      {post.author?.profileImage ? (
                        <img 
                          src={`http://localhost:4000${post.author.profileImage}`} 
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600">
                          {post.author?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      
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
                      {/* Post menu for author */}
                      {userId === post.author?.id && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <FaEllipsisH className="w-4 h-4" />
                          </button>
                          {menuOpenPostId === post.id && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                              <button
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setEditTitle(post.title || '');
                                  setEditContent(post.content);
                                  setEditLink(post.linkUrl || '');
                                  setShowEditLinkInput(false);
                                  setRemoveImage(false);
                                  setRemoveFile(false);
                                  setRemoveLink(false);
                                  setEditFile(null);
                                  setEditFilePreview(null);
                                  setMenuOpenPostId(null);
                                }}
                                className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <FaEdit className="w-3 h-3" />
                                עריכה
                              </button>
                              <button
                                onClick={() => {
                                  handleDeletePost(post.id);
                                  setMenuOpenPostId(null);
                                }}
                                className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <FaTrash className="w-3 h-3" />
                                מחיקה
                              </button>
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
                        />
                        
                        {/* Attachments in Edit Mode */}
                        <div className="mt-3 space-y-2">
                          {/* Image in edit mode */}
                          {post.image && !removeImage && (
                            <div className="flex items-center gap-3 bg-purple-50 rounded-lg px-4 py-2 border border-purple-200">
                              <FaImage className="w-5 h-5 text-purple-500" />
                              <span className="flex-1 text-sm text-purple-700">תמונה מצורפת</span>
                              <button
                                onClick={() => setRemoveImage(true)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="הסר תמונה"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {removeImage && (
                            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2 border border-gray-300 opacity-60">
                              <FaImage className="w-5 h-5 text-gray-400" />
                              <span className="flex-1 text-sm text-gray-500 line-through">תמונה תוסר</span>
                              <button
                                onClick={() => setRemoveImage(false)}
                                className="text-blue-500 hover:text-blue-700 text-xs"
                              >
                                בטל
                              </button>
                            </div>
                          )}
                          
                          {/* File in edit mode */}
                          {post.fileUrl && !removeFile && (
                            <div className="flex items-center gap-3 bg-orange-50 rounded-lg px-4 py-2 border border-orange-200">
                              <FaFile className="w-5 h-5 text-orange-500" />
                              <span className="flex-1 text-sm text-orange-700">{post.fileName || 'קובץ מצורף'}</span>
                              <button
                                onClick={() => setRemoveFile(true)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="הסר קובץ"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {removeFile && (
                            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2 border border-gray-300 opacity-60">
                              <FaFile className="w-5 h-5 text-gray-400" />
                              <span className="flex-1 text-sm text-gray-500 line-through">{post.fileName || 'קובץ'} יוסר</span>
                              <button
                                onClick={() => setRemoveFile(false)}
                                className="text-blue-500 hover:text-blue-700 text-xs"
                              >
                                בטל
                              </button>
                            </div>
                          )}
                          
                          {/* Link in edit mode */}
                          {post.linkUrl && !removeLink && !showEditLinkInput && (
                            <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-2 border border-blue-200">
                              <FaLink className="w-5 h-5 text-blue-500" />
                              <span className="flex-1 text-sm text-blue-700 truncate">{post.linkUrl}</span>
                              <button
                                onClick={() => { setShowEditLinkInput(true); setEditLink(post.linkUrl || ''); }}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="ערוך קישור"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRemoveLink(true)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="הסר קישור"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {removeLink && (
                            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2 border border-gray-300 opacity-60">
                              <FaLink className="w-5 h-5 text-gray-400" />
                              <span className="flex-1 text-sm text-gray-500 line-through">קישור יוסר</span>
                              <button
                                onClick={() => { setRemoveLink(false); setShowEditLinkInput(false); }}
                                className="text-blue-500 hover:text-blue-700 text-xs"
                              >
                                בטל
                              </button>
                            </div>
                          )}
                          {showEditLinkInput && !removeLink && (
                            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                              <FaLink className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              <input
                                type="url"
                                value={editLink}
                                onChange={(e) => setEditLink(e.target.value)}
                                placeholder="הזן קישור..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                              <button
                                onClick={() => { setShowEditLinkInput(false); setEditLink(''); }}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          
                          {/* New file preview in edit mode */}
                          {editFilePreview && (
                            <div className="relative">
                              {editFilePreview.type === 'image' ? (
                                <div className="flex items-center gap-3 bg-purple-50 rounded-lg px-4 py-2 border-2 border-purple-300">
                                  <FaImage className="w-5 h-5 text-purple-500" />
                                  <span className="flex-1 text-sm text-purple-700">תמונה חדשה נבחרה</span>
                                  <button
                                    onClick={removeEditFile}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <FaTimes className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 bg-orange-50 rounded-lg px-4 py-2 border-2 border-orange-300">
                                  <FaFile className="w-5 h-5 text-orange-500" />
                                  <span className="flex-1 text-sm text-orange-700">{editFilePreview.name}</span>
                                  <button
                                    onClick={removeEditFile}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <FaTimes className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Add new attachment buttons */}
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-2">
                            <span className="text-xs text-gray-400">הוסף:</span>
                            <label className="cursor-pointer flex items-center gap-1 text-purple-500 hover:text-purple-700 text-sm transition">
                              <FaImage className="w-4 h-4" />
                              <span>תמונה</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditFileSelect}
                                className="hidden"
                              />
                            </label>
                            <label className="cursor-pointer flex items-center gap-1 text-orange-500 hover:text-orange-700 text-sm transition">
                              <FaFile className="w-4 h-4" />
                              <span>קובץ</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                onChange={handleEditFileSelect}
                                className="hidden"
                              />
                            </label>
                            {!showEditLinkInput && !post.linkUrl && !removeLink && (
                              <button
                                onClick={() => setShowEditLinkInput(true)}
                                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm transition"
                              >
                                <FaLink className="w-4 h-4" />
                                <span>קישור</span>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3 justify-end">
                          <button
                            onClick={resetEditState}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            ביטול
                          </button>
                          <button
                            onClick={() => handleEditPost(post.id)}
                            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:opacity-90"
                          >
                            שמור
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        {post.title && (
                          <h3 className="text-lg font-bold text-black mb-2">{post.title}</h3>
                        )}
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        
                        {/* Image Display */}
                        {post.image && (
                          <div className="mt-3 relative inline-block">
                            <img
                              src={`http://localhost:4000${post.image}`}
                              alt="Post image"
                              className="max-w-full rounded-lg border-2 border-purple-200"
                            />
                            <button
                              onClick={() => handleDownload(
                                `http://localhost:4000${post.image}`,
                                post.image?.split('/').pop() || 'image'
                              )}
                              className="absolute bottom-3 left-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm transition"
                            >
                              <FaDownload className="w-3 h-3" />
                              הורד
                            </button>
                          </div>
                        )}
                        
                        {/* File Display */}
                        {post.fileUrl && (
                          <button
                            onClick={() => handleDownload(
                              `http://localhost:4000${post.fileUrl}`,
                              post.fileName || 'file'
                            )}
                            className="mt-3 w-full flex items-center gap-3 bg-orange-50 rounded-lg px-4 py-3 border border-orange-200 hover:bg-orange-100 transition text-right"
                          >
                            {post.fileName?.endsWith('.pdf') ? (
                              <FaFilePdf className="w-6 h-6 text-orange-600" />
                            ) : (
                              <FaFile className="w-6 h-6 text-orange-500" />
                            )}
                            <span className="flex-1 text-sm text-orange-700">{post.fileName || 'קובץ מצורף'}</span>
                            <FaDownload className="w-4 h-4 text-orange-400" />
                          </button>
                        )}
                        
                        {/* Link Display */}
                        {post.linkUrl && (
                          <a
                            href={post.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-3 border border-blue-100 hover:bg-blue-100 transition"
                          >
                            <FaLink className="w-5 h-5 text-blue-500" />
                            <span className="flex-1 text-sm text-blue-700 truncate">{post.linkUrl}</span>
                            <FaExternalLinkAlt className="w-4 h-4 text-blue-400" />
                          </a>
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
                                  {comment.user?.profileImage ? (
                                    <img 
                                      src={`http://localhost:4000${comment.user.profileImage}`} 
                                      alt={comment.user.name}
                                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 flex-shrink-0">
                                      {comment.user?.name?.charAt(0) || '?'}
                                    </div>
                                  )}
                                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm text-black">
                                        {comment.user?.name || 'משתמש'}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(comment.createdAt).toLocaleDateString('he-IL')}
                                      </span>
                                    </div>
                                    {editingCommentId === comment.id ? (
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
                                        className="w-full px-2 py-1 border border-blue-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                      />
                                    ) : (
                                      <p className="text-sm text-gray-700 text-right">{comment.content}</p>
                                    )}
                                  </div>
                                  {userId === comment.user?.id && (
                                    <div className="flex flex-col gap-1" dir="ltr">
                                      {editingCommentId === comment.id ? (
                                        <>
                                          <button
                                            onClick={() => handleEditComment(comment.id, post.id)}
                                            className="text-gray-400 hover:text-green-500 p-1"
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
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); }}
                                            className="text-gray-400 hover:text-blue-500 p-1"
                                            title="ערוך"
                                          >
                                            <FaEdit className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteComment(comment.id, post.id)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                            title="מחק"
                                          >
                                            <FaTrash className="w-3 h-3" />
                                          </button>
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
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newCommentContent[post.id]?.trim()}
                              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                              שלח
                            </button>
                            <input
                              type="text"
                              value={newCommentContent[post.id] || ''}
                              onChange={(e) =>
                                setNewCommentContent((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newCommentContent[post.id]?.trim()) {
                                  handleAddComment(post.id);
                                }
                              }}
                              placeholder="כתבו תגובה..."
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            {userProfile?.profileImage ? (
                              <img 
                                src={`http://localhost:4000${userProfile.profileImage}`}
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

          {/* RIGHT: Gray background info cards */}
          <div className="space-y-4 order-3 lg:order-3">
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
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>לדבר בנימוס, בלי שיימינג או פרסום אגרסיבי.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>לפרסם מתכונים עם כמויות, שלבים ותמונה.</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>לענות לשאלות חדשים ולתייג נושאים רלוונטיים.</span>
                </li>
              </ul>
            </div>

            {/* אירועים קרובים */}
            <div className="bg-[#F7F8FA] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="font-semibold text-black">אירועים קרובים</h3>
              </div>
              <p className="text-gray-500 text-sm text-center py-2">אין אירועים קרובים</p>
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
                    const rankColors = ['bg-pink-400', 'bg-green-500', 'bg-yellow-400'];
                    return (
                      <div key={member.userId} className="flex items-center gap-3">
                        {/* Rank badge */}
                        <div className={`w-6 h-6 ${rankColors[member.rank - 1] || 'bg-gray-400'} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {member.rank}
                        </div>
                        {/* Profile picture */}
                        {member.profileImage ? (
                          <img
                            src={`http://localhost:4000${member.profileImage}`}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                            {member.name?.charAt(0) || '?'}
                          </div>
                        )}
                        {/* Name */}
                        <span className="font-medium text-black flex-1">{member.name}</span>
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
      </section>
      )}
    </main>
  );
}
