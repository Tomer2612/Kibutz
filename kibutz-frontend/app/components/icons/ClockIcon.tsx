interface ClockIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ClockIcon = ({ size = 16, color = "currentColor", className, style, ...props }: ClockIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    {...props}
  >
    <path
      d="M8 4V8L10.6667 9.33333"
      stroke={color}
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.99992 14.6693C11.6818 14.6693 14.6666 11.6845 14.6666 8.0026C14.6666 4.32071 11.6818 1.33594 7.99992 1.33594C4.31802 1.33594 1.33325 4.32071 1.33325 8.0026C1.33325 11.6845 4.31802 14.6693 7.99992 14.6693Z"
      stroke={color}
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ClockIcon;
