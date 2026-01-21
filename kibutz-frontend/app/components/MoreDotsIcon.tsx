export default function MoreDotsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 15 3" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor"/>
      <circle cx="7.5" cy="1.5" r="1.5" fill="currentColor"/>
      <circle cx="13.5" cy="1.5" r="1.5" fill="currentColor"/>
    </svg>
  );
}
