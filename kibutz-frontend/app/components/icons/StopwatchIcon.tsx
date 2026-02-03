export default function StopwatchIcon({ className = "w-4.5 h-4.5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 18 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M7.50049 1.5H10.5005" 
        stroke="currentColor" 
        strokeWidth="1.125" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M9 10.5L11.25 8.25" 
        stroke="currentColor" 
        strokeWidth="1.125" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M9.00049 16.5C12.3142 16.5 15.0005 13.8137 15.0005 10.5C15.0005 7.18629 12.3142 4.5 9.00049 4.5C5.68678 4.5 3.00049 7.18629 3.00049 10.5C3.00049 13.8137 5.68678 16.5 9.00049 16.5Z" 
        stroke="currentColor" 
        strokeWidth="1.125" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
