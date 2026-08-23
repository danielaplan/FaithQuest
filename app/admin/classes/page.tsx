"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import {
  GraduationCap,
  Search,
  Users,
  ExternalLink,
  Loader2,
  X,
  Eye,
  Church,
  ChevronRight
} from "lucide-react";

interface ClassItem {
  id: string;
  class_name: string;
  join_code: string;
  created_at: string;
  teacher_name: string;
  teacher_email: string;
  student_count: number;
  church_id: string | null;
  church_name: string | null;
}

interface StudentItem {
  id: string;
  name: string;
  group_name: string;
  joined_at: string;
}

interface ChurchOption {
  id: string;
  name: string;
}

export default function AdminClassesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChurch, setFilterChurch] = useState("all");
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [roster, setRoster] = useState<StudentItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: churchData } = await supabase
      .from("churches")
      .select("id, name")
      .order("name");
    if (churchData) setChurches(churchData);

    const { data } = await supabase
      .from("teacher_classes")
      .select("*, profiles:user_id(name, email), students(id), churches(name)")
      .order("created_at", { ascending: false });

    if (data) {
      setClasses(data.map((c: any) => ({
        id: c.id,
        class_name: c.class_name,
        join_code: c.join_code,
        created_at: c.created_at,
        teacher_name: c.profiles?.name || c.profiles?.email?.split("@")[0] || "Unknown",
        teacher_email: c.profiles?.email || "",
        student_count: Array.isArray(c.students) ? c.students.length : 0,
        church_id: c.church_id || null,
        church_name: c.churches?.name || null,
      })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInspectRoster = async (cls: ClassItem) => {
    setSelectedClass(cls);
    setLoadingRoster(true);
    const { data } = await supabase
      .from("students")
      .select("id, name, group_name, joined_at")
      .eq("class_id", cls.id)
      .order("name");
    setRoster(data || []);
    setLoadingRoster(false);
  };

  const filteredClasses = classes.filter((c) => {
    const matchesChurch =
      filterChurch === "all" ||
      (filterChurch === "none" ? !c.church_id : c.church_id === filterChurch);
    const matchesSearch =
      c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.join_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChurch && matchesSearch;
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "'Baloo 2', cursive", fontSize: "2rem", margin: "0 0 4px 0",
          color: "var(--text-main, #0f172a)", lineHeight: 1.1
        }}>
          All Classes
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
          Inspect every classroom across all teachers and churches
        </p>
      </div>

      {/* Table Card */}
      <div style={{
        background: "var(--card-bg, #ffffff)",
        borderRadius: "var(--radius-xl, 28px)",
        padding: "24px 28px",
        boxShadow: "var(--shadow-lg, 0 12px 28px -4px rgba(15,118,110,0.12))",
        border: "1px solid var(--card-border-subtle, rgba(15,118,110,0.12))"
      }}>
        {/* Filter Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "340px" }}>
            <Search size={16} style={{
              position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: "var(--text-muted, #64748b)"
            }} />
            <input
              type="text"
              placeholder="Search class, teacher, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 36px",
                borderRadius: "12px", border: "1.5px solid var(--card-border, #e2e8f0)",
                fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
          </div>

          {/* Church filter */}
          {churches.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Church size={16} color="var(--text-muted, #64748b)" />
              <select
                value={filterChurch}
                onChange={(e) => setFilterChurch(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: "10px",
                  border: "1.5px solid var(--card-border, #e2e8f0)",
                  fontSize: "0.85rem", fontWeight: 600,
                  background: "#fff", cursor: "pointer", outline: "none"
                }}
              >
                <option value="all">All Churches</option>
                <option value="none">No Church Assigned</option>
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
            {filteredClasses.length} class{filteredClasses.length !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--primary, #0f766e)" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading classrooms...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
            No classrooms found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
              <thead>
                <tr style={{
                  borderBottom: "2px solid var(--card-border, #e2e8f0)",
                  color: "var(--text-muted, #64748b)",
                  fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em"
                }}>
                  <th style={{ padding: "10px 14px" }}>Class Name</th>
                  <th style={{ padding: "10px 14px" }}>Join Code</th>
                  <th style={{ padding: "10px 14px" }}>Teacher</th>
                  <th style={{ padding: "10px 14px" }}>Church</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>Students</th>
                  <th style={{ padding: "10px 14px" }}>Created</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} style={{ borderBottom: "1px solid var(--card-border, #e2e8f0)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "9px",
                          background: "#fffbeb", color: "#d97706",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <GraduationCap size={16} />
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
                          {cls.class_name}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: "var(--secondary-surface, #e0f2fe)",
                        color: "var(--secondary, #0284c7)",
                        padding: "2px 8px", borderRadius: "999px",
                        fontSize: "0.75rem", fontWeight: 700
                      }}>
                        {cls.join_code}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-main, #0f172a)" }}>{cls.teacher_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>{cls.teacher_email}</div>
                    </td>

                    <td style={{ padding: "12px 14px", color: "var(--text-muted, #64748b)", fontSize: "0.84rem" }}>
                      {cls.church_name ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Church size={13} />
                          {cls.church_name}
                        </span>
                      ) : "—"}
                    </td>

                    <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700 }}>
                      {cls.student_count}
                    </td>

                    <td style={{ padding: "12px 14px", color: "var(--text-muted, #64748b)", fontSize: "0.82rem" }}>
                      {new Date(cls.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleInspectRoster(cls)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "6px 11px", borderRadius: "8px",
                            background: "var(--card-surface-alt, #f1f5f9)",
                            border: "1px solid var(--card-border, #e2e8f0)",
                            color: "var(--text-main, #0f172a)",
                            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          <Eye size={13} />
                          <span>Roster</span>
                        </button>

                        <Link
                          href={`/admin/classes/${cls.id}`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "6px 11px", borderRadius: "8px",
                            background: "var(--primary-surface, #ccfbf1)",
                            color: "var(--primary, #0f766e)",
                            fontSize: "0.8rem", fontWeight: 700, textDecoration: "none"
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight size={13} />
                        </Link>

                        <Link
                          href={`/teacher/${cls.id}`}
                          target="_blank"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "6px 11px", borderRadius: "8px",
                            background: "var(--primary, #0f766e)", color: "#ffffff",
                            fontSize: "0.8rem", fontWeight: 700, textDecoration: "none"
                          }}
                        >
                          <span>Open</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Roster Quick-View Modal */}
      {selectedClass && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", zIndex: 999
        }}>
          <div style={{
            background: "#ffffff", borderRadius: "var(--radius-xl, 28px)",
            padding: "28px", width: "100%", maxWidth: "520px",
            boxShadow: "0 20px 35px -6px rgba(15,118,110,0.18)",
            maxHeight: "80vh", display: "flex", flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{
                  fontFamily: "'Baloo 2', cursive", fontSize: "1.5rem",
                  fontWeight: 800, margin: "0 0 3px 0", color: "var(--text-main, #0f172a)"
                }}>
                  {selectedClass.class_name} Roster
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
                  {selectedClass.student_count} students · Teacher: {selectedClass.teacher_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                style={{
                  background: "var(--card-surface-alt, #f1f5f9)",
                  border: "1px solid var(--card-border, #e2e8f0)",
                  borderRadius: "10px", padding: "6px", cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", margin: "8px 0" }}>
              {loadingRoster ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--primary, #0f766e)" }}>
                  <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 6px auto" }} />
                  <p style={{ margin: 0 }}>Loading roster...</p>
                </div>
              ) : roster.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                  No students enrolled yet.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--card-border, #e2e8f0)", color: "var(--text-muted, #64748b)", fontSize: "0.74rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px" }}>Name</th>
                      <th style={{ padding: "8px 10px" }}>Group</th>
                      <th style={{ padding: "8px 10px" }}>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((st) => (
                      <tr key={st.id} style={{ borderBottom: "1px solid var(--card-border, #e2e8f0)" }}>
                        <td style={{ padding: "9px 10px", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>{st.name}</td>
                        <td style={{ padding: "9px 10px", color: "var(--text-muted, #64748b)" }}>{st.group_name || "General"}</td>
                        <td style={{ padding: "9px 10px", color: "var(--text-muted, #64748b)", fontSize: "0.78rem" }}>{new Date(st.joined_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid var(--card-border, #e2e8f0)", gap: "8px" }}>
              <Link
                href={`/admin/classes/${selectedClass.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "10px 16px", borderRadius: "10px",
                  background: "var(--primary-surface, #ccfbf1)", color: "var(--primary, #0f766e)",
                  fontWeight: 700, fontSize: "0.85rem", textDecoration: "none"
                }}
              >
                <span>Full Class Report</span>
                <ChevronRight size={14} />
              </Link>
              <button
                onClick={() => setSelectedClass(null)}
                style={{
                  padding: "10px 18px", borderRadius: "10px",
                  background: "var(--primary, #0f766e)", color: "#fff",
                  fontWeight: 700, border: "none", cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
