export default function MoreDotsIcon({ className = "w-4 h-4", size }: { className?: string; size?: number }) {
  return (
    <svg 
      viewBox="0 0 15 15" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
    >
      <circle cx="2" cy="7.5" r="1.5" fill="currentColor"/>
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>
      <circle cx="13" cy="7.5" r="1.5" fill="currentColor"/>
    </svg>
  );
}
