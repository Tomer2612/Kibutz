'use client';

export default function CheckIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 14 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        d="M11.6678 3.5L5.25114 9.91667L2.33447 7" 
        stroke="currentColor" 
        strokeWidth="0.875" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
