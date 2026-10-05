// A single headline number as a ring gauge: one series, one hue, the value is
// printed in the centre so colour never carries meaning alone.
export function ScoreRing({ percentage, label = "correct" }: { percentage: number; label?: string }) {
  const size = 168;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="ring" role="img" aria-label={`${clamped.toFixed(0)} percent ${label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-center">
        <div>
          <strong>{clamped.toFixed(0)}%</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}
