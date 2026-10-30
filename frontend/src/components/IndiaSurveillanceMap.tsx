import React, { useState } from 'react';
import '../apaar.css';

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

// Geometric coordinates and simplified SVG polygons for Indian States & UTs
const STATE_PATHS: { id: string; name: string; path: string; center: [number, number] }[] = [
  { id: 'JK', name: 'Jammu and Kashmir', center: [140, 60], path: 'M 115 35 L 140 25 L 175 40 L 165 85 L 130 90 L 115 65 Z' },
  { id: 'HP', name: 'Himachal Pradesh', center: [155, 105], path: 'M 135 90 L 165 85 L 175 110 L 150 125 L 135 105 Z' },
  { id: 'PB', name: 'Punjab', center: [120, 115], path: 'M 105 100 L 135 105 L 130 135 L 105 130 Z' },
  { id: 'UT', name: 'Uttarakhand', center: [180, 125], path: 'M 165 110 L 195 120 L 190 145 L 160 135 Z' },
  { id: 'HR', name: 'Haryana', center: [135, 145], path: 'M 125 135 L 150 135 L 145 160 L 120 155 Z' },
  { id: 'DL', name: 'Delhi', center: [148, 148], path: 'M 144 144 L 152 144 L 152 152 L 144 152 Z' },
  { id: 'RJ', name: 'Rajasthan', center: [95, 180], path: 'M 70 140 L 125 135 L 145 180 L 115 225 L 60 205 L 60 160 Z' },
  { id: 'UP', name: 'Uttar Pradesh', center: [205, 175], path: 'M 150 135 L 205 140 L 265 175 L 235 215 L 175 210 L 145 170 Z' },
  { id: 'BR', name: 'Bihar', center: [285, 195], path: 'M 265 175 L 315 180 L 310 220 L 260 215 Z' },
  { id: 'WB', name: 'West Bengal', center: [320, 235], path: 'M 315 180 L 335 190 L 325 270 L 305 255 L 315 220 Z' },
  { id: 'JH', name: 'Jharkhand', center: [280, 235], path: 'M 260 215 L 305 220 L 300 260 L 255 250 Z' },
  { id: 'OD', name: 'Odisha', center: [270, 285], path: 'M 255 250 L 305 255 L 290 320 L 245 300 Z' },
  { id: 'MP', name: 'Madhya Pradesh', center: [165, 230], path: 'M 120 205 L 175 195 L 235 215 L 225 270 L 145 265 L 115 230 Z' },
  { id: 'GJ', name: 'Gujarat', center: [65, 240], path: 'M 30 210 L 95 215 L 105 265 L 75 285 L 35 255 L 20 230 Z' },
  { id: 'MH', name: 'Maharashtra', center: [135, 305], path: 'M 85 275 L 155 265 L 215 285 L 195 345 L 130 350 L 85 305 Z' },
  { id: 'CG', name: 'Chhattisgarh', center: [230, 260], path: 'M 220 225 L 250 230 L 245 295 L 210 300 Z' },
  { id: 'TG', name: 'Telangana', center: [175, 345], path: 'M 160 320 L 205 320 L 200 370 L 155 365 Z' },
  { id: 'AP', name: 'Andhra Pradesh', center: [195, 395], path: 'M 195 330 L 240 310 L 220 420 L 175 410 L 195 370 Z' },
  { id: 'KA', name: 'Karnataka', center: [125, 395], path: 'M 115 345 L 165 350 L 160 435 L 115 420 L 105 375 Z' },
  { id: 'GA', name: 'Goa', center: [100, 375], path: 'M 98 370 L 106 370 L 104 382 L 96 380 Z' },
  { id: 'KL', name: 'Kerala', center: [125, 465], path: 'M 115 430 L 135 435 L 130 495 L 115 470 Z' },
  { id: 'TN', name: 'Tamil Nadu', center: [160, 460], path: 'M 135 425 L 180 420 L 165 495 L 130 490 Z' },
  { id: 'AS', name: 'Assam', center: [365, 185], path: 'M 345 175 L 390 170 L 385 205 L 345 195 Z' },
  { id: 'NE', name: 'North East Region', center: [390, 185], path: 'M 375 160 L 415 165 L 405 220 L 370 210 Z' }
];

export const IndiaSurveillanceMap: React.FC<IndiaSurveillanceMapProps> = ({
  stateMetrics = [],
  onSelectState,
  selectedState
}) => {
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mode, setMode] = useState<'utilization' | 'anomalies'>('utilization');

  // Map state names to metrics map
  const metricsMap = new Map<string, StateData>();
  stateMetrics.forEach(m => {
    metricsMap.set(m.state.toLowerCase().trim(), m);
  });

  const getStateMetric = (name: string): StateData => {
    const clean = name.toLowerCase().trim();
    if (metricsMap.has(clean)) return metricsMap.get(clean)!;

    // Fuzzy matching for partial state names
    for (const [k, v] of metricsMap.entries()) {
      if (clean.includes(k) || k.includes(clean)) return v;
    }

    return {
      state: name,
      institutions: 4,
      approved_intake: 1200,
      enrolled: 1050,
      anomalies: 0
    };
  };

  const getColor = (data: StateData): string => {
    if (mode === 'anomalies') {
      if (data.anomalies >= 4) return '#ef4444'; // Red (High breach)
      if (data.anomalies >= 1) return '#f59e0b'; // Amber (Medium)
      return '#10b981'; // Green
    }

    const util = (data.enrolled / Math.max(data.approved_intake, 1)) * 100;
    if (util > 100) return '#ef4444'; // Over-intake violation
    if (util >= 95) return '#f59e0b'; // Near capacity alert
    if (util >= 75) return '#3b82f6'; // Healthy regular
    return '#10b981'; // Low utilization
  };

  const handleMouseMove = (e: React.MouseEvent, data: StateData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 20
    });
    setHoveredState(data);
  };

  return (
    <div className="apaar-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            🗺️ National Geo-Spatial Surveillance & Intake Parity Map
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Hover over any state to inspect AICTE intake utilization, enrolled APAAR volume, and active fraud anomalies.
          </p>
        </div>

        {/* View Mode & Filter Toggles */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'var(--border-color)', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setMode('utilization')}
              style={{
                background: mode === 'utilization' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                fontWeight: mode === 'utilization' ? 600 : 400,
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              Intake %
            </button>
            <button
              onClick={() => setMode('anomalies')}
              style={{
                background: mode === 'anomalies' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                fontWeight: mode === 'anomalies' ? 600 : 400,
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              Anomalies
            </button>
          </div>

          {selectedState && (
            <button
              onClick={() => onSelectState && onSelectState(null)}
              className="apaar-btn outline"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Clear Filter ({selectedState}) ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(220px, 0.8fr)', gap: '20px', alignItems: 'center' }}>
        {/* SVG Interactive Map */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <svg viewBox="0 0 440 520" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>
            {STATE_PATHS.map(state => {
              const data = getStateMetric(state.name);
              const fillColor = getColor(data);
              const isSelected = selectedState && selectedState.toLowerCase() === state.name.toLowerCase();

              return (
                <g key={state.id}>
                  <path
                    d={state.path}
                    fill={fillColor}
                    stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                    strokeWidth={isSelected ? '2.5' : '1'}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: hoveredState && hoveredState.state !== state.name ? 0.75 : 1
                    }}
                    onMouseEnter={(e) => handleMouseMove(e, data)}
                    onMouseMove={(e) => handleMouseMove(e, data)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => onSelectState && onSelectState(isSelected ? null : state.name)}
                  />
                  {/* State Center Label */}
                  <text
                    x={state.center[0]}
                    y={state.center[1]}
                    fontSize="9"
                    fontWeight="600"
                    fill="#FFFFFF"
                    textAnchor="middle"
                    pointerEvents="none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                  >
                    {state.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Hover Tooltip */}
          {hoveredState && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                background: '#0F172A',
                color: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                pointerEvents: 'none',
                zIndex: 30,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                minWidth: '180px'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '3px' }}>
                {hoveredState.state}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span>Monitored Campuses:</span>
                <strong>{hoveredState.institutions}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span>Approved Intake:</span>
                <strong>{hoveredState.approved_intake.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span>Admitted Regular:</span>
                <strong>{hoveredState.enrolled.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span>Seat Utilization:</span>
                <strong style={{ color: (hoveredState.enrolled / Math.max(hoveredState.approved_intake, 1)) > 1 ? '#ef4444' : '#38bdf8' }}>
                  {((hoveredState.enrolled / Math.max(hoveredState.approved_intake, 1)) * 100).toFixed(1)}%
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                <span>Active Anomalies:</span>
                <span style={{ color: hoveredState.anomalies > 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>
                  {hoveredState.anomalies}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend & Regional Jurisdictions */}
        <div style={{ fontSize: '0.82rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Regional Surveillance Legend:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', background: '#ef4444', borderRadius: '3px' }} />
              <span><strong>Over-Intake Breach</strong> (&gt;100% capacity / High alert)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', background: '#f59e0b', borderRadius: '3px' }} />
              <span><strong>Capacity Warning</strong> (95%–100% full capacity)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', background: '#3b82f6', borderRadius: '3px' }} />
              <span><strong>Healthy Regular Intake</strong> (75%–95% utilization)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', background: '#10b981', borderRadius: '3px' }} />
              <span><strong>Sub-capacity / Clean Status</strong> (&lt;75% utilization)</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.02))', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
              💡 Auditor Guidance (APH Ch. 7):
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Click any state (e.g. <strong>Delhi</strong>, <strong>Rajasthan</strong>, or <strong>Maharashtra</strong>) to lock jurisdiction focus. States exhibiting red breaches trigger automatic show-cause certificates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
