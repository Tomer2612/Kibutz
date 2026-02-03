export default function PowerIcon({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Vertical line at top */}
      <path 
        d="M12 2V12" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Arc */}
      <path 
        d="M18.364 6.364A9 9 0 1 1 5.636 6.364" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
