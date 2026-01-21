'use client';

export default function CalendarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M5.33325 1.33203V3.9987" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M10.6667 1.33203V3.9987" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12.6667 2.66797H3.33333C2.59695 2.66797 2 3.26492 2 4.0013V13.3346C2 14.071 2.59695 14.668 3.33333 14.668H12.6667C13.403 14.668 14 14.071 14 13.3346V4.0013C14 3.26492 13.403 2.66797 12.6667 2.66797Z" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M2 6.66797H14" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
