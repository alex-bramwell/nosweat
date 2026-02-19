interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => (
  <svg
    viewBox="0 0 180 48"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="No Sweat Fitness"
  >
    <defs>
      <linearGradient id="nsfGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="nsfGradH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <clipPath id="dropClip">
        <path d="M20,4 Q20,4 20,4 C20,4 10,18 10,26 A10,10 0 0 0 30,26 C30,18 20,4 20,4 Z" />
      </clipPath>
    </defs>

    {/* Icon: Sweat droplet with "no" slash */}
    <g transform="translate(2, 2)">
      {/* Droplet shape - gradient filled */}
      <path
        d="M20,3 C20,3 8,18 8,27 A12,12 0 0 0 32,27 C32,18 20,3 20,3 Z"
        fill="url(#nsfGrad)"
        opacity="0.15"
      />
      <path
        d="M20,3 C20,3 8,18 8,27 A12,12 0 0 0 32,27 C32,18 20,3 20,3 Z"
        fill="none"
        stroke="url(#nsfGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Diagonal slash through the droplet */}
      <line
        x1="11"
        y1="12"
        x2="29"
        y2="36"
        stroke="url(#nsfGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>

    {/* Wordmark */}
    <g transform="translate(44, 0)">
      {/* "NO SWEAT" - primary text */}
      <text
        x="0"
        y="26"
        fill="currentColor"
        fontFamily="'Inter', -apple-system, sans-serif"
        fontWeight="800"
        fontSize="22"
        letterSpacing="-0.5"
      >
        NO SWEAT
      </text>

      {/* Gradient accent bar */}
      <rect
        x="0"
        y="30"
        width="40"
        height="2.5"
        rx="1.25"
        fill="url(#nsfGradH)"
      />

      {/* "FITNESS" - subtitle */}
      <text
        x="0"
        y="43"
        fill="currentColor"
        fontFamily="'Inter', -apple-system, sans-serif"
        fontWeight="500"
        fontSize="9"
        letterSpacing="4"
        opacity="0.5"
      >
        FITNESS
      </text>
    </g>
  </svg>
);

export default Logo;
