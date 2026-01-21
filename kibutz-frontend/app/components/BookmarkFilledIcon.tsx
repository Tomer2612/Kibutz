export default function BookmarkFilledIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M12.6668 14L8.00016 11.3333L3.3335 14V3.33333C3.3335 2.97971 3.47397 2.64057 3.72402 2.39052C3.97407 2.14048 4.31321 2 4.66683 2H11.3335C11.6871 2 12.0263 2.14048 12.2763 2.39052C12.5264 2.64057 12.6668 2.97971 12.6668 3.33333V14Z" 
        fill="currentColor" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
