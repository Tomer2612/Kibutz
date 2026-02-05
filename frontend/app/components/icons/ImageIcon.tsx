interface ImageIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ImageIcon = ({ size = 20, color = "currentColor", className, style, ...props }: ImageIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    {...props}
  >
    <path
      d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.49992 9.16536C8.42039 9.16536 9.16659 8.41917 9.16659 7.4987C9.16659 6.57822 8.42039 5.83203 7.49992 5.83203C6.57944 5.83203 5.83325 6.57822 5.83325 7.4987C5.83325 8.41917 6.57944 9.16536 7.49992 9.16536Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.5 12.5011L14.9283 9.92938C14.6158 9.61693 14.1919 9.44141 13.75 9.44141C13.3081 9.44141 12.8842 9.61693 12.5717 9.92938L5 17.501"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ImageIcon;
