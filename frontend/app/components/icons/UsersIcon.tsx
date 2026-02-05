'use client';

interface UsersIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function UsersIcon({ className = "w-3.5 h-3.5", size = 16, color = "currentColor", ...props }: UsersIconProps & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M10.6666 14V12.6667C10.6666 11.9594 10.3856 11.2811 9.88554 10.781C9.38544 10.281 8.70716 10 7.99992 10H3.99992C3.29267 10 2.6144 10.281 2.1143 10.781C1.6142 11.2811 1.33325 11.9594 1.33325 12.6667V14"
        stroke={color}
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6667 2.08594C11.2386 2.23418 11.745 2.56811 12.1065 3.03531C12.4681 3.50251 12.6642 4.07653 12.6642 4.66727C12.6642 5.25801 12.4681 5.83203 12.1065 6.29923C11.745 6.76643 11.2386 7.10036 10.6667 7.2486"
        stroke={color}
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.6667 13.9993V12.6659C14.6663 12.0751 14.4697 11.5011 14.1077 11.0341C13.7457 10.5672 13.2388 10.2336 12.6667 10.0859"
        stroke={color}
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.99992 7.33333C7.47268 7.33333 8.66659 6.13943 8.66659 4.66667C8.66659 3.19391 7.47268 2 5.99992 2C4.52716 2 3.33325 3.19391 3.33325 4.66667C3.33325 6.13943 4.52716 7.33333 5.99992 7.33333Z"
        stroke={color}
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
