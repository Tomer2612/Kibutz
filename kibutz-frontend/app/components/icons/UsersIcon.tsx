'use client';

export default function UsersIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 14 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        d="M10.4954 12.2487C10.4954 11.011 10.0038 9.82404 9.12861 8.94887C8.25344 8.0737 7.06645 7.58203 5.82878 7.58203C4.5911 7.58203 3.40411 8.0737 2.52894 8.94887C1.65377 9.82404 1.16211 11.011 1.16211 12.2487" 
        stroke="currentColor" 
        strokeWidth="0.875" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M5.82878 7.58333C7.43961 7.58333 8.74544 6.2775 8.74544 4.66667C8.74544 3.05584 7.43961 1.75 5.82878 1.75C4.21795 1.75 2.91211 3.05584 2.91211 4.66667C2.91211 6.2775 4.21795 7.58333 5.82878 7.58333Z" 
        stroke="currentColor" 
        strokeWidth="0.875" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12.8361 11.6685C12.8361 9.70266 11.6694 7.87682 10.5027 7.00182C10.8862 6.71411 11.1929 6.33629 11.3956 5.90181C11.5982 5.46734 11.6907 4.9896 11.6647 4.51087C11.6388 4.03215 11.4952 3.56721 11.2468 3.15719C10.9983 2.74717 10.6526 2.40473 10.2402 2.16016" 
        stroke="currentColor" 
        strokeWidth="0.875" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
