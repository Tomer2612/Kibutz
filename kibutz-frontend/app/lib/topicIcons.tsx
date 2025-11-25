import {
  FaFilm,
  FaUtensils,
  FaHandsHelping,
  FaPaintBrush,
  FaCopyright,
  FaVideo,
  FaBrain,
  FaGamepad,
  FaPlane,
  FaGraduationCap,
  FaTv,
  FaCamera,
  FaChartLine,
  FaBookOpen,
  FaRunning,
  FaPuzzlePiece,
  FaRocket,
} from 'react-icons/fa';
import { ReactNode } from 'react';

export interface TopicIconConfig {
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
}

// Splitwise-inspired icons with soft pastel backgrounds and matching icon colors
export const TOPIC_ICONS: Record<string, TopicIconConfig> = {
  'אנימציה': {
    icon: <FaFilm className="w-5 h-5" />,
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  'אוכל, בישול ותזונה': {
    icon: <FaUtensils className="w-5 h-5" />,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  'עזרה ותמיכה': {
    icon: <FaHandsHelping className="w-5 h-5" />,
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  'עיצוב גרפי': {
    icon: <FaPaintBrush className="w-5 h-5" />,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  'עיצוב מותגים': {
    icon: <FaCopyright className="w-5 h-5" />,
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  'עריכת וידאו': {
    icon: <FaVideo className="w-5 h-5" />,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  'בריאות הנפש ופיתוח אישי': {
    icon: <FaBrain className="w-5 h-5" />,
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  'גיימינג': {
    icon: <FaGamepad className="w-5 h-5" />,
    bgColor: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  'טיולים ולייףסטייל': {
    icon: <FaPlane className="w-5 h-5" />,
    bgColor: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  'לימודים ואקדמיה': {
    icon: <FaGraduationCap className="w-5 h-5" />,
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  'מדיה, קולנוע וסדרות': {
    icon: <FaTv className="w-5 h-5" />,
    bgColor: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  'מדיה חברתית ותוכן ויזואלי': {
    icon: <FaCamera className="w-5 h-5" />,
    bgColor: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-600',
  },
  'ניהול פיננסי והשקעות': {
    icon: <FaChartLine className="w-5 h-5" />,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  'ספרים וכתיבה': {
    icon: <FaBookOpen className="w-5 h-5" />,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-700',
  },
  'ספורט ואורח חיים פעיל': {
    icon: <FaRunning className="w-5 h-5" />,
    bgColor: 'bg-lime-100',
    iconColor: 'text-lime-600',
  },
  'תחביבים': {
    icon: <FaPuzzlePiece className="w-5 h-5" />,
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  'יזמות ועסקים עצמאיים': {
    icon: <FaRocket className="w-5 h-5" />,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
};

// Default icon for unknown topics
export const DEFAULT_TOPIC_ICON: TopicIconConfig = {
  icon: <FaPuzzlePiece className="w-5 h-5" />,
  bgColor: 'bg-gray-100',
  iconColor: 'text-gray-600',
};

// Helper function to get topic icon config
export function getTopicIcon(topic: string | null | undefined): TopicIconConfig {
  if (!topic) return DEFAULT_TOPIC_ICON;
  return TOPIC_ICONS[topic] || DEFAULT_TOPIC_ICON;
}

// Topic icon component with circular background (Splitwise style)
interface TopicIconProps {
  topic: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TopicIcon({ topic, size = 'md', className = '' }: TopicIconProps) {
  const config = getTopicIcon(topic);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${config.bgColor} flex items-center justify-center ${config.iconColor} ${className}`}
    >
      {config.icon}
    </div>
  );
}

// Export topics list for consistency
export const COMMUNITY_TOPICS = [
  'אנימציה',
  'אוכל, בישול ותזונה',
  'עזרה ותמיכה',
  'עיצוב גרפי',
  'עיצוב מותגים',
  'עריכת וידאו',
  'בריאות הנפש ופיתוח אישי',
  'גיימינג',
  'טיולים ולייףסטייל',
  'לימודים ואקדמיה',
  'מדיה, קולנוע וסדרות',
  'מדיה חברתית ותוכן ויזואלי',
  'ניהול פיננסי והשקעות',
  'ספרים וכתיבה',
  'ספורט ואורח חיים פעיל',
  'תחביבים',
  'יזמות ועסקים עצמאיים',
];
