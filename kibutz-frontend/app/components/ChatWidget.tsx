'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSocketContext, SocketMessage } from '../lib/SocketContext';

interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    profileImage: string | null;
  };
}

interface Conversation {
  id: string;
  participant1: { id: string; name: string; profileImage: string | null };
  participant2: { id: string; name: string; profileImage: string | null };
  lastMessageAt: string;
  lastMessageText: string | null;
  unreadCount?: number;
}

interface OpenChat {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  recipientImage: string | null;
  messages: Message[];
  isMinimized: boolean;
  isLoading: boolean;
}

export default function ChatWidget() {
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const conversationsRef = useRef<HTMLDivElement>(null);
  
  const { onNewMessage } = useSocketContext();

  // Check auth status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setAuthChecked(true);
        setCurrentUserId(null);
        return;
      }
      setIsLoggedIn(true);
      setAuthChecked(true);

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub);
      } catch {
        console.error('Failed to decode token');
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingConversations(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Listen for toggle event from MessagesBell
  useEffect(() => {
    const handleToggle = () => {
      setShowConversations(prev => {
        if (!prev) {
          fetchConversations();
        }
        return !prev;
      });
    };

    window.addEventListener('toggleChatWidget', handleToggle);
    return () => window.removeEventListener('toggleChatWidget', handleToggle);
  }, [fetchConversations]);

  // Close conversations dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (conversationsRef.current && !conversationsRef.current.contains(event.target as Node)) {
        setShowConversations(false);
      }
    };

    if (showConversations) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showConversations]);

  // Listen for new messages
  useEffect(() => {
    onNewMessage((socketMessage: SocketMessage) => {
      setOpenChats(prev => prev.map(chat => {
        if (chat.conversationId === socketMessage.conversationId) {
          const message: Message = {
            ...socketMessage,
            sender: {
              ...socketMessage.sender,
              profileImage: socketMessage.sender.profileImage || null,
            },
          };
          return { ...chat, messages: [...chat.messages, message] };
        }
        return chat;
      }));
    });
  }, [onNewMessage]);

  const openChat = useCallback(async (conv: Conversation) => {
    if (!currentUserId) return;
    
    const other = conv.participant1.id === currentUserId ? conv.participant2 : conv.participant1;
    
    // Check if already open
    const existingChat = openChats.find(c => c.conversationId === conv.id);
    if (existingChat) {
      setOpenChats(prev => prev.map(c => 
        c.conversationId === conv.id ? { ...c, isMinimized: false } : c
      ));
      return;
    }

    // Add new chat window
    const newChat: OpenChat = {
      conversationId: conv.id,
      recipientId: other.id,
      recipientName: other.name,
      recipientImage: other.profileImage,
      messages: [],
      isMinimized: false,
      isLoading: true,
    };

    setOpenChats(prev => [...prev.slice(-2), newChat]); // Max 3 chats

    // Fetch messages
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations/${conv.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOpenChats(prev => prev.map(c => 
          c.conversationId === conv.id 
            ? { ...c, messages: data.messages || [], isLoading: false }
            : c
        ));

        // Mark as read
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations/${conv.id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [currentUserId, openChats]);

  // Listen for openChat events from ChatBell
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<Conversation>) => {
      openChat(event.detail);
    };

    window.addEventListener('openChat', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('openChat', handleOpenChat as EventListener);
    };
  }, [openChat]);

  // Open chat with a user directly (called from profile)
  const startChatWithUser = useCallback(async (userId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const conv = await res.json();
        const fakeConv: Conversation = {
          id: conv.id,
          participant1: conv.participant1,
          participant2: conv.participant2,
          lastMessageAt: conv.lastMessageAt || new Date().toISOString(),
          lastMessageText: null,
        };
        openChat(fakeConv);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  }, [openChat]);

  // Expose startChatWithUser globally
  useEffect(() => {
    (window as any).openChatWithUser = startChatWithUser;
    return () => {
      delete (window as any).openChatWithUser;
    };
  }, [startChatWithUser]);

  const closeChat = (conversationId: string) => {
    setOpenChats(prev => prev.filter(c => c.conversationId !== conversationId));
  };

  const toggleMinimize = (conversationId: string) => {
    setOpenChats(prev => prev.map(c => 
      c.conversationId === conversationId ? { ...c, isMinimized: !c.isMinimized } : c
    ));
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participant1.id === currentUserId ? conv.participant2 : conv.participant1;
  };

  const handleConversationClick = (conv: Conversation) => {
    openChat(conv);
    setShowConversations(false);
  };

  if (!authChecked || !isLoggedIn) return null;

  return (
    <>
      {/* Conversations Dropdown - positioned at top right of page */}
      {showConversations && (
        <div 
          ref={conversationsRef}
          className="fixed top-16 left-8 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          dir="rtl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">הודעות</h3>
            <button 
              onClick={() => setShowConversations(false)}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M22 17C22 17.5304 21.7893 18.0391 21.4142 18.4142C21.0391 18.7893 20.5304 19 20 19H6.828C6.29761 19.0001 5.78899 19.2109 5.414 19.586L3.212 21.788C3.1127 21.8873 2.9862 21.9549 2.84849 21.9823C2.71077 22.0097 2.56803 21.9956 2.43831 21.9419C2.30858 21.8881 2.1977 21.7971 2.11969 21.6804C2.04167 21.5637 2.00002 21.4264 2 21.286V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H20C20.5304 3 21.0391 3.21071 21.4142 3.58579C21.7893 3.96086 22 4.46957 22 5V17Z" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm">אין הודעות עדיין</p>
              </div>
            ) : (
              conversations.map(conv => {
                const other = getOtherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleConversationClick(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer text-right ${
                      (conv.unreadCount || 0) > 0 ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {other.profileImage ? (
                        <Image
                          src={other.profileImage.startsWith('http') ? other.profileImage : `${process.env.NEXT_PUBLIC_API_URL}${other.profileImage}`}
                          alt={other.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {other.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${(conv.unreadCount || 0) > 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {other.name}
                      </p>
                      {conv.lastMessageText && (
                        <p className="text-xs text-gray-500 truncate">
                          {conv.lastMessageText}
                        </p>
                      )}
                    </div>
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="bg-[#1a3a4a] text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chat windows at bottom */}
      <div className="fixed bottom-0 right-24 flex flex-row-reverse items-end gap-2 z-40">
      {openChats.map((chat) => (
        chat.isMinimized ? (
          <div
            key={chat.conversationId}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-t-lg shadow-lg"
          >
            <button
              onClick={() => toggleMinimize(chat.conversationId)}
              className="flex items-center gap-1.5 hover:opacity-70 transition"
              title={chat.recipientName}
            >
              {chat.recipientImage ? (
                <Image
                  src={chat.recipientImage.startsWith('http') ? chat.recipientImage : `${process.env.NEXT_PUBLIC_API_URL}${chat.recipientImage}`}
                  alt={chat.recipientName}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {chat.recipientName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{chat.recipientName}</span>
            </button>
            <button
              onClick={() => closeChat(chat.conversationId)}
              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition"
              title="סגור"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <ChatWindow
            key={chat.conversationId}
            chat={chat}
            currentUserId={currentUserId}
            onClose={() => closeChat(chat.conversationId)}
            onMinimize={() => toggleMinimize(chat.conversationId)}
            onNewMessage={(msg) => {
              setOpenChats(prev => prev.map(c => 
                c.conversationId === chat.conversationId 
                  ? { ...c, messages: [...c.messages, msg] }
                  : c
              ));
            }}
          />
        )
      ))}
    </div>
    </>
  );
}

// Individual Chat Window Component
function ChatWindow({ 
  chat, 
  currentUserId, 
  onClose, 
  onMinimize,
  onNewMessage 
}: { 
  chat: OpenChat; 
  currentUserId: string | null;
  onClose: () => void;
  onMinimize: () => void;
  onNewMessage: (msg: Message) => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: chat.recipientId,
          content: message.trim(),
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        onNewMessage(newMsg);
        setMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-80 max-h-[350px] bg-white rounded-t-xl shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          {chat.recipientImage ? (
            <Image
              src={chat.recipientImage.startsWith('http') ? chat.recipientImage : `${process.env.NEXT_PUBLIC_API_URL}${chat.recipientImage}`}
              alt={chat.recipientName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {chat.recipientName.charAt(0)}
            </div>
          )}
          <span className="font-medium text-gray-900">{chat.recipientName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div dir="ltr" className="flex-1 max-h-[250px] overflow-y-auto p-3 bg-gray-50">
        <div dir="rtl" className="space-y-3">
        {chat.isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3B82F6]"></div>
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            התחל שיחה חדשה
          </div>
        ) : (
          chat.messages.map(msg => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex mb-3 ${isOwn ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwn 
                    ? 'bg-[#3B82F6] text-white rounded-bl-sm' 
                    : 'bg-white text-gray-900 rounded-br-sm shadow-sm border border-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1.5 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex-shrink-0 border-t border-gray-200 p-2 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="הקלד הודעה..."
          className="flex-1 border border-gray-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="w-8 h-8 bg-[#3B82F6] text-white rounded-full flex items-center justify-center hover:bg-[#2563EB] transition-colors disabled:opacity-50"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

// Messages Bell Component - for chat messages icon in navbar
export function MessagesBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch unread message count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('toggleChatWidget'));
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-500 hover:text-gray-700 transition"
      aria-label="הודעות"
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M22 17C22 17.5304 21.7893 18.0391 21.4142 18.4142C21.0391 18.7893 20.5304 19 20 19H6.828C6.29761 19.0001 5.78899 19.2109 5.414 19.586L3.212 21.788C3.1127 21.8873 2.9862 21.9549 2.84849 21.9823C2.71077 22.0097 2.56803 21.9956 2.43831 21.9419C2.30858 21.8881 2.1977 21.7971 2.11969 21.6804C2.04167 21.5637 2.00002 21.4264 2 21.286V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H20C20.5304 3 21.0391 3.21071 21.4142 3.58579C21.7893 3.96086 22 4.46957 22 5V17Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-[#1a3a4a] text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
