"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { Loader2, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const FAITH_LEVELS = [
  { name: "Seed 🌰", min: 0, max: 79, color: "#a16207" },
  { name: "Sapling 🌱", min: 80, max: 219, color: "#15803d" },
  { name: "Young Tree 🌿", min: 220, max: 399, color: "#0f766e" },
  { name: "Growing Tree 🌿", min: 400, max: 599, color: "#0f766e" },
  { name: "Strong Tree 🌲", min: 600, max: 999, color: "#1d4ed8" },
  { name: "Mighty Oak 🌳", min: 1000, max: Infinity, color: "#7c3aed" },
];

interface BadgeCount { name: string; count: number; icon: string; }

export default function AdminBadgesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [levelDist, setLevelDist] = useState<{ name: string; count: number; color: string }[]>([]);
  const [topBadges, setTopBadges] = useState<BadgeCount[]>([]);
  const [nearLevelUp, setNearLevelUp] = useState<{ name: string; class_name: string; current_pts: number; next_at: number; gap: number }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: students } = await supabase
      .from("students")
      .select("id, name, badges, activities(points), teacher_classes(class_name)");

    if (students) {
      // Faith Level distribution
      const dist = FAITH_LEVELS.map((lvl) => ({ name: lvl.name, count: 0, color: lvl.color }));
      const badgeFreq: Record<string, number> = {};
      const nearList: typeof nearLevelUp = [];

      students.forEach((s: any) => {
        const pts = (s.activities || []).reduce((sum: number, a: any) => sum + (a.points || 0), 0);

        // Level assignment
        for (let i = FAITH_LEVELS.length - 1; i >= 0; i--) {
          if (pts >= FAITH_LEVELS[i].min) { dist[i].count++; break; }
        }

        // Near level up
        for (const lvl of FAITH_LEVELS) {
          if (pts < lvl.min) {
            const gap = lvl.min - pts;
            if (gap <= 30) {
              nearList.push({
                name: s.name,
                class_name: s.teacher_classes?.class_name || "—",
                current_pts: pts,
                next_at: lvl.min,
                gap,
              });
            }
            break;
          }
        }

        // Badge frequency
        (s.badges || []).forEach((b: string) => {
          badgeFreq[b] = (badgeFreq[b] || 0) + 1;
        });
      });

      setLevelDist(dist.filter((d) => d.count > 0));
      setNearLevelUp(nearList.sort((a, b) => a.gap - b.gap).slice(0, 15));

      // Top 10 most earned badges
      const topB = Object.entries(badgeFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({ name: id.replace(/-/g, " "), count, icon: "🏅" }));
      setTopBadges(topB);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "2rem", margin: "0 0 4px 0", color: "#0f172a" }}>
          Badges &amp; Faith Tree
        </h1>
        <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
          Faith Tree level distribution, badge achievements, and students close to leveling up
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "50px", textAlign: "center", color: "#0f766e" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Loading badge data...</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            {/* Faith Level Distribution */}
            {levelDist.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
                <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 18px 0", color: "#0f172a" }}>
                  🌳 Faith Tree Distribution
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={levelDist} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} formatter={(v) => [`${v ?? 0} students`, "Count"]} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {levelDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Badges */}
            {topBadges.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
                <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 18px 0", color: "#0f172a" }}>
                  🏅 Most Earned Badges
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {topBadges.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#94a3b8", width: "20px" }}>#{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", textTransform: "capitalize" }}>{b.name}</span>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#7c3aed" }}>{b.count} students</span>
                        </div>
                        <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#7c3aed", borderRadius: "999px", width: `${Math.min(100, (b.count / (topBadges[0]?.count || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Near Level Up */}
          {nearLevelUp.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 28px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
              <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 16px 0", color: "#0f172a" }}>
                🔥 Students Close to Leveling Up (within 30 pts)
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                {nearLevelUp.map((s, i) => (
                  <div key={i} style={{ padding: "14px 16px", borderRadius: "14px", background: "linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)", border: "1px solid #fde68a" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>{s.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#78716c", marginBottom: "8px" }}>{s.class_name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                      <span style={{ color: "#b45309", fontWeight: 700 }}>{s.current_pts} pts</span>
                      <span style={{ color: "#92400e", fontWeight: 800 }}>+{s.gap} to level up! 🚀</span>
                    </div>
                    <div style={{ height: "6px", background: "rgba(180,83,9,0.15)", borderRadius: "999px", marginTop: "8px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#f59e0b", borderRadius: "999px", width: `${Math.min(100, (s.current_pts / s.next_at) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
