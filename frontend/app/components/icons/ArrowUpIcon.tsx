'use client';

import React from 'react';

interface ArrowUpIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function ArrowUpIcon({ size, color = "currentColor", className = "w-4 h-4" }: ArrowUpIconProps) {
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
        d="M8 13.3333V2.66667M8 2.66667L3.33333 7.33333M8 2.66667L12.6667 7.33333" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
