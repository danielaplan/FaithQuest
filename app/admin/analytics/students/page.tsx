"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { Users, Search, Loader2, Church, GraduationCap, Sprout, Leaf, TreePine, Star } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  group_name: string;
  class_name: string;
  teacher_name: string;
  church_name: string;
  total_points: number;
  badge_count: number;
  faith_level: string;
  faith_icon: string;
  joined_at: string;
}

function getFaithLevel(pts: number) {
  if (pts >= 1000) return { name: "Mighty Oak", icon: "🌳" };
  if (pts >= 600) return { name: "Strong Tree", icon: "🌲" };
  if (pts >= 400) return { name: "Growing Tree", icon: "🌿" };
  if (pts >= 220) return { name: "Young Tree", icon: "🌿" };
  if (pts >= 80) return { name: "Sapling", icon: "🌱" };
  return { name: "Seed", icon: "🌰" };
}

export default function AdminStudentsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterChurch, setFilterChurch] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: churchData } = await supabase.from("churches").select("id, name").order("name");
    if (churchData) setChurches(churchData);

    const { data } = await supabase
      .from("students")
      .select(`
        id, name, group_name, joined_at, badges, activities(points),
        teacher_classes(class_name, churches(name), profiles:user_id(name, email))
      `)
      .order("name");

    if (data) {
      const rows: StudentRow[] = data.map((s: any) => {
        const acts = s.activities || [];
        const pts = acts.reduce((sum: number, a: any) => sum + (a.points || 0), 0);
        const level = getFaithLevel(pts);
        const cls = s.teacher_classes;
        return {
          id: s.id,
          name: s.name,
          group_name: s.group_name || "General",
          class_name: cls?.class_name || "—",
          teacher_name: cls?.profiles?.name || cls?.profiles?.email?.split("@")[0] || "—",
          church_name: cls?.churches?.name || "—",
          total_points: pts,
          badge_count: Array.isArray(s.badges) ? s.badges.length : 0,
          faith_level: level.name,
          faith_icon: level.icon,
          joined_at: s.joined_at,
        };
      });
      setStudents(rows);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.class_name.toLowerCase().includes(search.toLowerCase());
    const matchChurch = filterChurch === "all" || s.church_name === filterChurch;
    const matchLevel = filterLevel === "all" || s.faith_level === filterLevel;
    return matchSearch && matchChurch && matchLevel;
  });

  const levels = ["Seed", "Sapling", "Young Tree", "Growing Tree", "Strong Tree", "Mighty Oak"];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "2rem", margin: "0 0 4px 0", color: "var(--text-main, #0f172a)" }}>
          All Students
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
          Every enrolled student across all churches, classes, and teachers — {students.length} total
        </p>
      </div>

      <div style={{
        background: "#fff", borderRadius: "24px", padding: "24px 28px",
        boxShadow: "0 6px 16px -2px rgba(15,118,110,0.08)",
        border: "1px solid rgba(15,118,110,0.10)"
      }}>
        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "22px" }}>
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "300px" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text" placeholder="Search student or class..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 34px", borderRadius: "10px",
                border: "1.5px solid #e2e8f0", fontSize: "0.86rem", outline: "none",
                boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
          </div>
          {churches.length > 0 && (
            <select value={filterChurch} onChange={(e) => setFilterChurch(e.target.value)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "0.84rem", fontWeight: 600, background: "#fff", outline: "none" }}>
              <option value="all">All Churches</option>
              {churches.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "0.84rem", fontWeight: 600, background: "#fff", outline: "none" }}>
            <option value="all">All Faith Levels</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#0f766e" }}>
            <Loader2 size={30} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading students...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "9px 12px" }}>Student</th>
                  <th style={{ padding: "9px 12px" }}>Class</th>
                  <th style={{ padding: "9px 12px" }}>Church</th>
                  <th style={{ padding: "9px 12px" }}>Faith Level</th>
                  <th style={{ padding: "9px 12px", textAlign: "center" }}>Points</th>
                  <th style={{ padding: "9px 12px", textAlign: "center" }}>Badges</th>
                  <th style={{ padding: "9px 12px" }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b" }}>{s.group_name} · {s.teacher_name}</div>
                    </td>
                    <td style={{ padding: "11px 12px", color: "#475569", fontWeight: 600 }}>{s.class_name}</td>
                    <td style={{ padding: "11px 12px", color: "#64748b", fontSize: "0.82rem" }}>{s.church_name}</td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 700 }}>
                        <span>{s.faith_icon}</span>
                        <span style={{ color: "#0f766e" }}>{s.faith_level}</span>
                      </span>
                    </td>
                    <td style={{ padding: "11px 12px", textAlign: "center" }}>
                      <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "999px", fontWeight: 800, fontSize: "0.8rem" }}>
                        ⭐ {s.total_points}
                      </span>
                    </td>
                    <td style={{ padding: "11px 12px", textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>
                      {s.badge_count}
                    </td>
                    <td style={{ padding: "11px 12px", color: "#94a3b8", fontSize: "0.78rem" }}>
                      {new Date(s.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No students match your filters.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
