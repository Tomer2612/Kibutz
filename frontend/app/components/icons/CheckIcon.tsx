'use client';

import React from 'react';

interface CheckIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  color?: string;
}

export default function CheckIcon({ className, style, size = 16, color = "currentColor" }: CheckIconProps) {
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
        d="M13.3346 4L6.0013 11.3333L2.66797 8" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
