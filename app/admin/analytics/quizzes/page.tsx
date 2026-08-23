"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { Loader2, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface QuizRow {
  id: string;
  title: string;
  class_name: string;
  teacher_name: string;
  question_count: number;
  points_per_correct: number;
  created_at: string;
}

export default function AdminQuizzesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("quizzes")
      .select("*, teacher_classes(class_name, profiles:user_id(name, email))")
      .order("created_at", { ascending: false });

    if (data) {
      setQuizzes(data.map((q: any) => ({
        id: q.id,
        title: q.title,
        class_name: q.teacher_classes?.class_name || "—",
        teacher_name: q.teacher_classes?.profiles?.name || q.teacher_classes?.profiles?.email?.split("@")[0] || "—",
        question_count: Array.isArray(q.questions) ? q.questions.length : 0,
        points_per_correct: q.points_per_correct || 10,
        created_at: q.created_at,
      })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Bar chart: quiz question counts
  const chartData = quizzes.slice(0, 10).map((q) => ({
    name: q.title.length > 18 ? q.title.slice(0, 18) + "…" : q.title,
    Questions: q.question_count,
    "Max Points": q.question_count * q.points_per_correct,
  }));

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "2rem", margin: "0 0 4px 0", color: "#0f172a" }}>
          Quiz Analytics
        </h1>
        <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
          All quizzes created across every class — {quizzes.length} total
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "50px", textAlign: "center", color: "#0f766e" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Loading quiz data...</p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            {[
              { label: "Total Quizzes", value: quizzes.length, color: "#7c3aed", bg: "#ede9fe" },
              { label: "Total Questions", value: quizzes.reduce((s, q) => s + q.question_count, 0), color: "#d97706", bg: "#fef3c7" },
              { label: "Max Points Available", value: quizzes.reduce((s, q) => s + (q.question_count * q.points_per_correct), 0).toLocaleString(), color: "#0f766e", bg: "#ccfbf1" },
            ].map((k) => (
              <div key={k.label} style={{ background: "#fff", borderRadius: "16px", padding: "16px 18px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
                <div style={{ fontSize: "1.8rem", fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 24px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
              <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 18px 0", color: "#0f172a" }}>
                Quiz Size Comparison (Top 10)
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barGap={4} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="Questions" fill="#7c3aed" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Max Points" fill="#d97706" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quiz Table */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 28px", boxShadow: "0 4px 12px rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.09)" }}>
            <h2 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", margin: "0 0 16px 0", color: "#0f172a" }}>
              All Quizzes
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <th style={{ padding: "9px 12px" }}>Quiz Title</th>
                    <th style={{ padding: "9px 12px" }}>Class</th>
                    <th style={{ padding: "9px 12px" }}>Teacher</th>
                    <th style={{ padding: "9px 12px", textAlign: "center" }}>Questions</th>
                    <th style={{ padding: "9px 12px", textAlign: "center" }}>Pts/Correct</th>
                    <th style={{ padding: "9px 12px", textAlign: "center" }}>Max Points</th>
                    <th style={{ padding: "9px 12px" }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((q) => (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{q.title}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{q.class_name}</td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>{q.teacher_name}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: "999px", fontWeight: 700, fontSize: "0.8rem" }}>{q.question_count}</span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#d97706" }}>{q.points_per_correct}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, color: "#0f766e" }}>{q.question_count * q.points_per_correct}</td>
                      <td style={{ padding: "10px 12px", color: "#94a3b8", fontSize: "0.78rem" }}>{new Date(q.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {quizzes.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>No quizzes created yet.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
