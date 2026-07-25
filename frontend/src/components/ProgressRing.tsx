import React from 'react';
import { Check } from 'lucide-react';

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  completed?: boolean;
  showPercentage?: boolean;
  color?: string;
  onClick?: () => void;
};

export default function ProgressRing({
  progress,
  size = 24,
  strokeWidth = 3,
  completed = false,
  showPercentage = false,
  color = 'var(--accent, #68c7d6)',
  onClick,
}: ProgressRingProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, completed ? 100 : progress || 0));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
      title={completed ? 'Completed' : `${clampedProgress}% completed`}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--card-border, rgba(255, 255, 255, 0.15))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress indicator */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={completed ? 'var(--accent, #68c7d6)' : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.35s ease-in-out' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size >= 60 ? '14px' : '10px',
          fontWeight: 700,
          color: completed ? '#fff' : 'var(--text-primary)',
        }}
      >
        {completed && size < 40 ? (
          <Check size={size * 0.5} color={color} strokeWidth={3} />
        ) : showPercentage ? (
          `${clampedProgress}%`
        ) : completed ? (
          <Check size={size * 0.5} color={color} strokeWidth={3} />
        ) : null}
      </div>
    </div>
  );
}
