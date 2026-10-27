import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Network, AlertTriangle, RefreshCw, Info, Layers } from 'lucide-react';

export const IdentityGraphView: React.FC = () => {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await api.getCrossInstitutionGraph();
      setGraphData(res);
    } catch (err) {
      console.error("Failed to load identity graph", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            <span>Cross-Institution Identity Graph (NetworkX)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Topological bipartite graph modeling Student $\leftrightarrow$ Institution $\leftrightarrow$ Program relationships to expose multi-institution collision clusters.
          </p>
        </div>

        <button
          onClick={loadGraph}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Recompute Topology</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Computing topological network...</div>
      ) : (
        <>
          {/* Graph Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Total Network Nodes</span>
              <div className="text-2xl font-bold text-slate-800 mt-1">{graphData?.total_nodes}</div>
              <span className="text-[11px] text-slate-500">Colleges, Programs & Students</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Relationship Edges</span>
              <div className="text-2xl font-bold text-blue-700 mt-1">{graphData?.total_links}</div>
              <span className="text-[11px] text-slate-500">Enrolment & Offering Edges</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
              <span className="text-xs text-rose-700">Collision Nodes Detected</span>
              <div className="text-2xl font-bold text-rose-700 mt-1">{graphData?.collision_count}</div>
              <span className="text-[11px] text-rose-600">Holding Dual Full-Time Seats</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Connected Collision Clusters</span>
              <div className="text-2xl font-bold text-purple-700 mt-1">{graphData?.collision_clusters?.length || 0}</div>
              <span className="text-[11px] text-purple-600">Multi-College Subgraphs</span>
            </div>
          </div>

          {/* Interactive Visual Graph Canvas Representation */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Network Topology View
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Algorithm: NetworkX Component Clustering</span>
              </div>
              <div className="flex items-center space-x-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0B3B60] border border-cyan-400"></span>
                  Institution
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]"></span>
                  Program
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse"></span>
                  Collision Student
                </span>
              </div>
            </div>

            {/* SVG Network Schematic */}
            <div className="h-96 w-full flex items-center justify-center relative bg-navy-900/60 rounded-xl border border-slate-800/80 p-4">
              <svg className="w-full h-full" viewBox="0 0 800 350">
                {/* Connection lines */}
                <line x1="200" y1="80" x2="400" y2="175" stroke="#E11D48" strokeWidth="2.5" strokeDasharray="4 4" />
                <line x1="600" y1="80" x2="400" y2="175" stroke="#E11D48" strokeWidth="2.5" strokeDasharray="4 4" />

                <line x1="200" y1="80" x2="120" y2="240" stroke="#0D9488" strokeWidth="1.5" />
                <line x1="200" y1="80" x2="280" y2="240" stroke="#0D9488" strokeWidth="1.5" />
                <line x1="600" y1="80" x2="520" y2="240" stroke="#0D9488" strokeWidth="1.5" />
                <line x1="600" y1="80" x2="680" y2="240" stroke="#0D9488" strokeWidth="1.5" />

                {/* Institution 1 (DTU) */}
                <circle cx="200" cy="80" r="36" fill="#0B3B60" stroke="#38BDF8" strokeWidth="2" />
                <text x="200" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">DTU Delhi</text>
                <text x="200" y="93" textAnchor="middle" fill="#94A3B8" fontSize="9">DTU-DELHI</text>

                {/* Institution 2 (KNIT) */}
                <circle cx="600" cy="80" r="36" fill="#0B3B60" stroke="#38BDF8" strokeWidth="2" />
                <text x="600" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">KNIT Sultanpur</text>
                <text x="600" y="93" textAnchor="middle" fill="#94A3B8" fontSize="9">KNIT-SULTANPUR</text>

                {/* Collision Student Node (Sameer Verma) */}
                <circle cx="400" cy="175" r="32" fill="#E11D48" stroke="#FFE4E6" strokeWidth="3" />
                <text x="400" y="172" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">Sameer Verma</text>
                <text x="400" y="186" textAnchor="middle" fill="#FECDD3" fontSize="8" fontFamily="monospace">8839 •••• 4835</text>
                <text x="400" y="222" textAnchor="middle" fill="#F43F5E" fontSize="10" fontWeight="bold">🚨 CRITICAL DUAL SEAT COLLISION</text>

                {/* Program nodes */}
                <circle cx="120" cy="240" r="22" fill="#0D9488" />
                <text x="120" y="244" textAnchor="middle" fill="#FFFFFF" fontSize="8">CSE-BTECH</text>

                <circle cx="280" cy="240" r="22" fill="#0D9488" />
                <text x="280" y="244" textAnchor="middle" fill="#FFFFFF" fontSize="8">ECE-BTECH</text>

                <circle cx="520" cy="240" r="22" fill="#0D9488" />
                <text x="520" y="244" textAnchor="middle" fill="#FFFFFF" fontSize="8">CSE-KNIT</text>

                <circle cx="680" cy="240" r="22" fill="#0D9488" />
                <text x="680" y="244" textAnchor="middle" fill="#FFFFFF" fontSize="8">CIVIL-KNIT</text>
              </svg>
            </div>
          </div>

          {/* Connected Clusters List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Detected Collision Subgraphs</h2>
            <div className="space-y-3">
              {(graphData?.collision_clusters || []).map((cluster: any, idx: number) => (
                <div key={idx} className="p-4 bg-rose-50/40 rounded-xl border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Cluster #{idx + 1}: Multi-Institution Collision Group</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Involved Institutions: <strong>{(cluster.institutions || []).join(" ⟷ ")}</strong>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-xs font-semibold">
                    {cluster.affected_students} Student(s) Involved
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
