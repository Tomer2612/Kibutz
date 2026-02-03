import React from 'react';

export default function UserIcon({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path 
        d="M7.99996 8.66667C9.84091 8.66667 11.3333 7.17428 11.3333 5.33333C11.3333 3.49238 9.84091 2 7.99996 2C6.15901 2 4.66663 3.49238 4.66663 5.33333C4.66663 7.17428 6.15901 8.66667 7.99996 8.66667Z" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M13.3333 14.0013C13.3333 12.5868 12.7714 11.2303 11.7712 10.2301C10.771 9.22987 9.41445 8.66797 7.99996 8.66797C6.58547 8.66797 5.22892 9.22987 4.22872 10.2301C3.22853 11.2303 2.66663 12.5868 2.66663 14.0013" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
