'use client';

import React from 'react';

interface ChevronUpIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function ChevronUpIcon({ size, color = "currentColor", className = "w-4 h-4" }: ChevronUpIconProps) {
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
        d="M12 9.66406L8 5.66406L4 9.66406" 
        stroke={color} 
        strokeWidth="1.33" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
