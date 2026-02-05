export default function MailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M18.3346 5.83594L10.8421 10.6084C10.5879 10.7561 10.2991 10.8339 10.0051 10.8339C9.71102 10.8339 9.42222 10.7561 9.16797 10.6084L1.66797 5.83594" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M16.668 3.33594H3.33464C2.41416 3.33594 1.66797 4.08213 1.66797 5.0026V15.0026C1.66797 15.9231 2.41416 16.6693 3.33464 16.6693H16.668C17.5884 16.6693 18.3346 15.9231 18.3346 15.0026V5.0026C18.3346 4.08213 17.5884 3.33594 16.668 3.33594Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
