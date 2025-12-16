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
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  
  const { onNewMessage, setUnreadMessageCount } = useSocketContext();

  // Check auth status - run on mount and listen for storage changes
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

    // Initial check
    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', checkAuth);

    // Poll for token changes (same tab login)
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  // Listen for new messages
  useEffect(() => {
    onNewMessage((socketMessage: SocketMessage) => {
      // Update open chat if exists
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

      // Update conversations list
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === socketMessage.conversationId) {
            return {
              ...conv,
              lastMessageText: socketMessage.content,
              lastMessageAt: socketMessage.createdAt,
              unreadCount: (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
    });
  }, [onNewMessage]);

  // Fetch initial unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:4000/messages/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTotalUnread(data.unreadCount || 0);
          setUnreadMessageCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    if (isLoggedIn) {
      fetchUnreadCount();
    }
  }, [isLoggedIn, setUnreadMessageCount]);

  // Update totalUnread when new messages arrive
  useEffect(() => {
    const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    setTotalUnread(total);
  }, [conversations]);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        
        // Calculate total unread
        const unread = data.reduce((sum: number, c: Conversation) => sum + (c.unreadCount || 0), 0);
        setTotalUnread(unread);
        setUnreadMessageCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (conv: Conversation) => {
    const other = conv.participant1.id === currentUserId ? conv.participant2 : conv.participant1;
    
    // Check if already open
    if (openChats.find(c => c.conversationId === conv.id)) {
      setOpenChats(prev => prev.map(c => 
        c.conversationId === conv.id ? { ...c, isMinimized: false } : c
      ));
      setIsOpen(false);
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
    setIsOpen(false);

    // Fetch messages
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/messages/conversations/${conv.id}/messages`, {
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
        await fetch(`http://localhost:4000/messages/conversations/${conv.id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        // Update unread count
        setConversations(prev => prev.map(c => 
          c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Open chat with a user directly (called from profile)
  const startChatWithUser = useCallback(async (userId: string, userName: string, userImage: string | null) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/messages/conversations/${userId}`, {
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
  }, [currentUserId]);

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

  if (!authChecked || !isLoggedIn) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchConversations();
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#3B82F6] text-white rounded-full shadow-lg hover:bg-[#2563EB] transition-all z-50 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {/* Unread Badge */}
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Conversations Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-[#3B82F6] text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold">הודעות</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3B82F6]"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>אין הודעות עדיין</p>
              </div>
            ) : (
              conversations.map(conv => {
                const other = getOtherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => openChat(conv)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-right"
                  >
                    <div className="relative flex-shrink-0">
                      {other.profileImage ? (
                        <Image
                          src={other.profileImage.startsWith('http') ? other.profileImage : `http://localhost:4000${other.profileImage}`}
                          alt={other.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold">
                          {other.name.charAt(0)}
                        </div>
                      )}
                      {(conv.unreadCount || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{other.name}</p>
                      <p className="text-sm text-gray-500 truncate">{conv.lastMessageText || 'לחץ לשיחה'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Open Chat Windows */}
      <div className="fixed bottom-0 right-24 flex gap-2 z-40">
        {openChats.map((chat, index) => (
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
      const res = await fetch('http://localhost:4000/messages/send', {
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

  if (chat.isMinimized) {
    return (
      <button
        onClick={onMinimize}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-t-lg px-3 py-2 shadow-lg hover:bg-gray-50"
      >
        {chat.recipientImage ? (
          <Image
            src={chat.recipientImage.startsWith('http') ? chat.recipientImage : `http://localhost:4000${chat.recipientImage}`}
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
        <span className="text-sm font-medium">{chat.recipientName}</span>
      </button>
    );
  }

  return (
    <div className="w-80 bg-white rounded-t-xl shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          {chat.recipientImage ? (
            <Image
              src={chat.recipientImage.startsWith('http') ? chat.recipientImage : `http://localhost:4000${chat.recipientImage}`}
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
      <div className="flex-1 h-72 overflow-y-auto p-3 space-y-2 bg-gray-50">
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
              <div key={msg.id} className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isOwn 
                    ? 'bg-[#3B82F6] text-white rounded-br-sm' 
                    : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-2 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="הקלד הודעה..."
          className="flex-1 border border-gray-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-[#3B82F6]"
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
