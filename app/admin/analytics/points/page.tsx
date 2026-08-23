"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { Loader2, Trophy, Sparkles } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

interface LeaderEntry {
  rank: number;
  name: string;
  class_name: string;
  church_name: string;
  total_points: number;
  faith_icon: string;
}

interface ActivityBreakdown {
  name: string;
  value: number;
  color: string;
}

function getFaithIcon(pts: number) {
  if (pts >= 1000) return "🌳";
  if (pts >= 600) return "🌲";
  if (pts >= 400) return "🌿";
  if (pts >= 220) return "🌿";
  if (pts >= 80) return "🌱";
  return "🌰";
}

const KIND_META: Record<string, { label: string; color: string }> = {
  attendance: { label: "Sunday School", color: "#0f766e" },
  outreach: { label: "Outreach", color: "#0284c7" },
  verse: { label: "Bible Verse", color: "#7c3aed" },
  quiz: { label: "Quiz", color: "#d97706" },
  discussion: { label: "Discussion", color: "#db2777" },
  bible: { label: "Bible Study", color: "#059669" },
  event: { label: "Event", color: "#dc2626" },
  helping: { label: "Helping", color: "#ea580c" },
  custom: { label: "Custom", color: "#6366f1" },
};

export default function AdminPointsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [breakdown, setBreakdown] = useState<ActivityBreakdown[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: students } = await supabase
      .from("students")
      .select("id, name, activities(points, kind), teacher_classes(class_name, churches(name))");

    if (students) {
      const entries: LeaderEntry[] = students.map((s: any) => {
        const acts = s.activities || [];
        const pts = acts.reduce((sum: number, a: any) => sum + (a.points || 0), 0);
        return {
          rank: 0,
          name: s.name,
          class_name: s.teacher_classes?.class_name || "—",
          church_name: s.teacher_classes?.churches?.name || "—",
          total_points: pts,
          faith_icon: getFaithIcon(pts),
        };
      }).sort((a, b) => b.total_points - a.total_points).map((e, i) => ({ ...e, rank: i + 1 }));

      setLeaderboard(entries);

      // Activity breakdown
      const kindTotals: Record<string, number> = {};
      students.forEach((s: any) => {
        (s.activities || []).forEach((a: any) => {
          kindTotals[a.kind] = (kindTotals[a.kind] || 0) + (a.points || 0);
        });
      });

      const bkd: ActivityBreakdown[] = Object.entries(kindTotals)
        .map(([kind, value]) => ({
          name: KIND_META[kind]?.label || kind,
          value,
          color: KIND_META[kind]?.color || "#6366f1"
        }))
        .sort((a, b) => b.value - a.value);

      setBreakdown(bkd);
      setTotalPoints(entries.reduce((s, e) => s + e.total_points, 0));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const top10 = leaderboard.slice(0, 10);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "2rem", margin: "0 0 4px 0", color: "#0f172a" }}>
          Points &amp; Leaderboard
        </h1>
        <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
          Global student rankings and activity point breakdown across all classes
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "50px", textAlign: "center", color: "#0f766e" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Loading points data...</p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "28px" }}>
            {[
              { label: "Total Points Awarded", value: totalPoints.toLocaleString(), color: "#7c3aed", bg: "#ede9fe" },
              { label: "Students Ranked", value: leaderboard.length, color: "#0f766e", bg: "#ccfbf1" },
              { label: "Top Score", value: leaderboard[0]?.total_points.toLocaleString() || "0", color: "#b45309", bg: "#fef3c7" },
              { label: "Activity Types", value: breakdown.length, color: "#0284c7", bg: "#e0f2fe" },
            ].map((k) => (
              <div key={k.label} style={{ background: "#fff", borderRadius: "16px", padding: "16px 18px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
                <div style={{ fontSize: "1.8rem", fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            {/* Top 10 Bar Chart */}
            {top10.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
                <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 18px 0", color: "#0f172a" }}>
                  🏆 Top 10 Students
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top10} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} formatter={(v) => [`${v} pts`, "Points"]} />
                    <Bar dataKey="total_points" radius={[0, 6, 6, 0]}>
                      {top10.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#0f766e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Activity Breakdown Pie */}
            {breakdown.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
                <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 18px 0", color: "#0f172a" }}>
                  ⚡ Points by Activity Type
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                      {breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} formatter={(v) => [`${v} pts`, ""]} />
                    <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ fontSize: "0.78rem", color: "#475569" }}>{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Full Global Leaderboard */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 28px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
            <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 16px 0", color: "#0f172a" }}>
              Global Leaderboard — All {leaderboard.length} Students
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <th style={{ padding: "9px 12px" }}>Rank</th>
                    <th style={{ padding: "9px 12px" }}>Student</th>
                    <th style={{ padding: "9px 12px" }}>Class</th>
                    <th style={{ padding: "9px 12px" }}>Church</th>
                    <th style={{ padding: "9px 12px", textAlign: "right" }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((e) => (
                    <tr key={e.rank} style={{ borderBottom: "1px solid #f1f5f9", background: e.rank <= 3 ? (e.rank === 1 ? "#fffbeb" : e.rank === 2 ? "#f8fafc" : "#fff7ed") : "transparent" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 800, fontSize: "1rem", color: e.rank === 1 ? "#f59e0b" : e.rank === 2 ? "#94a3b8" : e.rank === 3 ? "#b45309" : "#cbd5e1" }}>
                          {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{e.faith_icon} {e.name}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{e.class_name}</td>
                      <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "0.82rem" }}>{e.church_name}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{ fontWeight: 800, color: "#0f766e", fontSize: "0.9rem" }}>⭐ {e.total_points.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leaderboard.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No points recorded yet.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
