import React from 'react';

export default function LockIcon({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path 
        d="M15.8333 9.16797H4.16667C3.24619 9.16797 2.5 9.91416 2.5 10.8346V16.668C2.5 17.5884 3.24619 18.3346 4.16667 18.3346H15.8333C16.7538 18.3346 17.5 17.5884 17.5 16.668V10.8346C17.5 9.91416 16.7538 9.16797 15.8333 9.16797Z" 
        stroke="currentColor" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M5.83325 9.16797V5.83464C5.83325 4.72957 6.27224 3.66976 7.05364 2.88836C7.83504 2.10696 8.89485 1.66797 9.99992 1.66797C11.105 1.66797 12.1648 2.10696 12.9462 2.88836C13.7276 3.66976 14.1666 4.72957 14.1666 5.83464V9.16797" 
        stroke="currentColor" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
