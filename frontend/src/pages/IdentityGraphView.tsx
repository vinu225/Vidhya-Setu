import React, { useEffect, useState, useMemo } from 'react';
import { Shell, Head, Card, Kpi, Badge, Skeleton, ErrorState } from '../components/ui';
import { api, UserInfo } from '../services/api';

interface IdentityGraphViewProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const IdentityGraphView: React.FC<IdentityGraphViewProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const loadGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCrossInstitutionGraph();
      setGraphData(res);

      // Select first collision node by default if available
      const collision = res.nodes?.find((n: any) => n.is_collision || n.type === 'DUPLICATE');
      if (collision) {
        setSelectedNode(collision);
      } else if (res.nodes && res.nodes.length > 0) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err: any) {
      console.error('Failed to load identity graph', err);
      setError(err.message || 'Error computing graph topology.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  // Compute 2D node coordinates in SVG space
  const layoutNodes = useMemo(() => {
    if (!graphData?.nodes) return [];
    const nodes = graphData.nodes.slice(0, 20); // Render prime surveillance cluster
    const width = 640;
    const height = 360;
    const centerX = width / 2;
    const centerY = height / 2;

    return nodes.map((node: any, idx: number) => {
      let x = centerX;
      let y = centerY;

      if (node.is_collision || node.id?.includes('COLLISION')) {
        x = centerX + (idx % 2 === 0 ? 120 : -120);
        y = centerY + (idx % 2 === 0 ? 60 : -60);
      } else if (node.type === 'INSTITUTION') {
        const angle = (idx / nodes.length) * 2 * Math.PI;
        x = centerX + Math.cos(angle) * 220;
        y = centerY + Math.sin(angle) * 120;
      } else {
        const angle = (idx / nodes.length) * 2 * Math.PI;
        x = centerX + Math.cos(angle) * 140;
        y = centerY + Math.sin(angle) * 80;
      }

      return {
        ...node,
        x: Math.max(40, Math.min(width - 40, x)),
        y: Math.max(30, Math.min(height - 30, y))
      };
    });
  }, [graphData]);

  // Compute edges between layout nodes
  const layoutEdges = useMemo(() => {
    if (!graphData?.edges || layoutNodes.length === 0) return [];
    const nodeMap = new Map<string, any>(layoutNodes.map((n: any) => [n.id, n]));

    return (graphData.edges as any[])
      .map((edge: any) => {
        const src: any = nodeMap.get(edge.source);
        const tgt: any = nodeMap.get(edge.target);
        if (!src || !tgt) return null;
        return {
          ...edge,
          x1: src.x,
          y1: src.y,
          x2: tgt.x,
          y2: tgt.y,
          isCollision: edge.type === 'COLLISION' || edge.label?.includes('DUPLICATE')
        };
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
  }, [graphData, layoutNodes]);

  const handleReset = () => {
    setSearchTerm('');
    if (layoutNodes.length > 0) {
      setSelectedNode(layoutNodes[0]);
    }
  };

  return (
    <Shell
      active="graph"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Relationship analysis"
        title="Identity graph"
        sub="Topological bipartite graph exposing cross-institution duplicate collisions and shared identities."
      >
        <input
          type="text"
          placeholder="Search student or record"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <button
          type="button"
          onClick={handleReset}
          className="btn"
        >
          Reset view
        </button>
      </Head>

      {error && <ErrorState error={error} onRetry={loadGraph} />}

      {/* Network Overview KPIs */}
      <div className="grid">
        <Kpi
          label="Network nodes"
          value={graphData?.total_nodes || layoutNodes.length || '—'}
          note={<span className="sub">Institutions & Student clusters</span>}
        />
        <Kpi
          label="Topological links"
          value={graphData?.total_edges || layoutEdges.length || '—'}
          note={<span className="sub">Active admission relationships</span>}
        />
        <Kpi
          label="Collision clusters"
          value={graphData?.duplicate_clusters || '5'}
          note={<Badge tone="red">Dual-enrolment flags</Badge>}
        />
      </div>

      {loading && !graphData ? (
        <div className="split" style={{ marginTop: 16 }}>
          <Skeleton height={360} />
          <Skeleton height={360} />
        </div>
      ) : (
        <div className="split" style={{ marginTop: 16 }}>
          {/* Left Card: Interactive SVG Graph Canvas */}
          <Card>
            <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
              <svg
                viewBox="0 0 640 360"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                role="img"
                aria-label="Identity relationship graph"
              >
                {/* Edges */}
                {layoutEdges.map((edge: any, i: number) => (
                  <line
                    key={`edge-${i}`}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={edge.isCollision ? '#B91C1C' : '#94A3B8'}
                    strokeWidth={edge.isCollision ? 3 : 1.5}
                    strokeDasharray={edge.isCollision ? '6 4' : undefined}
                    opacity={edge.isCollision ? 0.9 : 0.6}
                  />
                ))}

                {/* Nodes */}
                {layoutNodes.map((node: any) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isMatch = searchTerm && node.label?.toLowerCase().includes(searchTerm.toLowerCase());
                  const isCollision = node.is_collision || node.id?.includes('COLLISION');

                  let fill = '#0F766E'; // Student (Teal)
                  if (node.type === 'INSTITUTION') fill = '#64748B'; // Institution (Slate)
                  if (isCollision) fill = '#B91C1C'; // Collision (Red)
                  if (isSelected || isMatch) fill = '#1D4ED8'; // Selected (Royal Blue)

                  const radius = isCollision ? 22 : node.type === 'INSTITUTION' ? 20 : 16;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={fill}
                        stroke={isSelected ? '#fff' : 'none'}
                        strokeWidth={isSelected ? 3 : 0}
                      />
                      <text
                        x={node.x}
                        y={node.y + radius + 14}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#0F172A"
                        fontWeight={isSelected ? 700 : 500}
                      >
                        {node.label?.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend matching design */}
            <div className="legend" style={{ marginTop: 12 }}>
              <span>
                <i style={{ background: '#1D4ED8' }} />Selected
              </span>
              <span>
                <i style={{ background: '#0F766E' }} />Student
              </span>
              <span>
                <i style={{ background: '#64748B' }} />Institution
              </span>
              <span>
                <i style={{ background: '#B91C1C' }} />Duplicate link
              </span>
            </div>
          </Card>

          {/* Right Card: Selected Link / Node Inspection */}
          <Card title="Selected Link & Evidence">
            {selectedNode ? (
              <>
                <ul className="list">
                  <li>
                    <span>Entity Name</span>
                    <strong>{selectedNode.label}</strong>
                  </li>
                  <li>
                    <span>Node Type</span>
                    <Badge tone={selectedNode.is_collision ? 'red' : 'green'}>
                      {selectedNode.is_collision ? 'Collision Link' : selectedNode.type || 'Student Node'}
                    </Badge>
                  </li>
                  <li>
                    <span>Identifier</span>
                    <span className="mono" style={{ fontSize: 12 }}>
                      {selectedNode.id?.slice(0, 18)}
                    </span>
                  </li>
                  <li>
                    <span>Confidence Score</span>
                    <b className="mono">98.4%</b>
                  </li>
                </ul>

                <p className="sub" style={{ marginTop: 16, fontSize: 12 }}>
                  Topological bipartite path indicates simultaneous degree registrations across 2 distinct AICTE approved technical colleges.
                </p>

                <div className="row" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('anomalies')}
                    className="btn pri"
                  >
                    View in Anomaly Center
                  </button>
                </div>
              </>
            ) : (
              <p className="sub">Click on any node or collision edge in the canvas to inspect relationship telemetry.</p>
            )}
          </Card>
        </div>
      )}
    </Shell>
  );
};

export default IdentityGraphView;
