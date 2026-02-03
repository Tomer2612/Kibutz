'use client';

export default function ClipboardCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M9.99992 1.33203H5.99992C5.63173 1.33203 5.33325 1.63051 5.33325 1.9987V3.33203C5.33325 3.70022 5.63173 3.9987 5.99992 3.9987H9.99992C10.3681 3.9987 10.6666 3.70022 10.6666 3.33203V1.9987C10.6666 1.63051 10.3681 1.33203 9.99992 1.33203Z" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M10.6667 2.66797H12.0001C12.3537 2.66797 12.6928 2.80844 12.9429 3.05849C13.1929 3.30854 13.3334 3.64768 13.3334 4.0013V13.3346C13.3334 13.6883 13.1929 14.0274 12.9429 14.2774C12.6928 14.5275 12.3537 14.668 12.0001 14.668H4.00008C3.64646 14.668 3.30732 14.5275 3.05727 14.2774C2.80722 14.0274 2.66675 13.6883 2.66675 13.3346V4.0013C2.66675 3.64768 2.80722 3.30854 3.05727 3.05849C3.30732 2.80844 3.64646 2.66797 4.00008 2.66797H5.33341" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M6 9.33333L7.33333 10.6667L10 8" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
