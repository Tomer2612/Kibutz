interface FileQuestionIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const FileQuestionIcon = ({ size = 18, color = "currentColor", className, style, ...props }: FileQuestionIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    {...props}
  >
    <path
      d="M4.5 16.5C4.10218 16.5 3.72064 16.342 3.43934 16.0607C3.15804 15.7794 3 15.3978 3 15V3C3 2.60218 3.15804 2.22065 3.43934 1.93934C3.72064 1.65804 4.10218 1.5 4.5 1.5H10.5C10.7374 1.49962 10.9726 1.5462 11.1919 1.63708C11.4112 1.72795 11.6104 1.86132 11.778 2.0295L14.469 4.7205C14.6376 4.88813 14.7714 5.08751 14.8625 5.30712C14.9537 5.52674 15.0004 5.76223 15 6V15C15 15.3978 14.842 15.7794 14.5607 16.0607C14.2794 16.342 13.8978 16.5 13.5 16.5H4.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12.75H9.00667"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.82495 6.74817C7.00494 6.25215 7.35353 5.83516 7.8098 5.5701C8.26607 5.30504 8.80098 5.20877 9.32103 5.29812C9.84108 5.38748 10.3132 5.65677 10.6548 6.05893C10.9964 6.46108 11.1859 6.97052 11.19 7.49817C11.19 8.99817 8.93995 9.74817 8.93995 9.74817"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default FileQuestionIcon;
