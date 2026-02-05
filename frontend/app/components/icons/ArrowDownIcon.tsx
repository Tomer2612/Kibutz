'use client';

import React from 'react';

interface ArrowDownIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function ArrowDownIcon({ size, color = "currentColor", className = "w-4 h-4" }: ArrowDownIconProps) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
    >
      <path 
        d="M8 2.66667V13.3333M8 13.3333L12.6667 8.66667M8 13.3333L3.33333 8.66667" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
