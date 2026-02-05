'use client';

import React from 'react';

interface ChevronDownIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function ChevronDownIcon({ size, color = "currentColor", className = "w-4 h-4" }: ChevronDownIconProps) {
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
        d="M4 6.33594L8 10.3359L12 6.33594" 
        stroke={color} 
        strokeWidth="1.33" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
