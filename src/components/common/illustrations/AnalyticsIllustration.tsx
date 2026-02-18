interface AnalyticsIllustrationProps {
  className?: string;
}

const AnalyticsIllustration = ({ className }: AnalyticsIllustrationProps) => {
  /* Pentagon vertex calculator: 5 axes starting from top (270deg), clockwise */
  const cx = 112;
  const cy = 128;
  const pentagonPoint = (index: number, radius: number): [number, number] => {
    const angle = ((2 * Math.PI) / 5) * index - Math.PI / 2;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  };
  const pentagonPath = (radius: number) =>
    Array.from({ length: 5 }, (_, i) => pentagonPoint(i, radius))
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ') + ' Z';

  /* Data polygon: varying distances (85%, 70%, 55%, 90%, 60%) of max radius 48 */
  const dataRadii = [0.85, 0.7, 0.55, 0.9, 0.6];
  const maxR = 48;
  const dataPoints = dataRadii.map((pct, i) => pentagonPoint(i, maxR * pct));
  const dataPath =
    dataPoints
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ') + ' Z';

  /* Axis labels */
  const labels = ['Upper Push', 'Upper Pull', 'Squat', 'Hinge', 'Core'];
  const labelOffsets: [number, number][] = [
    [0, -10],   // top
    [14, 2],    // upper right
    [10, 12],   // lower right
    [-10, 12],  // lower left
    [-14, 2],   // upper left
  ];
  const labelAnchors: ('start' | 'middle' | 'end')[] = ['middle', 'start', 'start', 'end', 'end'];

  return (
    <svg
      viewBox="0 0 400 280"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Programming analytics dashboard with radar chart showing muscle group distribution, bar chart of weekly volume, and stat summary cards"
    >
      <defs>
        <linearGradient id="anl-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="anl-bar-blue" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="rgba(37,99,235,0.7)" />
        </linearGradient>
        <linearGradient id="anl-bar-purple" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="rgba(124,58,237,0.7)" />
        </linearGradient>
      </defs>

      {/* Panel background */}
      <rect
        x="16"
        y="8"
        width="368"
        height="264"
        rx="12"
        fill="#12121a"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Title */}
      <text x="36" y="32" fontFamily="'Inter', -apple-system, sans-serif" fontSize="12" fontWeight="700" fill="#f0f0f5">Programming Analytics</text>

      {/* ===== LEFT: Radar / Spider Chart ===== */}
      {/* Concentric pentagons */}
      <path d={pentagonPath(48)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
      <path d={pentagonPath(32)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <path d={pentagonPath(16)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

      {/* Axis lines from center to each vertex */}
      {Array.from({ length: 5 }, (_, i) => {
        const [vx, vy] = pentagonPoint(i, 48);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={vx}
            y2={vy}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon fill */}
      <path d={dataPath} fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth="1.2" />

      {/* Data point circles */}
      {dataPoints.map(([px, py], i) => (
        <circle key={`dp-${i}`} cx={px.toFixed(1)} cy={py.toFixed(1)} r="2.5" fill="#2563eb" stroke="#12121a" strokeWidth="1" />
      ))}

      {/* Axis labels */}
      {labels.map((label, i) => {
        const [vx, vy] = pentagonPoint(i, 48);
        return (
          <text
            key={`lbl-${i}`}
            x={vx + labelOffsets[i][0]}
            y={vy + labelOffsets[i][1]}
            textAnchor={labelAnchors[i]}
            fontFamily="'Inter', -apple-system, sans-serif"
            fontSize="6.5"
            fill="#8b8b9e"
          >
            {label}
          </text>
        );
      })}

      {/* ===== RIGHT: Bar Chart ===== */}
      {/* Chart area: x=230..374, y=48..180 */}
      {/* Y-axis labels */}
      <text x="232" y="58" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6.5" fill="#8b8b9e" textAnchor="end">100</text>
      <text x="232" y="100" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6.5" fill="#8b8b9e" textAnchor="end">50</text>
      <text x="232" y="142" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6.5" fill="#8b8b9e" textAnchor="end">0</text>

      {/* Y-axis grid lines */}
      <line x1="236" y1="55" x2="370" y2="55" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      <line x1="236" y1="97" x2="370" y2="97" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      <line x1="236" y1="139" x2="370" y2="139" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Bar W1: total height 65 (blue 45, purple 20) */}
      <rect x="249" y="94" width="22" height="45" rx="0" fill="url(#anl-bar-blue)" />
      <rect x="249" y="74" width="22" height="20" rx="4" fill="url(#anl-bar-purple)" />

      {/* Bar W2: total height 78 (blue 50, purple 28) */}
      <rect x="283" y="89" width="22" height="50" rx="0" fill="url(#anl-bar-blue)" />
      <rect x="283" y="61" width="22" height="28" rx="4" fill="url(#anl-bar-purple)" />

      {/* Bar W3: total height 55 (blue 35, purple 20) */}
      <rect x="317" y="104" width="22" height="35" rx="0" fill="url(#anl-bar-blue)" />
      <rect x="317" y="84" width="22" height="20" rx="4" fill="url(#anl-bar-purple)" />

      {/* Bar W4: total height 84 (blue 54, purple 30) */}
      <rect x="351" y="85" width="22" height="54" rx="0" fill="url(#anl-bar-blue)" />
      <rect x="351" y="55" width="22" height="30" rx="4" fill="url(#anl-bar-purple)" />

      {/* X-axis labels */}
      <text x="260" y="153" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fill="#8b8b9e">W1</text>
      <text x="294" y="153" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fill="#8b8b9e">W2</text>
      <text x="328" y="153" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fill="#8b8b9e">W3</text>
      <text x="362" y="153" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fill="#8b8b9e">W4</text>

      {/* Legend */}
      <rect x="262" y="160" width="8" height="6" rx="1.5" fill="#2563eb" />
      <text x="274" y="165.5" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6" fill="#8b8b9e">Volume</text>
      <rect x="310" y="160" width="8" height="6" rx="1.5" fill="#7c3aed" />
      <text x="322" y="165.5" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6" fill="#8b8b9e">Intensity</text>

      {/* ===== BOTTOM: 3 Stat Cards ===== */}
      {/* Card 1: Total Volume (blue) */}
      <rect x="36" y="192" width="104" height="52" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
      <text x="50" y="210" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fill="#8b8b9e">Total Volume</text>
      <text x="50" y="228" fontFamily="'Inter', -apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#2563eb">12,450</text>
      <text x="110" y="228" fontFamily="'Inter', -apple-system, sans-serif" fontSize="8" fill="#8b8b9e">lbs</text>
      {/* Subtle accent line at top */}
      <rect x="36" y="192" width="104" height="2" rx="1" fill="rgba(37,99,235,0.4)" />

      {/* Card 2: Unique Movements (purple) */}
      <rect x="148" y="192" width="104" height="52" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
      <text x="162" y="210" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fill="#8b8b9e">Unique Movements</text>
      <text x="162" y="228" fontFamily="'Inter', -apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#7c3aed">34</text>
      {/* Subtle accent line at top */}
      <rect x="148" y="192" width="104" height="2" rx="1" fill="rgba(124,58,237,0.4)" />

      {/* Card 3: Balance Score (green) */}
      <rect x="260" y="192" width="104" height="52" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
      <text x="274" y="210" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fill="#8b8b9e">Balance Score</text>
      <text x="274" y="228" fontFamily="'Inter', -apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#059669">87%</text>
      {/* Subtle accent line at top */}
      <rect x="260" y="192" width="104" height="2" rx="1" fill="rgba(5,150,105,0.4)" />
    </svg>
  );
};

export default AnalyticsIllustration;
