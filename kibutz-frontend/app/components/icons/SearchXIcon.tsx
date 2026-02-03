export default function SearchXIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle */}
      <rect width="40" height="40" rx="20" fill="white"/>
      
      {/* Icon Paths */}
      <path 
        d="M20.7499 17.084L16.5833 21.2507" 
        stroke="black" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M16.5833 17.084L20.7499 21.2507" 
        stroke="black" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M18.6667 25.8333C22.3486 25.8333 25.3333 22.8486 25.3333 19.1667C25.3333 15.4848 22.3486 12.5 18.6667 12.5C14.9848 12.5 12 15.4848 12 19.1667C12 22.8486 14.9848 25.8333 18.6667 25.8333Z" 
        stroke="black" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M27.0001 27.4993L23.4167 23.916" 
        stroke="black" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
