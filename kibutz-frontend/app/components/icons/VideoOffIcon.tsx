interface VideoOffIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const VideoOffIcon = ({ size = 20, color = "currentColor", className, style, ...props }: VideoOffIconProps) => (
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
      d="M8.88379 5H11.6671C12.1091 5 12.5331 5.17559 12.8456 5.48816C13.1582 5.80072 13.3338 6.22464 13.3338 6.66667V8.75L17.7071 6.19833C17.7704 6.16138 17.8424 6.14179 17.9157 6.14155C17.989 6.1413 18.0611 6.1604 18.1247 6.19692C18.1882 6.23344 18.2411 6.28608 18.2778 6.34954C18.3145 6.413 18.3338 6.48502 18.3338 6.55833V13.3883"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.3337 13.3333C13.3337 13.7754 13.1581 14.1993 12.8455 14.5118C12.5329 14.8244 12.109 15 11.667 15H3.33366C2.89163 15 2.46771 14.8244 2.15515 14.5118C1.84259 14.1993 1.66699 13.7754 1.66699 13.3333V6.66667C1.66699 6.22464 1.84259 5.80072 2.15515 5.48816C2.46771 5.17559 2.89163 5 3.33366 5H5.00033"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.66699 1.66602L18.3337 18.3327"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default VideoOffIcon;
