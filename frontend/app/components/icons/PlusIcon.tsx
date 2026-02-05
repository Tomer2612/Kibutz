interface PlusIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function PlusIcon({ className, size = 16, color = "currentColor" }: PlusIconProps) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
    >
      <path 
        d="M3.33333 8H12.6667" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 3.33333V12.6667" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
