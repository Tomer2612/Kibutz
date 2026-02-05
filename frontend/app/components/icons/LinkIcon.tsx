interface LinkIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const LinkIcon = ({ size = 16, color = "currentColor", className, style, ...props }: LinkIconProps) => (
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
      d="M6.66667 8.66667C6.95297 9.04942 7.31826 9.36612 7.73772 9.59529C8.15718 9.82446 8.62102 9.96074 9.09778 9.99489C9.57454 10.029 10.0531 9.96024 10.5009 9.79319C10.9487 9.62613 11.3554 9.36471 11.6933 9.02667L13.6933 7.02667C14.3005 6.39799 14.6365 5.55598 14.6289 4.68199C14.6213 3.808 14.2708 2.97196 13.6528 2.35394C13.0348 1.73591 12.1987 1.38546 11.3248 1.37784C10.4508 1.37022 9.60875 1.70622 8.98 2.31333L7.83333 3.45333"
      stroke={color}
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.33333 7.33333C9.04703 6.95058 8.68174 6.63388 8.26228 6.40471C7.84282 6.17554 7.37898 6.03926 6.90222 6.00511C6.42546 5.97096 5.94695 6.03976 5.49911 6.20681C5.05127 6.37387 4.6446 6.63529 4.30667 6.97333L2.30667 8.97333C1.69956 9.60201 1.36356 10.444 1.37118 11.318C1.3788 12.192 1.72925 13.028 2.34728 13.6461C2.96531 14.2641 3.80135 14.6145 4.67534 14.6222C5.54933 14.6298 6.39135 14.2938 7.02 13.6867L8.16 12.5467"
      stroke={color}
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LinkIcon;
