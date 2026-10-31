import React, { useState } from 'react';
import '../apaar.css';
import mapUtilImg from '../assets/india-map-utilization.png';
import mapAnomImg from '../assets/india-map-anomalies.png';

export interface StateData {
  state: string;
  institutions: number;
  approved_intake: number;
  enrolled: number;
  anomalies: number;
}

interface IndiaSurveillanceMapProps {
  stateMetrics?: StateData[];
  onSelectState?: (stateName: string | null) => void;
  selectedState?: string | null;
}

interface StatePin {
  id: string;
  code: string;
  name: string;
  cx: number;
  cy: number;
  defaultIntake: number;
  defaultEnrolled: number;
  defaultAnomalies: number;
}

const STATE_PINS: StatePin[] = [
  { id: 'JK', code: 'JK', name: 'Jammu and Kashmir', cx: 243, cy: 137, defaultIntake: 1800, defaultEnrolled: 1530, defaultAnomalies: 0 },
  { id: 'HP', code: 'HP', name: 'Himachal Pradesh', cx: 267, cy: 220, defaultIntake: 1200, defaultEnrolled: 864, defaultAnomalies: 0 },
  { id: 'PB', code: 'PB', name: 'Punjab', cx: 221, cy: 253, defaultIntake: 2200, defaultEnrolled: 1496, defaultAnomalies: 0 },
  { id: 'UT', code: 'UT', name: 'Uttarakhand', cx: 318, cy: 273, defaultIntake: 1400, defaultEnrolled: 980, defaultAnomalies: 0 },
  { id: 'HR', code: 'HR/DL', name: 'Haryana', cx: 244, cy: 302, defaultIntake: 3400, defaultEnrolled: 3264, defaultAnomalies: 1 },
  { id: 'RJ', code: 'RJ', name: 'Rajasthan', cx: 179, cy: 377, defaultIntake: 4500, defaultEnrolled: 4680, defaultAnomalies: 5 },
  { id: 'UP', code: 'UP', name: 'Uttar Pradesh', cx: 353, cy: 367, defaultIntake: 8500, defaultEnrolled: 8330, defaultAnomalies: 1 },
  { id: 'BR', code: 'BR', name: 'Bihar', cx: 483, cy: 404, defaultIntake: 3100, defaultEnrolled: 1922, defaultAnomalies: 0 },
  { id: 'JH', code: 'JH', name: 'Jharkhand', cx: 481, cy: 461, defaultIntake: 2000, defaultEnrolled: 1280, defaultAnomalies: 0 },
  { id: 'WB', code: 'WB', name: 'West Bengal', cx: 538, cy: 479, defaultIntake: 4800, defaultEnrolled: 3360, defaultAnomalies: 0 },
  { id: 'OD', code: 'OD', name: 'Odisha', cx: 452, cy: 547, defaultIntake: 3200, defaultEnrolled: 2208, defaultAnomalies: 0 },
  { id: 'CG', code: 'CG', name: 'Chhattisgarh', cx: 391, cy: 527, defaultIntake: 1900, defaultEnrolled: 1273, defaultAnomalies: 0 },
  { id: 'MP', code: 'MP', name: 'Madhya Pradesh', cx: 295, cy: 465, defaultIntake: 5200, defaultEnrolled: 5304, defaultAnomalies: 3 },
  { id: 'GJ', code: 'GJ', name: 'Gujarat', cx: 122, cy: 487, defaultIntake: 4800, defaultEnrolled: 3840, defaultAnomalies: 0 },
  { id: 'MH', code: 'MH', name: 'Maharashtra', cx: 239, cy: 577, defaultIntake: 8200, defaultEnrolled: 6888, defaultAnomalies: 2 },
  { id: 'TG', code: 'TG', name: 'Telangana', cx: 313, cy: 621, defaultIntake: 4600, defaultEnrolled: 3588, defaultAnomalies: 0 },
  { id: 'AP', code: 'AP', name: 'Andhra Pradesh', cx: 337, cy: 677, defaultIntake: 5400, defaultEnrolled: 4374, defaultAnomalies: 0 },
  { id: 'KA', code: 'KA', name: 'Karnataka', cx: 239, cy: 705, defaultIntake: 6900, defaultEnrolled: 5451, defaultAnomalies: 0 },
  { id: 'KL', code: 'KL', name: 'Kerala', cx: 247, cy: 818, defaultIntake: 3100, defaultEnrolled: 2201, defaultAnomalies: 0 },
  { id: 'TN', code: 'TN', name: 'Tamil Nadu', cx: 297, cy: 802, defaultIntake: 7800, defaultEnrolled: 6396, defaultAnomalies: 0 },
  { id: 'AS', code: 'AS/NE', name: 'Assam', cx: 669, cy: 384, defaultIntake: 2100, defaultEnrolled: 1365, defaultAnomalies: 0 },
];

export const IndiaSurveillanceMap: React.FC<IndiaSurveillanceMapProps> = ({
  stateMetrics = [],
  onSelectState,
  selectedState
}) => {
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [metricMode, setMetricMode] = useState<'utilization' | 'anomalies'>('utilization');

  // Pre-index state metrics for fast lookup
  const metricsMap = new Map<string, StateData>();
  stateMetrics.forEach(m => {
    metricsMap.set(m.state.toLowerCase().trim(), m);
  });

  const getStateMetric = (pin: StatePin): StateData => {
    const clean = pin.name.toLowerCase().trim();
    if (metricsMap.has(clean)) return metricsMap.get(clean)!;

    for (const [k, v] of metricsMap.entries()) {
      if (clean.includes(k) || k.includes(clean)) return v;
    }

    return {
      state: pin.name,
      institutions: pin.defaultIntake > 5000 ? 14 : 7,
      approved_intake: pin.defaultIntake,
      enrolled: pin.defaultEnrolled,
      anomalies: pin.defaultAnomalies
    };
  };

  const getSurveillanceColor = (data: StateData): { fill: string; border: string; text: string } => {
    if (metricMode === 'anomalies') {
      if (data.anomalies >= 3) return { fill: '#EF4444', border: '#B91C1C', text: '#FFFFFF' };
      if (data.anomalies >= 1) return { fill: '#F59E0B', border: '#D97706', text: '#FFFFFF' };
      return { fill: '#10B981', border: '#059669', text: '#FFFFFF' };
    }

    const util = (data.enrolled / Math.max(data.approved_intake, 1)) * 100;
    if (util > 100) return { fill: '#EF4444', border: '#B91C1C', text: '#FFFFFF' }; // Red
    if (util >= 95) return { fill: '#F59E0B', border: '#D97706', text: '#FFFFFF' }; // Amber
    if (util >= 75) return { fill: '#3B82F6', border: '#1D4ED8', text: '#FFFFFF' }; // Blue
    return { fill: '#10B981', border: '#059669', text: '#FFFFFF' }; // Green
  };

  const handleMouseMove = (e: React.MouseEvent, data: StateData) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 20
    });
    setHoveredState(data);
  };

  return (
    <div className="apaar-card" style={{ position: 'relative', overflow: 'hidden', padding: '20px 24px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🗺️</span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
              National Geo-Spatial Surveillance & Intake Parity Map
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            Official Survey of India territorial outline with real-time AICTE capacity parity and statutory anomaly heat.
          </p>
        </div>

        {/* View Mode Toggle & Clear Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setMetricMode('utilization')}
              style={{
                background: metricMode === 'utilization' ? '#FFFFFF' : 'transparent',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: metricMode === 'utilization' ? 700 : 500,
                cursor: 'pointer',
                color: metricMode === 'utilization' ? '#0F172A' : '#64748B',
                boxShadow: metricMode === 'utilization' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Intake %
            </button>
            <button
              onClick={() => setMetricMode('anomalies')}
              style={{
                background: metricMode === 'anomalies' ? '#FFFFFF' : 'transparent',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: metricMode === 'anomalies' ? 700 : 500,
                cursor: 'pointer',
                color: metricMode === 'anomalies' ? '#0F172A' : '#64748B',
                boxShadow: metricMode === 'anomalies' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Anomalies
            </button>
          </div>

          {selectedState && (
            <button
              onClick={() => onSelectState && onSelectState(null)}
              className="apaar-btn outline"
              style={{ padding: '5px 10px', fontSize: '0.75rem', borderColor: '#CBD5E1', background: '#F8FAFC' }}
            >
              Clear Filter: <strong>{selectedState}</strong> ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.25fr) minmax(240px, 0.75fr)', gap: '24px', alignItems: 'center' }}>
        {/* Authentic India Map Canvas with Direct Base Image & Number Badges */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '540px',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(15,23,42,0.06)'
          }}
        >
          {/* 1. Authentic Base Outline Image of India filled with Surveillance Legend Colors */}
          <img
            src={metricMode === 'utilization' ? mapUtilImg : mapAnomImg}
            alt="National Surveillance Map of India"
            style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
          />

          {/* 2. Interactive SVG Overlay for Numbers, Badges, and Hover Pins */}
          <svg
            viewBox="0 0 800 939"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'all'
            }}
          >
            <defs>
              <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.4" />
              </filter>
            </defs>

            {STATE_PINS.map(pin => {
              const data = getStateMetric(pin);
              const colorInfo = getSurveillanceColor(data);
              const isSelected = selectedState && selectedState.toLowerCase() === pin.name.toLowerCase();
              const isHovered = hoveredState && hoveredState.state === pin.name;
              const utilPct = Math.round((data.enrolled / Math.max(data.approved_intake, 1)) * 100);

              const displayText = metricMode === 'utilization' ? `${utilPct}%` : `${data.anomalies}`;
              const badgeWidth = metricMode === 'utilization' ? (displayText.length > 3 ? 54 : 46) : 32;
              const badgeHeight = 22;

              return (
                <g
                  key={pin.id}
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                  transform={isSelected || isHovered ? `scale(1.15) translate(${pin.cx * -0.13}, ${pin.cy * -0.13})` : undefined}
                  onMouseEnter={(e) => handleMouseMove(e, data)}
                  onMouseMove={(e) => handleMouseMove(e, data)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onSelectState && onSelectState(isSelected ? null : pin.name)}
                >
                  {/* Subtle selection / pulse glow */}
                  {isSelected && (
                    <circle
                      cx={pin.cx}
                      cy={pin.cy}
                      r="28"
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Number Badge Container */}
                  <rect
                    x={pin.cx - badgeWidth / 2}
                    y={pin.cy - badgeHeight / 2}
                    width={badgeWidth}
                    height={badgeHeight}
                    rx="11"
                    fill={colorInfo.fill}
                    stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    filter="url(#badge-shadow)"
                  />

                  {/* Number text on top of state */}
                  <text
                    x={pin.cx}
                    y={pin.cy + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="Inter, system-ui, sans-serif"
                    style={{ pointerEvents: 'none' }}
                  >
                    {displayText}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredState && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: 'translate(-50%, -100%)',
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#FFFFFF',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                minWidth: '210px'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '3px' }}>
                {hoveredState.state}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span style={{ color: '#94A3B8' }}>AICTE Approved Intake:</span>
                <span style={{ fontWeight: 600 }}>{hoveredState.approved_intake.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span style={{ color: '#94A3B8' }}>Enrolled APAAR:</span>
                <span style={{ fontWeight: 600 }}>{hoveredState.enrolled.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span style={{ color: '#94A3B8' }}>Intake Utilization:</span>
                <span style={{ fontWeight: 700, color: hoveredState.enrolled > hoveredState.approved_intake ? '#F87171' : '#34D399' }}>
                  {Math.round((hoveredState.enrolled / Math.max(hoveredState.approved_intake, 1)) * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span style={{ color: '#94A3B8' }}>Active Anomalies:</span>
                <span style={{ fontWeight: 700, color: hoveredState.anomalies > 0 ? '#FBBF24' : '#38BDF8' }}>
                  {hoveredState.anomalies}
                </span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#CBD5E1', fontStyle: 'italic', textAlign: 'center' }}>
                Click to filter state records
              </div>
            </div>
          )}
        </div>

        {/* Legend & Forensic Regulatory Guidance */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>
            Regional Surveillance Legend:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#EF4444', display: 'inline-block' }}></span>
              <span><strong>Over-Intake Breach</strong> (&gt;100% capacity / High alert)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#F59E0B', display: 'inline-block' }}></span>
              <span><strong>Capacity Warning</strong> (95%–100% full capacity)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#3B82F6', display: 'inline-block' }}></span>
              <span><strong>Healthy Regular Intake</strong> (75%–95% utilization)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#10B981', display: 'inline-block' }}></span>
              <span><strong>Sub-Capacity / Clean</strong> (&lt;75% utilization)</span>
            </div>
          </div>

          <div
            style={{
              marginTop: '18px',
              padding: '12px 14px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#334155',
              lineHeight: 1.45
            }}
          >
            <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
              💡 Real-Time Regulatory Oversight:
            </div>
            Click any state to isolate regional records. Over-intake breaches in Rajasthan (RTU Kota) and Madhya Pradesh (MITS Gwalior) are highlighted in red for forensic audit under APH Ch. 7.
          </div>
        </div>
      </div>
    </div>
  );
};
