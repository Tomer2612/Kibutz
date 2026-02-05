'use client';

import React from 'react';

interface CloseIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  color?: string;
}

export default function CloseIcon({ className, style, size = 16, color = "currentColor" }: CloseIconProps) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      width={size}
      height={size}
    >
      <path 
        d="M12 4L4 12" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M4 4L12 12" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
