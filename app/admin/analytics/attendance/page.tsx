"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { Loader2, CalendarDays, TrendingUp, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

interface ClassAttendance {
  class_name: string;
  teacher_name: string;
  sunday_count: number;
  outreach_count: number;
  total: number;
  rate: string;
}

interface WeeklyData {
  week: string;
  "Sunday School": number;
  Outreach: number;
}

export default function AdminAttendancePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassAttendance[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [totalSunday, setTotalSunday] = useState(0);
  const [totalOutreach, setTotalOutreach] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Get all attendance activities
    const { data: activities } = await supabase
      .from("activities")
      .select("kind, date, points, students(class_id, teacher_classes(class_name, profiles:user_id(name, email)))")
      .in("kind", ["attendance", "outreach"])
      .order("date", { ascending: true });

    if (activities) {
      // Weekly aggregation (last 8 weeks)
      const weekMap: Record<string, { sunday: number; outreach: number }> = {};
      const classMap: Record<string, { class_name: string; teacher_name: string; sunday: number; outreach: number; student_count: number }> = {};

      activities.forEach((a: any) => {
        // Weekly
        const d = new Date(a.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!weekMap[weekKey]) weekMap[weekKey] = { sunday: 0, outreach: 0 };
        if (a.kind === "attendance") weekMap[weekKey].sunday++;
        if (a.kind === "outreach") weekMap[weekKey].outreach++;

        // Per class
        const classId = a.students?.class_id;
        if (classId) {
          if (!classMap[classId]) {
            classMap[classId] = {
              class_name: a.students?.teacher_classes?.class_name || "—",
              teacher_name: a.students?.teacher_classes?.profiles?.name || a.students?.teacher_classes?.profiles?.email?.split("@")[0] || "—",
              sunday: 0, outreach: 0, student_count: 0
            };
          }
          if (a.kind === "attendance") classMap[classId].sunday++;
          if (a.kind === "outreach") classMap[classId].outreach++;
        }
      });

      // Build weekly chart data (last 8 weeks)
      const weeks = Object.keys(weekMap).slice(-8);
      setWeeklyData(weeks.map((w) => ({
        week: w,
        "Sunday School": weekMap[w].sunday,
        "Outreach": weekMap[w].outreach,
      })));

      // Build class table
      const rows: ClassAttendance[] = Object.values(classMap).map((c) => ({
        class_name: c.class_name,
        teacher_name: c.teacher_name,
        sunday_count: c.sunday,
        outreach_count: c.outreach,
        total: c.sunday + c.outreach,
        rate: `${c.sunday + c.outreach} check-ins`,
      })).sort((a, b) => b.total - a.total);

      setClassData(rows);

      const ts = activities.filter((a: any) => a.kind === "attendance").length;
      const to = activities.filter((a: any) => a.kind === "outreach").length;
      setTotalSunday(ts);
      setTotalOutreach(to);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "2rem", margin: "0 0 4px 0", color: "#0f172a" }}>
          Attendance Analytics
        </h1>
        <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
          Sunday School vs Outreach check-ins across all classes
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "50px", textAlign: "center", color: "#0f766e" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Loading attendance data...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {[
              { label: "Sunday School Check-ins", value: totalSunday, color: "#0f766e", bg: "#ccfbf1" },
              { label: "Outreach Check-ins", value: totalOutreach, color: "#0284c7", bg: "#e0f2fe" },
              { label: "Total Check-ins", value: totalSunday + totalOutreach, color: "#7c3aed", bg: "#ede9fe" },
              { label: "Active Classes", value: classData.length, color: "#b45309", bg: "#fef3c7" },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: "#fff", borderRadius: "18px", padding: "18px 20px",
                boxShadow: "0 4px 12px rgba(15,118,110,0.07)",
                border: "1px solid rgba(15,118,110,0.09)"
              }}>
                <div style={{ fontSize: "1.9rem", fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Weekly Bar Chart */}
          {weeklyData.length > 0 && (
            <div style={{
              background: "#fff", borderRadius: "20px", padding: "24px 28px",
              boxShadow: "0 4px 12px rgba(15,118,110,0.07)",
              border: "1px solid rgba(15,118,110,0.09)", marginBottom: "24px"
            }}>
              <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.25rem", margin: "0 0 20px 0", color: "#0f172a" }}>
                Weekly Attendance Trend
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="Sunday School" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Outreach" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per Class Table */}
          <div style={{
            background: "#fff", borderRadius: "20px", padding: "24px 28px",
            boxShadow: "0 4px 12px rgba(15,118,110,0.07)",
            border: "1px solid rgba(15,118,110,0.09)"
          }}>
            <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.25rem", margin: "0 0 20px 0", color: "#0f172a" }}>
              Attendance by Class
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <th style={{ padding: "9px 12px" }}>Class</th>
                    <th style={{ padding: "9px 12px" }}>Teacher</th>
                    <th style={{ padding: "9px 12px", textAlign: "center" }}>Sunday School</th>
                    <th style={{ padding: "9px 12px", textAlign: "center" }}>Outreach</th>
                    <th style={{ padding: "9px 12px", textAlign: "center" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {classData.map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "11px 12px", fontWeight: 700, color: "#0f172a" }}>{c.class_name}</td>
                      <td style={{ padding: "11px 12px", color: "#64748b" }}>{c.teacher_name}</td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <span style={{ background: "#ccfbf1", color: "#065f46", padding: "2px 8px", borderRadius: "999px", fontWeight: 700, fontSize: "0.8rem" }}>{c.sunday_count}</span>
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "999px", fontWeight: 700, fontSize: "0.8rem" }}>{c.outreach_count}</span>
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "center", fontWeight: 800, color: "#0f172a" }}>{c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {classData.length === 0 && (
                <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No attendance records yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
