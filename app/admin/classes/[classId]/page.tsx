"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  CalendarDays,
  Sparkles,
  BookOpen,
  Download,
  ExternalLink,
  Loader2,
  Sprout,
  TreePine,
  Award,
  CheckCircle2,
  Clock,
  Church
} from "lucide-react";

interface ClassDetail {
  id: string;
  class_name: string;
  join_code: string;
  created_at: string;
  teacher_name: string;
  teacher_email: string;
  church_name: string;
}

interface StudentRecord {
  id: string;
  name: string;
  group_name: string;
  joined_at: string;
  total_points: number;
  activities_count: number;
}

interface ActivityRecord {
  id: string;
  student_name: string;
  kind: string;
  points: number;
  label: string;
  date: string;
}

interface QuizRecord {
  id: string;
  title: string;
  points_per_correct: number;
  created_at: string;
  question_count: number;
}

export default function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"roster" | "attendance" | "points" | "quizzes">("roster");

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);

  const fetchClassDetails = useCallback(async () => {
    setLoading(true);

    // Fetch class info
    const { data: cls } = await supabase
      .from("teacher_classes")
      .select("*, profiles:user_id(name, email), churches(name)")
      .eq("id", classId)
      .single();

    if (cls) {
      setClassInfo({
        id: cls.id,
        class_name: cls.class_name,
        join_code: cls.join_code,
        created_at: cls.created_at,
        teacher_name: (cls.profiles as any)?.name || (cls.profiles as any)?.email?.split("@")[0] || "Unknown",
        teacher_email: (cls.profiles as any)?.email || "",
        church_name: (cls.churches as any)?.name || "General Ministry",
      });

      // Fetch students with activities
      const { data: stData } = await supabase
        .from("students")
        .select("*, activities(*)")
        .eq("class_id", classId)
        .order("name", { ascending: true });

      if (stData) {
        const studentList: StudentRecord[] = [];
        const allActivities: ActivityRecord[] = [];

        stData.forEach((st: any) => {
          const acts = st.activities || [];
          const pts = acts.reduce((sum: number, a: any) => sum + (a.points || 0), 0);

          studentList.push({
            id: st.id,
            name: st.name,
            group_name: st.group_name || "General",
            joined_at: st.joined_at,
            total_points: pts,
            activities_count: acts.length,
          });

          acts.forEach((a: any) => {
            allActivities.push({
              id: a.id,
              student_name: st.name,
              kind: a.kind,
              points: a.points,
              label: a.label,
              date: a.date,
            });
          });
        });

        setStudents(studentList);
        setActivities(allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }

      // Fetch quizzes
      const { data: qData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (qData) {
        setQuizzes(
          qData.map((q: any) => ({
            id: q.id,
            title: q.title,
            points_per_correct: q.points_per_correct || 10,
            created_at: q.created_at,
            question_count: Array.isArray(q.questions) ? q.questions.length : 0,
          }))
        );
      }
    }

    setLoading(false);
  }, [classId, supabase]);

  useEffect(() => {
    fetchClassDetails();
  }, [fetchClassDetails]);

  const exportClassJSON = () => {
    const dataToExport = {
      classInfo,
      students,
      activities,
      quizzes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FaithQuest-${classInfo?.class_name.replace(/\s+/g, "_")}-Report.json`;
    a.click();
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "var(--primary, #0f766e)" }}>
        <Loader2 size={36} className="animate-spin" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }} />
        <p style={{ fontWeight: 600 }}>Loading class records...</p>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Classroom not found</h2>
        <Link href="/admin/classes" style={{ color: "var(--primary, #0f766e)", fontWeight: 700 }}>
          ← Back to All Classes
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Back link & Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/admin/classes"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--card-border, #e2e8f0)",
              color: "var(--text-main, #0f172a)",
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{
                fontFamily: "'Baloo 2', cursive",
                fontSize: "2rem",
                margin: 0,
                color: "var(--text-main, #0f172a)",
                lineHeight: 1.1
              }}>
                {classInfo.class_name}
              </h1>
              <span style={{
                background: "var(--secondary-surface, #e0f2fe)",
                color: "var(--secondary, #0284c7)",
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 700
              }}>
                {classInfo.join_code}
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748b)", margin: "4px 0 0 0" }}>
              Teacher: <strong>{classInfo.teacher_name}</strong> ({classInfo.teacher_email}) • Church: <strong>{classInfo.church_name}</strong>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={exportClassJSON}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "12px",
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--card-border, #e2e8f0)",
              color: "var(--text-main, #0f172a)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer"
            }}
          >
            <Download size={15} />
            <span>Export Data</span>
          </button>

          <Link
            href={`/teacher/${classInfo.id}`}
            target="_blank"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "12px",
              background: "var(--primary, #0f766e)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
              boxShadow: "var(--clay-btn-shadow, 0 4px 0 #042f2e, 0 8px 15px rgba(15, 118, 110, 0.35))"
            }}
          >
            <span>Open Classroom</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        borderBottom: "1px solid var(--card-border, #e2e8f0)",
        paddingBottom: "10px"
      }}>
        {[
          { key: "roster", label: `Student Roster (${students.length})`, icon: Users },
          { key: "points", label: `Points Ledger (${activities.length})`, icon: Sparkles },
          { key: "attendance", label: "Attendance Summary", icon: CalendarDays },
          { key: "quizzes", label: `Quizzes (${quizzes.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                background: isActive ? "var(--primary, #0f766e)" : "transparent",
                color: isActive ? "#ffffff" : "var(--text-muted, #64748b)",
                transition: "all 0.15s ease"
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Student Roster */}
      {activeTab === "roster" && (
        <div style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: "var(--radius-xl, 28px)",
          padding: "24px",
          boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15, 118, 110, 0.08))",
          border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))"
        }}>
          {students.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              No students enrolled in this class yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--card-border, #e2e8f0)", color: "var(--text-muted, #64748b)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px" }}>Student Name</th>
                    <th style={{ padding: "12px" }}>Group</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Total Points</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Activities</th>
                    <th style={{ padding: "12px" }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr key={st.id} style={{ borderBottom: "1px solid var(--card-border, #e2e8f0)" }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
                        {st.name}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-muted, #64748b)" }}>
                        {st.group_name}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{
                          background: "var(--accent-surface, #fef3c7)",
                          color: "var(--accent-dark, #b45309)",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontWeight: 800,
                          fontSize: "0.82rem"
                        }}>
                          ⭐ {st.total_points}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>
                        {st.activities_count}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-muted, #64748b)", fontSize: "0.85rem" }}>
                        {new Date(st.joined_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Points Ledger */}
      {activeTab === "points" && (
        <div style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: "var(--radius-xl, 28px)",
          padding: "24px",
          boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15, 118, 110, 0.08))",
          border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))"
        }}>
          {activities.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              No activities or point awards recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--card-border, #e2e8f0)", color: "var(--text-muted, #64748b)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px" }}>Date</th>
                    <th style={{ padding: "12px" }}>Student</th>
                    <th style={{ padding: "12px" }}>Award / Activity</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--card-border, #e2e8f0)" }}>
                      <td style={{ padding: "12px", color: "var(--text-muted, #64748b)", fontSize: "0.85rem" }}>
                        {a.date}
                      </td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
                        {a.student_name}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {a.label}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <span style={{ fontWeight: 800, color: a.points >= 0 ? "var(--success, #10b981)" : "#ef4444" }}>
                          {a.points > 0 ? `+${a.points}` : a.points} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attendance Summary */}
      {activeTab === "attendance" && (
        <div style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: "var(--radius-xl, 28px)",
          padding: "24px",
          boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15, 118, 110, 0.08))",
          border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ padding: "20px", background: "var(--card-surface-alt, #f8fafc)", borderRadius: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748b)", fontWeight: 700, textTransform: "uppercase" }}>
                Sunday School Check-ins
              </div>
              <div style={{ fontFamily: "'Baloo 2', cursive", fontSize: "2rem", fontWeight: 800, color: "var(--primary, #0f766e)", marginTop: "6px" }}>
                {activities.filter((a) => a.kind === "attendance").length}
              </div>
            </div>

            <div style={{ padding: "20px", background: "var(--card-surface-alt, #f8fafc)", borderRadius: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748b)", fontWeight: 700, textTransform: "uppercase" }}>
                Outreach Program Check-ins
              </div>
              <div style={{ fontFamily: "'Baloo 2', cursive", fontSize: "2rem", fontWeight: 800, color: "var(--secondary, #0284c7)", marginTop: "6px" }}>
                {activities.filter((a) => a.kind === "outreach").length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Quizzes */}
      {activeTab === "quizzes" && (
        <div style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: "var(--radius-xl, 28px)",
          padding: "24px",
          boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15, 118, 110, 0.08))",
          border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))"
        }}>
          {quizzes.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              No custom quizzes created in this class yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {quizzes.map((q) => (
                <div key={q.id} style={{
                  padding: "16px 20px",
                  borderRadius: "14px",
                  border: "1px solid var(--card-border, #e2e8f0)",
                  background: "var(--card-surface-alt, #f8fafc)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <h3 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.2rem", fontWeight: 700, margin: "0 0 4px 0" }}>
                      {q.title}
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)" }}>
                      {q.question_count} Questions • {q.points_per_correct} pts per correct answer
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)" }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
