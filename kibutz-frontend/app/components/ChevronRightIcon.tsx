export default function ChevronRightIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M7.5 15L12.5 10L7.5 5" 
        stroke="currentColor" 
        strokeWidth="1.66667" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
