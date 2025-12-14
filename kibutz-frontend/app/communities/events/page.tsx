'use client';

import { Suspense, useEffect, useState, forwardRef, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import DatePicker, { registerLocale } from 'react-datepicker';
import { he } from 'date-fns/locale';
import { getMonth, getYear } from 'date-fns';
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaChevronRight, 
  FaChevronLeft,
  FaMapMarkerAlt,
  FaVideo,
  FaClock,
  FaUsers,
  FaCheck,
  FaQuestion,
  FaTimes,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaPen,
  FaTrashAlt,
  FaEllipsisV,
  FaChevronDown
} from 'react-icons/fa';

// Short Hebrew day names for calendar - return single letter based on day name
const formatWeekDay = (nameOfDay: string) => {
  // Map by first letter or known patterns
  const name = nameOfDay.toLowerCase();
  if (name.startsWith('su') || name.includes('ראשון')) return "א'";
  if (name.startsWith('mo') || name.includes('שני')) return "ב'";
  if (name.startsWith('tu') || name.includes('שלישי')) return "ג'";
  if (name.startsWith('we') || name.includes('רביעי')) return "ד'";
  if (name.startsWith('th') || name.includes('חמישי')) return "ה'";
  if (name.startsWith('fr') || name.includes('שישי')) return "ו'";
  if (name.startsWith('sa') || name.includes('שבת')) return "ש'";
  return "א'";
};

// Hebrew month names
const hebrewMonths = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

// Years range
const years = Array.from({ length: 20 }, (_, i) => getYear(new Date()) - 5 + i);

// Generate time options with 15-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

// Validate if a date is real (e.g., Feb 30 is invalid)
const isValidDate = (day: number, month: number, year: number): boolean => {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
};

// Get current time rounded to nearest 15 minutes
const getCurrentTimeRounded = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  
  if (minutes === 60) {
    return `${(hours + 1).toString().padStart(2, '0')}:00`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Custom Date Input Component - simple text input with formatting
function DateInput({
  value,
  onChange,
  onIconClick,
}: {
  value: string;
  onChange: (dateISO: string, formatted: string) => void;
  onIconClick: () => void;
}) {
  const [inputValue, setInputValue] = useState('');

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString();
        setInputValue(`${day}/${month}/${year}`);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Remove non-digits except slashes
    let digitsOnly = val.replace(/[^\d]/g, '');
    
    // Validate as we type
    if (digitsOnly.length >= 1) {
      const firstDigit = parseInt(digitsOnly[0]);
      if (firstDigit > 3) digitsOnly = '0' + digitsOnly; // Auto-prefix day
    }
    if (digitsOnly.length >= 2) {
      const day = parseInt(digitsOnly.slice(0, 2));
      if (day > 31) digitsOnly = '31' + digitsOnly.slice(2);
      if (day === 0) digitsOnly = '01' + digitsOnly.slice(2);
    }
    if (digitsOnly.length >= 3) {
      const thirdDigit = parseInt(digitsOnly[2]);
      if (thirdDigit > 1) digitsOnly = digitsOnly.slice(0, 2) + '0' + digitsOnly.slice(2); // Auto-prefix month
    }
    if (digitsOnly.length >= 4) {
      const month = parseInt(digitsOnly.slice(2, 4));
      if (month > 12) digitsOnly = digitsOnly.slice(0, 2) + '12' + digitsOnly.slice(4);
      if (month === 0) digitsOnly = digitsOnly.slice(0, 2) + '01' + digitsOnly.slice(4);
    }
    if (digitsOnly.length >= 5) {
      const yearStart = parseInt(digitsOnly[4]);
      if (yearStart !== 2) digitsOnly = digitsOnly.slice(0, 4) + '2' + digitsOnly.slice(5);
    }
    
    // Format as dd/mm/yyyy
    let formatted = '';
    for (let i = 0; i < digitsOnly.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digitsOnly[i];
    }
    
    setInputValue(formatted);
    
    // Parse and validate when complete
    if (digitsOnly.length === 8) {
      const day = parseInt(digitsOnly.slice(0, 2));
      const month = parseInt(digitsOnly.slice(2, 4));
      const year = parseInt(digitsOnly.slice(4, 8));
      const currentYear = new Date().getFullYear();
      
      if (isValidDate(day, month, year) && year >= currentYear - 5 && year <= currentYear + 14) {
        const isoDate = `${year}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(0, 2)}`;
        onChange(isoDate, formatted);
      } else {
        onChange('', '');
      }
    } else {
      onChange('', '');
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="dd/mm/yyyy"
        maxLength={10}
        className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black bg-white text-right"
        dir="ltr"
      />
      <FaCalendarAlt
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
        onClick={onIconClick}
      />
    </div>
  );
}

// Custom Time Picker Component - simple text input with dropdown
function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (time: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      setInputValue(value);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Scroll to current time when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const currentTime = value || getCurrentTimeRounded();
      const index = timeOptions.findIndex((t) => t >= currentTime);
      if (index > 0) {
        const scrollPosition = Math.max(0, (index - 2) * 40);
        dropdownRef.current.scrollTop = scrollPosition;
      }
    }
  }, [isOpen, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Remove non-digits except colon
    let digitsOnly = val.replace(/[^\d]/g, '');

    // Validate as we type
    if (digitsOnly.length >= 1) {
      const firstDigit = parseInt(digitsOnly[0]);
      if (firstDigit > 2) digitsOnly = '0' + digitsOnly; // Auto-prefix hour
    }
    if (digitsOnly.length >= 2) {
      const hours = parseInt(digitsOnly.slice(0, 2));
      if (hours > 23) digitsOnly = '23' + digitsOnly.slice(2);
    }
    if (digitsOnly.length >= 3) {
      const thirdDigit = parseInt(digitsOnly[2]);
      if (thirdDigit > 5) digitsOnly = digitsOnly.slice(0, 2) + '0' + digitsOnly.slice(2); // Auto-prefix minute
    }
    if (digitsOnly.length >= 4) {
      const minutes = parseInt(digitsOnly.slice(2, 4));
      if (minutes > 59) digitsOnly = digitsOnly.slice(0, 2) + '59';
    }

    // Limit to 4 digits
    digitsOnly = digitsOnly.slice(0, 4);

    // Format as HH:MM
    let formatted = '';
    for (let i = 0; i < digitsOnly.length; i++) {
      if (i === 2) formatted += ':';
      formatted += digitsOnly[i];
    }

    setInputValue(formatted);

    // Parse and validate when complete
    if (digitsOnly.length === 4) {
      const hours = parseInt(digitsOnly.slice(0, 2));
      const minutes = parseInt(digitsOnly.slice(2, 4));

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        onChange(formatted);
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="hh:mm"
        maxLength={5}
        className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black bg-white text-right"
        dir="ltr"
      />
      <FaClock
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {timeOptions.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  onChange(time);
                  setInputValue(time);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-right hover:bg-gray-100 transition ${
                  value === time ? 'bg-black text-white hover:bg-black' : 'text-black'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface JwtPayload {
  sub: string;
  email: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  date: string;
  endDate?: string;
  duration?: number;
  timezone?: string;
  isRecurring?: boolean;
  recurringType?: string;
  locationType?: string;
  locationName?: string;
  locationUrl?: string;
  category?: string;
  capacity?: number;
  attendeeType?: string;
  sendReminders?: boolean;
  reminderDays?: number;
  communityId: string;
  createdAt: string;
  userRsvp?: 'GOING' | 'MAYBE' | 'NOT_GOING' | null;
  rsvpCounts?: {
    going: number;
    maybe: number;
    notGoing: number;
  };
  _count?: {
    rsvps: number;
  };
}

interface Community {
  id: string;
  name: string;
  image?: string;
  logo?: string;
}

const EVENT_CATEGORIES = [
  { value: 'workshop', label: 'סדנה', color: 'bg-purple-100 text-purple-700' },
  { value: 'meetup', label: 'מפגש', color: 'bg-blue-100 text-blue-700' },
  { value: 'webinar', label: 'וובינר', color: 'bg-green-100 text-green-700' },
  { value: 'qa', label: 'שאלות ותשובות', color: 'bg-orange-100 text-orange-700' },
  { value: 'social', label: 'חברתי', color: 'bg-pink-100 text-pink-700' },
  { value: 'other', label: 'אחר', color: 'bg-gray-100 text-gray-700' },
];

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const HEBREW_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function EventsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const communityId = searchParams.get('communityId');

  const [events, setEvents] = useState<Event[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; profileImage?: string | null } | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserId(decoded.sub);
        setUserEmail(decoded.email);
        
        // Fetch user profile
        fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setUserProfile({ name: data.name, profileImage: data.profileImage });
          });
          
        // Fetch communities user is member of
        fetch('http://localhost:4000/communities/user/memberships', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : [])
          .then(data => {
            setCommunities(data);
            setUserMemberships(data.map((c: Community) => c.id));
          });
      } catch (e) {
        console.error('Invalid token:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!communityId) return;

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
        // Fetch community
        const communityRes = await fetch(`http://localhost:4000/communities/${communityId}`);
        if (communityRes.ok) {
          const communityData = await communityRes.json();
          setCommunity(communityData);
        }

        // Check membership
        if (token) {
          const membershipRes = await fetch(`http://localhost:4000/communities/${communityId}/membership`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (membershipRes.ok) {
            const membershipData = await membershipRes.json();
            const isManagerOrOwner = membershipData.role === 'OWNER' || membershipData.role === 'MANAGER';
            setIsManager(isManagerOrOwner);
          }
        }

        // Fetch events for current month
        await fetchEventsForMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityId]);

  const fetchEventsForMonth = async (year: number, month: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `http://localhost:4000/events/community/${communityId}/calendar?year=${year}&month=${month}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    fetchEventsForMonth(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month);
    setCurrentDate(newDate);
    setShowMonthDropdown(false);
    fetchEventsForMonth(newDate.getFullYear(), month + 1);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setShowYearDropdown(false);
    fetchEventsForMonth(year, newDate.getMonth() + 1);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setDeleteEventId(null);
      } else {
        alert('שגיאה במחיקת האירוע');
      }
    } catch (err) {
      console.error('Delete event error:', err);
      alert('שגיאה במחיקת האירוע');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleRsvp = async (eventId: string, status: 'GOING' | 'MAYBE' | 'NOT_GOING') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו כדי לאשר הגעה');
      return;
    }

    const event = events.find(e => e.id === eventId);
    const previousRsvp = event?.userRsvp;
    const previousCounts = event?.rsvpCounts || { going: 0, maybe: 0, notGoing: 0 };
    
    // Optimistic update - update UI immediately
    const isRemoving = event?.userRsvp === status;
    
    // Calculate optimistic counts
    const optimisticCounts = { ...previousCounts };
    if (previousRsvp) {
      // Decrement previous status count
      if (previousRsvp === 'GOING') optimisticCounts.going = Math.max(0, optimisticCounts.going - 1);
      if (previousRsvp === 'MAYBE') optimisticCounts.maybe = Math.max(0, optimisticCounts.maybe - 1);
      if (previousRsvp === 'NOT_GOING') optimisticCounts.notGoing = Math.max(0, optimisticCounts.notGoing - 1);
    }
    if (!isRemoving) {
      // Increment new status count
      if (status === 'GOING') optimisticCounts.going++;
      if (status === 'MAYBE') optimisticCounts.maybe++;
      if (status === 'NOT_GOING') optimisticCounts.notGoing++;
    }
    
    // Update UI immediately
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, userRsvp: isRemoving ? null : status, rsvpCounts: optimisticCounts } 
        : e
    ));

    try {
      // If clicking same status, remove RSVP
      if (isRemoving) {
        const res = await fetch(`http://localhost:4000/events/${eventId}/rsvp`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Update with server-confirmed counts
          setEvents(prev => prev.map(e => 
            e.id === eventId ? { ...e, rsvpCounts: data.rsvpCounts } : e
          ));
        } else {
          // Revert on error
          setEvents(prev => prev.map(e => 
            e.id === eventId ? { ...e, userRsvp: previousRsvp, rsvpCounts: previousCounts } : e
          ));
        }
      } else {
        const res = await fetch(`http://localhost:4000/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          const data = await res.json();
          // Update with server-confirmed counts
          setEvents(prev => prev.map(e => 
            e.id === eventId ? { ...e, rsvpCounts: data.rsvpCounts } : e
          ));
        } else {
          // Revert on error
          setEvents(prev => prev.map(e => 
            e.id === eventId ? { ...e, userRsvp: previousRsvp, rsvpCounts: previousCounts } : e
          ));
        }
      }
    } catch (err) {
      console.error('RSVP error:', err);
      // Revert on error
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, userRsvp: previousRsvp, rsvpCounts: previousCounts } : e
      ));
    }
  };

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short'
    });
  };

  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // Helper to get event style based on RSVP status
    const getEventStyle = (event: Event) => {
      if (!event.userRsvp) {
        // No response - white background with border
        return 'bg-white text-gray-800 border border-gray-300';
      }
      if (event.userRsvp === 'GOING') {
        // Going - black fill
        return 'bg-black text-white';
      }
      if (event.userRsvp === 'MAYBE') {
        // Maybe - diagonal stripes pattern
        return 'text-gray-700 border border-gray-300 maybe-striped';
      }
      if (event.userRsvp === 'NOT_GOING') {
        // Not going - line through
        return 'bg-gray-100 text-gray-400 line-through border border-gray-200';
      }
      return 'bg-white text-gray-800 border border-gray-300';
    };
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day, 12, 0, 0); // Set to noon to avoid timezone issues
      // Show all events in calendar view (including declined ones with visual indicator)
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          onDoubleClick={() => {
            if (isManager) {
              // Create date at noon to avoid timezone issues
              const eventDate = new Date(year, month, day, 12, 0, 0);
              setAddEventDate(eventDate);
              setShowAddModal(true);
            }
          }}
          className={`h-24 p-1 cursor-pointer transition hover:bg-gray-50 ${
            isToday ? 'bg-blue-50' : ''
          } ${isSelected ? 'border-2 border-black' : 'border border-gray-100'}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${getEventStyle(event)}`}
              >
                {formatTime(event.date)} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayEvents.length - 2} נוספים
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  // Show all events in calendar view sidebar (including declined with visual indicator)
  const selectedDateEvents = selectedDate 
    ? getEventsForDate(selectedDate)
    : [];

  if (!communityId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">לא נבחרה קהילה</p>
      </div>
    );
  }

  // No loading spinner - content renders immediately like other pages

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        {/* Right side of screen (RTL first): Kibutz Logo + Community name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-black hover:opacity-75 transition">
            Kibutz
          </Link>
          <div className="flex items-center gap-2">
            {community?.logo ? (
              <img
                src={`http://localhost:4000${community.logo}`}
                alt={community?.name || ''}
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
            { label: 'עמוד בית', href: `/communities/feed?communityId=${communityId}`, active: false },
            { label: 'קורס', href: '#' },
            { label: 'חברי קהילה', href: `/communities/${communityId}/members` },
            { label: 'יומן אירועים', href: `/communities/events?communityId=${communityId}`, active: true },
            { label: 'לוח תוצאות', href: `/communities/${communityId}/leaderboard` },
            { label: 'אודות', href: `/communities/${communityId}/about` },
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

        {/* Left side of screen (RTL last): User Avatar */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                viewMode === 'calendar' ? 'bg-white shadow text-black' : 'text-gray-600'
              }`}
            >
              לוח שנה
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                viewMode === 'list' ? 'bg-white shadow text-black' : 'text-gray-600'
              }`}
            >
              רשימה
            </button>
          </div>

          {isManager && (
            <button
              onClick={() => {
                setAddEventDate(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              <span>הוסף אירוע</span>
              <FaPlus className="w-4 h-4" />
            </button>
          )}
          
          {/* User Avatar with Dropdown */}
          {userId && (
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
                    {userProfile?.name?.charAt(0) || userEmail?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </button>
              
              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Month Navigation */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                {/* Right arrow (next month - RTL) */}
                <button
                  onClick={() => handleMonthChange('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>

                {/* Center: Month, Year, Today button */}
                <div className="flex items-center gap-3">
                  {/* Month Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowMonthDropdown(!showMonthDropdown);
                        setShowYearDropdown(false);
                      }}
                      className="flex items-center gap-1 text-lg font-bold text-black hover:bg-gray-100 px-2 py-1 rounded-lg transition"
                    >
                      {HEBREW_MONTHS[currentDate.getMonth()]}
                      <FaChevronDown className="w-3 h-3" />
                    </button>
                    {showMonthDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMonthDropdown(false)} />
                        <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
                          {HEBREW_MONTHS.map((month, index) => (
                            <button
                              key={month}
                              onClick={() => handleMonthSelect(index)}
                              className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-100 ${
                                currentDate.getMonth() === index ? 'bg-gray-100 font-medium' : ''
                              }`}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Year Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowYearDropdown(!showYearDropdown);
                        setShowMonthDropdown(false);
                      }}
                      className="flex items-center gap-1 text-lg font-bold text-black hover:bg-gray-100 px-2 py-1 rounded-lg transition"
                    >
                      {currentDate.getFullYear()}
                      <FaChevronDown className="w-3 h-3" />
                    </button>
                    {showYearDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowYearDropdown(false)} />
                        <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
                          {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                            <button
                              key={year}
                              onClick={() => handleYearSelect(year)}
                              className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-100 ${
                                currentDate.getFullYear() === year ? 'bg-gray-100 font-medium' : ''
                              }`}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Today Button */}
                  <button
                    onClick={() => {
                      const today = new Date();
                      setCurrentDate(today);
                      setSelectedDate(today);
                      fetchEventsForMonth(today.getFullYear(), today.getMonth() + 1);
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                  >
                    היום
                  </button>
                </div>
                
                {/* Left arrow (prev month - RTL) */}
                <button
                  onClick={() => handleMonthChange('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {HEBREW_DAYS.map(day => (
                  <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {renderCalendar()}
              </div>
            </div>

            {/* Selected Date Events */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 h-fit max-h-[calc(100vh-200px)] flex flex-col">
              <h3 className="font-bold text-black mb-4 flex-shrink-0">
                {selectedDate 
                  ? formatDate(selectedDate.toISOString())
                  : 'בחרו תאריך'
                }
              </h3>
              
              {selectedDate ? (
                selectedDateEvents.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto flex-1" dir="ltr">
                    <div dir="rtl" className="space-y-3">
                      {selectedDateEvents.map(event => (
                        <EventCard 
                          key={event.id} 
                          event={event} 
                          onRsvp={handleRsvp}
                          onEdit={handleEditEvent}
                          onDelete={(id) => setDeleteEventId(id)}
                          rsvpLoading={rsvpLoading}
                          isManager={isManager}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">אין אירועים בתאריך זה</p>
                )
              ) : (
                <p className="text-gray-500 text-center py-8">לחצו על תאריך בלוח השנה</p>
              )}
            </div>
          </div>
        ) : (
          /* List View - filter out declined events */
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {events.filter(e => e.userRsvp !== 'NOT_GOING').length > 0 ? (
                events
                  .filter(e => e.userRsvp !== 'NOT_GOING')
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onRsvp={handleRsvp}
                      onEdit={handleEditEvent}
                      onDelete={(id) => setDeleteEventId(id)}
                      rsvpLoading={rsvpLoading}
                      isManager={isManager}
                    />
                  ))
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <FaCalendarAlt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">אין אירועים בחודש זה</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          communityId={communityId}
          initialDate={addEventDate}
          onClose={() => {
            setShowAddModal(false);
            setAddEventDate(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setAddEventDate(null);
            fetchEventsForMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
          }}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <EditEventModal
          event={editingEvent}
          communityId={communityId}
          onClose={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingEvent(null);
            fetchEventsForMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
          }}
        />
      )}

      {/* Delete Event Confirmation Modal */}
      {deleteEventId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
          onClick={() => setDeleteEventId(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center" dir="rtl">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FaTrashAlt className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">מחיקת אירוע</h3>
              <p className="text-gray-600 mb-6">האם אתם בטוחים שברצונכם למחוק את האירוע? פעולה זו לא ניתנת לביטול.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteEventId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  ביטול
                </button>
                <button
                  onClick={() => handleDeleteEvent(deleteEventId)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                >
                  מחיקה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventCard({ 
  event, 
  onRsvp, 
  onEdit,
  onDelete,
  rsvpLoading,
  isManager = false,
  compact = false 
}: { 
  event: Event; 
  onRsvp: (eventId: string, status: 'GOING' | 'MAYBE' | 'NOT_GOING') => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  rsvpLoading: string | null;
  isManager?: boolean;
  compact?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short'
    });
  };

  const getDateParts = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('he-IL', { month: 'short' }),
      weekday: date.toLocaleDateString('he-IL', { weekday: 'short' })
    };
  };

  const dateParts = getDateParts(event.date);
  const category = EVENT_CATEGORIES.find(c => c.value === event.category);
  const isLoading = rsvpLoading === event.id;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${compact ? '' : 'hover:shadow-md transition'} relative`}>
      {/* Manager Menu */}
      {isManager && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <FaEllipsisV className="w-3 h-3 text-gray-600" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]" dir="rtl">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit?.(event);
                  }}
                  className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FaPen className="w-3 h-3" />
                  ערוך
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete?.(event.id);
                  }}
                  className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FaTrashAlt className="w-3 h-3" />
                  מחק
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Cover Image */}
      {event.coverImage && !compact && (
        <div className="h-40 bg-gray-100">
          <img 
            src={`http://localhost:4000${event.coverImage}`}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={compact ? 'p-3' : 'p-4 flex gap-4'}>
        {/* Date Box - only show in non-compact mode */}
        {!compact && (
          <div className="flex-shrink-0 w-14 text-center">
            <div className="bg-black text-white rounded-t-lg py-1 px-2">
              <span className="text-xs font-medium uppercase">{dateParts.month}</span>
            </div>
            <div className="border-x border-b border-gray-200 rounded-b-lg py-2">
              <span className="text-2xl font-bold text-black">{dateParts.day}</span>
              <div className="text-xs text-gray-500">{dateParts.weekday}</div>
            </div>
          </div>
        )}

        <div className="flex-1">
          {/* Category & Time */}
          <div className="flex items-center gap-2 mb-2">
            {category && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}>
                {category.label}
              </span>
            )}
            <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <FaClock className="w-3 h-3" />
              {formatTime(event.date)}
            </span>
            {event.duration && (
              <span className="text-xs text-gray-500">
                ({event.duration >= 60 
                  ? event.duration === 60 
                    ? 'שעה' 
                    : `${Math.floor(event.duration / 60)}:${String(event.duration % 60).padStart(2, '0')} שעות`
                  : `${event.duration} דק׳`})
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className={`font-bold text-black ${compact ? 'text-sm' : 'text-lg'} mb-2`}>
            {event.title}
          </h4>

          {/* Description */}
          {event.description && !compact && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            {event.locationType === 'online' ? (
              <>
                <FaVideo className="w-4 h-4" />
                <span>{event.locationName || 'מפגש מקוון'}</span>
              </>
            ) : (
              <>
                <FaMapMarkerAlt className="w-4 h-4" />
                <span>{event.locationName || 'מפגש פיזי'}</span>
              </>
            )}
          </div>

          {/* Attendees Count */}
          {event.rsvpCounts && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <FaUsers className="w-4 h-4" />
              <span>{event.rsvpCounts.going} מגיעים</span>
              {event.rsvpCounts.maybe > 0 && (
                <span className="text-gray-400">· {event.rsvpCounts.maybe} אולי</span>
              )}
            </div>
          )}

          {/* RSVP Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onRsvp(event.id, 'GOING')}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                event.userRsvp === 'GOING'
                  ? 'bg-green-100 text-green-700 border-2 border-green-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <FaCheck className="w-3 h-3" />
              <span>מגיע/ה</span>
            </button>
            <button
              onClick={() => onRsvp(event.id, 'MAYBE')}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                event.userRsvp === 'MAYBE'
                  ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
              }`}
            >
              <FaQuestion className="w-3 h-3" />
              <span>אולי</span>
            </button>
            <button
              onClick={() => onRsvp(event.id, 'NOT_GOING')}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                event.userRsvp === 'NOT_GOING'
                  ? 'bg-red-100 text-red-700 border-2 border-red-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <FaTimes className="w-3 h-3" />
              <span>לא מגיע/ה</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Event Modal Component
function AddEventModal({
  communityId,
  initialDate,
  onClose,
  onSuccess,
}: {
  communityId: string;
  initialDate?: Date | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : '');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [timezone, setTimezone] = useState('Asia/Jerusalem');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('weekly');
  const [locationType, setLocationType] = useState('online');
  const [locationName, setLocationName] = useState('Zoom');
  const [locationUrl, setLocationUrl] = useState('');
  const [category, setCategory] = useState('');
  const [capacity, setCapacity] = useState('');
  const [sendReminders, setSendReminders] = useState(true);
  const [reminderDays, setReminderDays] = useState('1');
  const [attendeeType, setAttendeeType] = useState('all');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
      alert('אנא מלאו את כל השדות הנדרשים');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', new Date(`${date}T${time}`).toISOString());
      formData.append('duration', duration);
      formData.append('timezone', timezone);
      formData.append('isRecurring', String(isRecurring));
      if (isRecurring) formData.append('recurringType', recurringType);
      formData.append('locationType', locationType);
      formData.append('locationName', locationName);
      formData.append('locationUrl', locationUrl);
      if (category) formData.append('category', category);
      if (capacity) formData.append('capacity', capacity);
      formData.append('sendReminders', String(sendReminders));
      formData.append('reminderDays', reminderDays);
      formData.append('attendeeType', attendeeType);
      if (coverImage) formData.append('coverImage', coverImage);

      const res = await fetch(`http://localhost:4000/events/community/${communityId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.message || 'שגיאה ביצירת האירוע');
      }
    } catch (err) {
      console.error('Create event error:', err);
      alert('שגיאה ביצירת האירוע');
    } finally {
      setLoading(false);
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-black">הוסף אירוע</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" dir="ltr">
          <form onSubmit={handleSubmit} className="p-6 space-y-5" dir="rtl">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מפגש קהילה"
              maxLength={30}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
            />
            <div className="text-xs text-gray-400 text-left mt-1">{title.length} / 30</div>
          </div>

          {/* Date, Time, Duration Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך <span className="text-red-500">*</span></label>
              <DateInput 
                value={date} 
                onChange={(isoDate) => setDate(isoDate)}
                onIconClick={() => setShowDatePicker(true)}
              />
              {showDatePicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                  <div className="absolute top-full right-0 mt-1 z-50">
                    <DatePicker
                      selected={date ? new Date(date) : new Date()}
                      onChange={(d: Date | null) => {
                        setDate(d ? d.toISOString().split('T')[0] : '');
                        setShowDatePicker(false);
                      }}
                      inline
                      locale="he"
                      formatWeekDay={formatWeekDay}
                      renderCustomHeader={({
                        date: headerDate,
                        changeYear,
                        changeMonth,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }) => (
                        <div className="flex items-center justify-between px-4 py-3">
                          <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <FaChevronRight className="w-4 h-4" />
                          </button>
                          <div className="flex gap-3">
                            <select
                              value={getMonth(headerDate)}
                              onChange={({ target: { value } }) => changeMonth(Number(value))}
                              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-semibold bg-white cursor-pointer"
                            >
                              {hebrewMonths.map((month, i) => (
                                <option key={month} value={i}>{month}</option>
                              ))}
                            </select>
                            <select
                              value={getYear(headerDate)}
                              onChange={({ target: { value } }) => changeYear(Number(value))}
                              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-semibold bg-white cursor-pointer min-w-[5rem]"
                            >
                              {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <FaChevronLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעה <span className="text-red-500">*</span></label>
              <TimePicker value={time} onChange={setTime} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">משך</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              >
                <option value="30">30 דקות</option>
                <option value="60">שעה</option>
                <option value="90">שעה וחצי</option>
                <option value="120">שעתיים</option>
                <option value="180">3 שעות</option>
                <option value="240">4 שעות</option>
                <option value="300">5 שעות</option>
              </select>
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-black rounded"
            />
            <label htmlFor="recurring" className="text-sm text-gray-700">אירוע חוזר</label>
            {isRecurring && (
              <select
                value={recurringType}
                onChange={(e) => setRecurringType(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-black"
              >
                <option value="daily">יומי</option>
                <option value="weekly">שבועי</option>
                <option value="monthly">חודשי</option>
              </select>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מיקום</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setLocationType('online');
                  setLocationName('Zoom');
                  setLocationUrl('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  locationType === 'online' 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200'
                }`}
              >
                <FaVideo className="w-4 h-4" />
                <span className="text-sm text-black">מקוון</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationType('in-person');
                  setLocationName('');
                  setLocationUrl('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  locationType === 'in-person' 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200'
                }`}
              >
                <FaMapMarkerAlt className="w-4 h-4" />
                <span className="text-sm text-black">פיזי</span>
              </button>
            </div>
            {locationType === 'online' ? (
              <div className="flex gap-2">
                <select
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-40 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black flex-shrink-0"
                >
                  <option value="Zoom">Zoom</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                </select>
                <input
                  type="text"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder="קישור למפגש"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
            ) : (
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="כתובת או שם המקום"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="בואו להנות מחברה טובה."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-black"
            />
            <div className="text-xs text-gray-400 text-left mt-1">{description.length} / 300</div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תמונת כיסוי</label>
            <div 
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-400 transition text-center"
              onClick={() => document.getElementById('coverImageInput')?.click()}
            >
              {coverImagePreview ? (
                <img src={coverImagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
              ) : (
                <div className="text-gray-400">
                  <FaPlus className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">לחצו להעלאת תמונה</p>
                </div>
              )}
              <input
                id="coverImageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    category === cat.value 
                      ? cat.color + ' ring-2 ring-gray-400'
                      : cat.color + ' opacity-60 hover:opacity-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מי יכול להשתתף</label>
              <select
                value={attendeeType}
                onChange={(e) => setAttendeeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black"
              >
                <option value="all">כל החברים</option>
                <option value="managers">מנהלים בלבד</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מספר משתתפים מקסימלי</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="ללא הגבלה"
                min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black"
              />
            </div>
          </div>

          {/* Reminders */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reminders"
              checked={sendReminders}
              onChange={(e) => setSendReminders(e.target.checked)}
              className="w-4 h-4 text-black rounded"
            />
            <label htmlFor="reminders" className="text-sm text-gray-700">שלח תזכורת במייל</label>
            {sendReminders && (
              <select
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-black"
              >
                <option value="1">יום לפני</option>
                <option value="2">יומיים לפני</option>
                <option value="7">שבוע לפני</option>
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'יוצר...' : 'צור אירוע'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Event Modal Component
function EditEventModal({
  event,
  communityId,
  onClose,
  onSuccess,
}: {
  event: Event;
  communityId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const eventDate = new Date(event.date);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState(eventDate.toISOString().split('T')[0]);
  const [time, setTime] = useState(eventDate.toTimeString().slice(0, 5));
  const [duration, setDuration] = useState(String(event.duration || 60));
  const [timezone, setTimezone] = useState(event.timezone || 'Asia/Jerusalem');
  const [isRecurring, setIsRecurring] = useState(event.isRecurring || false);
  const [recurringType, setRecurringType] = useState(event.recurringType || 'weekly');
  const [locationType, setLocationType] = useState(event.locationType || 'online');
  const [locationName, setLocationName] = useState(event.locationName || '');
  const [locationUrl, setLocationUrl] = useState(event.locationUrl || '');
  const [category, setCategory] = useState(event.category || '');
  const [capacity, setCapacity] = useState(event.capacity ? String(event.capacity) : '');
  const [sendReminders, setSendReminders] = useState(event.sendReminders ?? true);
  const [reminderDays, setReminderDays] = useState(String(event.reminderDays || 1));
  const [attendeeType, setAttendeeType] = useState(event.attendeeType || 'all');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    event.coverImage ? `http://localhost:4000${event.coverImage}` : null
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !time) {
      alert('אנא מלאו את כל השדות הנדרשים');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחברו');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', new Date(`${date}T${time}`).toISOString());
      formData.append('duration', duration);
      formData.append('timezone', timezone);
      formData.append('isRecurring', String(isRecurring));
      if (isRecurring) formData.append('recurringType', recurringType);
      formData.append('locationType', locationType);
      formData.append('locationName', locationName);
      formData.append('locationUrl', locationUrl);
      if (category) formData.append('category', category);
      if (capacity) formData.append('capacity', capacity);
      formData.append('sendReminders', String(sendReminders));
      formData.append('reminderDays', reminderDays);
      formData.append('attendeeType', attendeeType);
      if (coverImage) formData.append('coverImage', coverImage);

      const res = await fetch(`http://localhost:4000/events/${event.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.message || 'שגיאה בעדכון האירוע');
      }
    } catch (err) {
      console.error('Update event error:', err);
      alert('שגיאה בעדכון האירוע');
    } finally {
      setLoading(false);
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-black">עריכת אירוע</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" dir="ltr">
          <form onSubmit={handleSubmit} className="p-6 space-y-5" dir="rtl">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מפגש קהילה"
              maxLength={30}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
            />
            <div className="text-xs text-gray-400 text-left mt-1">{title.length} / 30</div>
          </div>

          {/* Date, Time, Duration Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך <span className="text-red-500">*</span></label>
              <DateInput 
                value={date} 
                onChange={(isoDate) => setDate(isoDate)}
                onIconClick={() => setShowDatePicker(true)}
              />
              {showDatePicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                  <div className="absolute top-full right-0 mt-1 z-50">
                    <DatePicker
                      selected={date ? new Date(date) : new Date()}
                      onChange={(d: Date | null) => {
                        setDate(d ? d.toISOString().split('T')[0] : '');
                        setShowDatePicker(false);
                      }}
                      inline
                      locale="he"
                      formatWeekDay={formatWeekDay}
                      renderCustomHeader={({
                        date: headerDate,
                        changeYear,
                        changeMonth,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }) => (
                        <div className="flex items-center justify-between px-4 py-3">
                          <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <FaChevronRight className="w-4 h-4" />
                          </button>
                          <div className="flex gap-3">
                            <select
                              value={getMonth(headerDate)}
                              onChange={({ target: { value } }) => changeMonth(Number(value))}
                              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-semibold bg-white cursor-pointer"
                            >
                              {hebrewMonths.map((month, i) => (
                                <option key={month} value={i}>{month}</option>
                              ))}
                            </select>
                            <select
                              value={getYear(headerDate)}
                              onChange={({ target: { value } }) => changeYear(Number(value))}
                              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-semibold bg-white cursor-pointer min-w-[5rem]"
                            >
                              {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <FaChevronLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעה <span className="text-red-500">*</span></label>
              <TimePicker value={time} onChange={setTime} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">משך</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              >
                <option value="30">30 דקות</option>
                <option value="60">שעה</option>
                <option value="90">שעה וחצי</option>
                <option value="120">שעתיים</option>
                <option value="180">3 שעות</option>
                <option value="240">4 שעות</option>
                <option value="300">5 שעות</option>
              </select>
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recurring-edit"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-black rounded"
            />
            <label htmlFor="recurring-edit" className="text-sm text-gray-700">אירוע חוזר</label>
            {isRecurring && (
              <select
                value={recurringType}
                onChange={(e) => setRecurringType(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-black"
              >
                <option value="daily">יומי</option>
                <option value="weekly">שבועי</option>
                <option value="monthly">חודשי</option>
              </select>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מיקום</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setLocationType('online');
                  setLocationName('Zoom');
                  setLocationUrl('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  locationType === 'online' 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200'
                }`}
              >
                <FaVideo className="w-4 h-4" />
                <span className="text-sm text-black">מקוון</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationType('in-person');
                  setLocationName('');
                  setLocationUrl('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  locationType === 'in-person' 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200'
                }`}
              >
                <FaMapMarkerAlt className="w-4 h-4" />
                <span className="text-sm text-black">פיזי</span>
              </button>
            </div>
            {locationType === 'online' ? (
              <div className="flex gap-2">
                <select
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-40 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                >
                  <option value="Zoom">Zoom</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                </select>
                <input
                  type="text"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder="קישור למפגש"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
            ) : (
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="כתובת או שם המקום"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="בואו להנות מחברה טובה."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-black"
            />
            <div className="text-xs text-gray-400 text-left mt-1">{description.length} / 300</div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תמונת כיסוי</label>
            <div 
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-400 transition text-center"
              onClick={() => document.getElementById('coverImageInputEdit')?.click()}
            >
              {coverImagePreview ? (
                <img src={coverImagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
              ) : (
                <div className="text-gray-400">
                  <FaPlus className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">לחצו להעלאת תמונה</p>
                </div>
              )}
              <input
                id="coverImageInputEdit"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    category === cat.value 
                      ? cat.color + ' ring-2 ring-gray-400'
                      : cat.color + ' opacity-60 hover:opacity-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מי יכול להשתתף</label>
              <select
                value={attendeeType}
                onChange={(e) => setAttendeeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black"
              >
                <option value="all">כל החברים</option>
                <option value="managers">מנהלים בלבד</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מספר משתתפים מקסימלי</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="ללא הגבלה"
                min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black"
              />
            </div>
          </div>

          {/* Reminders */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reminders-edit"
              checked={sendReminders}
              onChange={(e) => setSendReminders(e.target.checked)}
              className="w-4 h-4 text-black rounded"
            />
            <label htmlFor="reminders-edit" className="text-sm text-gray-700">שלח תזכורת במייל</label>
            {sendReminders && (
              <select
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-black"
              >
                <option value="1">יום לפני</option>
                <option value="2">יומיים לפני</option>
                <option value="7">שבוע לפני</option>
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'מעדכן...' : 'עדכן אירוע'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsPageContent />
    </Suspense>
  );
}