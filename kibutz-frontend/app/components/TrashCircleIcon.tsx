export default function TrashCircleIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background: Gray 2 */}
      <rect width="40" height="40" rx="20" fill="#F4F4F5"/>
      
      {/* Trash Icon: Red (#B3261E) */}
      <path 
        d="M25.8334 15V26.6667C25.8334 27.1087 25.6578 27.5326 25.3453 27.8452C25.0327 28.1577 24.6088 28.3333 24.1667 28.3333H15.8334C15.3914 28.3333 14.9675 28.1577 14.6549 27.8452C14.3423 27.5326 14.1667 27.1087 14.1667 26.6667V15" 
        stroke="#B3261E" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12.5 15H27.5" 
        stroke="#B3261E" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M16.6667 15.0013V13.3346C16.6667 12.8926 16.8423 12.4687 17.1549 12.1561C17.4675 11.8436 17.8914 11.668 18.3334 11.668H21.6667C22.1088 11.668 22.5327 11.8436 22.8453 12.1561C23.1578 12.4687 23.3334 12.8926 23.3334 13.3346V15.0013" 
        stroke="#B3261E" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
