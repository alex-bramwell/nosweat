interface PaymentFlowIllustrationProps {
  className?: string;
}

const PaymentFlowIllustration = ({ className }: PaymentFlowIllustrationProps) => (
  <svg
    viewBox="0 0 400 280"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Three-step payment flow: member pays on your gym site, Stripe processes to your bank, then syncs to accounting software"
  >
    <defs>
      <linearGradient id="pflow-accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="pflow-node1" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="rgba(37,99,235,0.18)" />
        <stop offset="100%" stopColor="rgba(37,99,235,0.04)" />
      </linearGradient>
      <linearGradient id="pflow-node2" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="rgba(124,58,237,0.18)" />
        <stop offset="100%" stopColor="rgba(124,58,237,0.04)" />
      </linearGradient>
      <linearGradient id="pflow-node3" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="rgba(5,150,105,0.18)" />
        <stop offset="100%" stopColor="rgba(5,150,105,0.04)" />
      </linearGradient>
      <linearGradient id="pflow-stripe-btn" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#635bff" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>

    {/* Panel background */}
    <rect x="8" y="8" width="384" height="264" rx="12" fill="#12121a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

    {/* ===== Step Number Badges (top) ===== */}
    {/* Step 1 */}
    <circle cx="72" cy="30" r="10" fill="url(#pflow-accent)" />
    <text x="72" y="34" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="9" fontWeight="800" fill="#ffffff">1</text>

    {/* Step 2 */}
    <circle cx="200" cy="30" r="10" fill="url(#pflow-accent)" />
    <text x="200" y="34" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="9" fontWeight="800" fill="#ffffff">2</text>

    {/* Step 3 */}
    <circle cx="328" cy="30" r="10" fill="url(#pflow-accent)" />
    <text x="328" y="34" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="9" fontWeight="800" fill="#ffffff">3</text>

    {/* Connecting lines between step badges */}
    <line x1="82" y1="30" x2="190" y2="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    <line x1="210" y1="30" x2="318" y2="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

    {/* ===== NODE 1: Your Gym Site ===== */}
    <rect x="24" y="50" width="96" height="120" rx="10" fill="url(#pflow-node1)" stroke="rgba(37,99,235,0.3)" strokeWidth="0.75" />

    {/* Mini browser chrome */}
    <rect x="24" y="50" width="96" height="14" rx="10" fill="rgba(37,99,235,0.1)" />
    <rect x="24" y="56" width="96" height="8" fill="rgba(37,99,235,0.1)" />
    {/* Traffic light dots */}
    <circle cx="34" cy="57" r="2" fill="rgba(255,100,100,0.4)" />
    <circle cx="42" cy="57" r="2" fill="rgba(255,200,50,0.4)" />
    <circle cx="50" cy="57" r="2" fill="rgba(100,200,100,0.4)" />
    {/* URL bar */}
    <rect x="58" y="54.5" width="54" height="5" rx="2.5" fill="rgba(255,255,255,0.06)" />
    <text x="85" y="58.5" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="3.5" fill="rgba(240,240,245,0.35)">yourgym.nosweat</text>

    {/* Site content mock */}
    {/* Hero area */}
    <rect x="32" y="70" width="80" height="24" rx="4" fill="rgba(37,99,235,0.08)" />
    <rect x="40" y="76" width="48" height="3" rx="1.5" fill="rgba(240,240,245,0.15)" />
    <rect x="44" y="82" width="40" height="2" rx="1" fill="rgba(240,240,245,0.08)" />
    <rect x="48" y="87" width="32" height="3" rx="1.5" fill="rgba(37,99,235,0.3)" />

    {/* Pricing cards */}
    <rect x="32" y="100" width="36" height="28" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
    <text x="50" y="109" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="4" fontWeight="600" fill="rgba(240,240,245,0.5)">Day Pass</text>
    <text x="50" y="117" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fontWeight="800" fill="#2563eb">$25</text>
    <rect x="38" y="121" width="24" height="4" rx="2" fill="rgba(37,99,235,0.25)" />

    <rect x="76" y="100" width="36" height="28" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(37,99,235,0.2)" strokeWidth="0.75" />
    <text x="94" y="109" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="4" fontWeight="600" fill="rgba(240,240,245,0.5)">Monthly</text>
    <text x="94" y="117" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="7" fontWeight="800" fill="#2563eb">$49</text>
    <rect x="82" y="121" width="24" height="4" rx="2" fill="rgba(37,99,235,0.25)" />

    {/* Member pays badge */}
    <rect x="36" y="134" width="72" height="10" rx="5" fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.25)" strokeWidth="0.5" />
    <text x="72" y="141" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="600" fill="#60a5fa">Member Pays</text>

    {/* Label */}
    <text x="72" y="184" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="8" fontWeight="600" fill="#f0f0f5">Your Gym Site</text>
    <text x="72" y="194" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6" fill="#8b8b9e">Members pay online</text>

    {/* ===== ARROW 1 → 2 ===== */}
    <path
      d="M124,110 C140,110 144,110 152,110"
      fill="none"
      stroke="rgba(37,99,235,0.5)"
      strokeWidth="1.5"
      strokeDasharray="5 3"
      style={{ animation: 'pflow-dash 1.5s linear infinite' }}
    />
    <polygon points="152,107 158,110 152,113" fill="rgba(37,99,235,0.7)" />
    {/* Money label on arrow */}
    <rect x="128" y="100" width="20" height="10" rx="5" fill="rgba(37,99,235,0.1)" />
    <text x="138" y="107.5" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5.5" fontWeight="700" fill="#60a5fa">$</text>

    {/* ===== NODE 2: Stripe ===== */}
    <rect x="160" y="50" width="80" height="120" rx="10" fill="url(#pflow-node2)" stroke="rgba(124,58,237,0.3)" strokeWidth="0.75" />

    {/* Stripe logo area */}
    <rect x="170" y="58" width="60" height="20" rx="6" fill="rgba(99,91,255,0.12)" stroke="rgba(99,91,255,0.25)" strokeWidth="0.5" />
    {/* Stripe wordmark approximation */}
    <text x="200" y="71.5" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="9" fontWeight="800" fill="#635bff" letterSpacing="0.5">Stripe</text>

    {/* Processing animation visual */}
    <rect x="172" y="86" width="56" height="8" rx="4" fill="rgba(255,255,255,0.04)" />
    <rect x="172" y="86" width="36" height="8" rx="4" fill="rgba(99,91,255,0.2)">
      <animate attributeName="width" values="12;56;12" dur="2s" repeatCount="indefinite" />
    </rect>
    <text x="200" y="104" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fill="#8b8b9e">Processing payment...</text>

    {/* Deposit confirmation */}
    <rect x="170" y="112" width="60" height="22" rx="6" fill="rgba(5,150,105,0.08)" stroke="rgba(5,150,105,0.2)" strokeWidth="0.5" />
    {/* Check */}
    <circle cx="182" cy="123" r="5" fill="rgba(5,150,105,0.15)" />
    <path d="M179.5 123 L181.2 124.7 L184.5 121.5" fill="none" stroke="#059669" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
    <text x="193" y="120" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="600" fill="#059669">Deposited</text>
    <text x="193" y="128" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="700" fill="#f0f0f5">+$25.00</text>

    {/* Payout to bank visual */}
    <rect x="172" y="140" width="56" height="10" rx="5" fill="rgba(5,150,105,0.1)" stroke="rgba(5,150,105,0.2)" strokeWidth="0.5" />
    {/* Bank icon */}
    <g transform="translate(178, 142)">
      <path d="M3 2 L0 4 L6 4 L3 2Z" fill="rgba(5,150,105,0.6)" />
      <rect x="0.5" y="4" width="1" height="3" fill="rgba(5,150,105,0.4)" />
      <rect x="2.5" y="4" width="1" height="3" fill="rgba(5,150,105,0.4)" />
      <rect x="4.5" y="4" width="1" height="3" fill="rgba(5,150,105,0.4)" />
      <rect x="0" y="7" width="6" height="0.8" fill="rgba(5,150,105,0.5)" />
    </g>
    <text x="209" y="147.5" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="4.5" fontWeight="500" fill="#059669">To your bank</text>

    {/* Label */}
    <text x="200" y="184" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="8" fontWeight="600" fill="#f0f0f5">Stripe Processes</text>
    <text x="200" y="194" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6" fill="#8b8b9e">Straight to your bank</text>

    {/* ===== ARROW 2 → 3 ===== */}
    <path
      d="M244,110 C260,110 264,110 272,110"
      fill="none"
      stroke="rgba(5,150,105,0.5)"
      strokeWidth="1.5"
      strokeDasharray="5 3"
      style={{ animation: 'pflow-dash 1.5s linear infinite' }}
    />
    <polygon points="272,107 278,110 272,113" fill="rgba(5,150,105,0.7)" />
    {/* Sync label on arrow */}
    <rect x="247" y="100" width="24" height="10" rx="5" fill="rgba(5,150,105,0.1)" />
    <text x="259" y="107.5" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="4.5" fontWeight="600" fill="#059669">sync</text>

    {/* ===== NODE 3: Accounting ===== */}
    <rect x="280" y="50" width="96" height="120" rx="10" fill="url(#pflow-node3)" stroke="rgba(5,150,105,0.3)" strokeWidth="0.75" />

    {/* QuickBooks + Xero logos */}
    <rect x="290" y="58" width="38" height="16" rx="5" fill="rgba(5,150,105,0.1)" stroke="rgba(5,150,105,0.2)" strokeWidth="0.5" />
    <text x="309" y="69" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5.5" fontWeight="700" fill="#059669">QB</text>

    <rect x="332" y="58" width="34" height="16" rx="5" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.2)" strokeWidth="0.5" />
    <text x="349" y="69" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5.5" fontWeight="700" fill="#60a5fa">Xero</text>

    {/* Transaction list */}
    <rect x="290" y="82" width="76" height="16" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
    <circle cx="298" cy="90" r="3.5" fill="rgba(5,150,105,0.12)" />
    <path d="M296 90 L297.5 91.5 L300.5 88.5" fill="none" stroke="#059669" strokeWidth="0.7" strokeLinecap="round" />
    <text x="306" y="88" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="500" fill="#f0f0f5">Day Pass</text>
    <text x="358" y="88" textAnchor="end" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="600" fill="#059669">+$25</text>
    <text x="306" y="94" fontFamily="'Inter', -apple-system, sans-serif" fontSize="3.5" fill="#8b8b9e">Synced 2m ago</text>

    <rect x="290" y="102" width="76" height="16" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
    <circle cx="298" cy="110" r="3.5" fill="rgba(5,150,105,0.12)" />
    <path d="M296 110 L297.5 111.5 L300.5 108.5" fill="none" stroke="#059669" strokeWidth="0.7" strokeLinecap="round" />
    <text x="306" y="108" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="500" fill="#f0f0f5">PT Session</text>
    <text x="358" y="108" textAnchor="end" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="600" fill="#059669">+$80</text>
    <text x="306" y="114" fontFamily="'Inter', -apple-system, sans-serif" fontSize="3.5" fill="#8b8b9e">Synced 15m ago</text>

    <rect x="290" y="122" width="76" height="16" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
    <circle cx="298" cy="130" r="3.5" fill="rgba(5,150,105,0.12)" />
    <path d="M296 130 L297.5 131.5 L300.5 128.5" fill="none" stroke="#059669" strokeWidth="0.7" strokeLinecap="round" />
    <text x="306" y="128" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="500" fill="#f0f0f5">Monthly</text>
    <text x="358" y="128" textAnchor="end" fontFamily="'Inter', -apple-system, sans-serif" fontSize="5" fontWeight="600" fill="#059669">+$49</text>
    <text x="306" y="134" fontFamily="'Inter', -apple-system, sans-serif" fontSize="3.5" fill="#8b8b9e">Synced 1h ago</text>

    {/* All synced bar */}
    <rect x="290" y="144" width="76" height="12" rx="6" fill="rgba(5,150,105,0.08)" />
    <text x="328" y="152.5" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="4.5" fontWeight="500" fill="#059669">All synced</text>

    {/* Label */}
    <text x="328" y="184" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="8" fontWeight="600" fill="#f0f0f5">Books Updated</text>
    <text x="328" y="194" textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif" fontSize="6" fill="#8b8b9e">Automatic sync</text>

    {/* ===== Bottom Summary Bar ===== */}
    <rect x="24" y="210" width="352" height="46" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

    {/* Three summary stats */}
    <g textAnchor="middle" fontFamily="'Inter', -apple-system, sans-serif">
      {/* Revenue */}
      <text x="96" y="228" fontSize="6" fontWeight="500" fill="#8b8b9e">Today's Revenue</text>
      <text x="96" y="242" fontSize="12" fontWeight="800" fill="#f0f0f5">$1,240</text>

      {/* Divider */}
      <line x1="160" y1="218" x2="160" y2="248" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Transactions */}
      <text x="216" y="228" fontSize="6" fontWeight="500" fill="#8b8b9e">Transactions</text>
      <text x="216" y="242" fontSize="12" fontWeight="800" fill="#f0f0f5">18</text>

      {/* Divider */}
      <line x1="272" y1="218" x2="272" y2="248" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Synced */}
      <text x="328" y="228" fontSize="6" fontWeight="500" fill="#8b8b9e">Synced to Books</text>
      <text x="328" y="242" fontSize="12" fontWeight="800" fill="#059669">100%</text>
    </g>

    {/* CSS animation */}
    <style>{`
      @keyframes pflow-dash {
        to { stroke-dashoffset: -16; }
      }
    `}</style>
  </svg>
);

export default PaymentFlowIllustration;
