"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import {
  Users,
  Search,
  ShieldCheck,
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Church
} from "lucide-react";

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher";
  created_at: string;
  class_count: number;
  church_id: string | null;
  church_name: string | null;
}

interface ChurchOption {
  id: string;
  name: string;
}

export default function AdminTeachersPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [filterRole, setFilterRole] = useState<"all" | "teacher" | "admin">("all");
  const [filterChurch, setFilterChurch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ title: string; type: "success" | "error" } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const showToast = (title: string, type: "success" | "error") => {
    setToast({ title, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch churches for the filter dropdown
    const { data: churchData } = await supabase
      .from("churches")
      .select("id, name")
      .order("name");
    if (churchData) setChurches(churchData);

    // Fetch teachers with their class count
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*, teacher_classes(id, church_id, churches(name))")
      .order("created_at", { ascending: false });

    if (profiles) {
      const formatted: TeacherProfile[] = profiles.map((p: any) => {
        const classes = p.teacher_classes || [];
        // Determine the church from the first class they own
        const firstClassWithChurch = classes.find((c: any) => c.church_id);
        return {
          id: p.id,
          name: p.name || p.email.split("@")[0],
          email: p.email,
          role: p.role || "teacher",
          created_at: p.created_at,
          class_count: classes.length,
          church_id: firstClassWithChurch?.church_id || null,
          church_name: firstClassWithChurch?.churches?.name || null,
        };
      });
      setTeachers(formatted);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (userId: string, newRole: "admin" | "teacher") => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      showToast(`Failed to update role: ${error.message}`, "error");
    } else {
      setTeachers((prev) =>
        prev.map((t) => (t.id === userId ? { ...t, role: newRole } : t))
      );
      showToast(`Role updated to ${newRole.toUpperCase()}!`, "success");
    }
    setUpdatingId(null);
  };

  const handleChurchAssign = async (userId: string, churchId: string) => {
    setUpdatingId(userId);
    // Assign this teacher's classes to the selected church
    const { error } = await supabase
      .from("teacher_classes")
      .update({ church_id: churchId || null })
      .eq("user_id", userId);

    if (error) {
      showToast(`Failed to assign church: ${error.message}`, "error");
    } else {
      const churchName = churches.find((c) => c.id === churchId)?.name || null;
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === userId
            ? { ...t, church_id: churchId || null, church_name: churchName }
            : t
        )
      );
      showToast(churchId ? `Assigned to ${churchName}!` : "Church removed.", "success");
    }
    setUpdatingId(null);
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesRole = filterRole === "all" || t.role === filterRole;
    const matchesChurch =
      filterChurch === "all" ||
      (filterChurch === "none" ? !t.church_id : t.church_id === filterChurch);
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesChurch && matchesSearch;
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          display: "flex", alignItems: "center", gap: "8px",
          padding: "12px 18px", borderRadius: "14px",
          background: toast.type === "success" ? "#d1fae5" : "#fee2e2",
          color: toast.type === "success" ? "#065f46" : "#991b1b",
          boxShadow: "0 12px 28px -4px rgba(15,118,110,0.18)",
          fontWeight: 600, fontSize: "0.9rem",
          border: `1px solid ${toast.type === "success" ? "#6ee7b7" : "#fca5a5"}`
        }}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.title}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "'Baloo 2', cursive", fontSize: "2rem", margin: "0 0 4px 0",
          color: "var(--text-main, #0f172a)", lineHeight: 1.1
        }}>
          Teachers &amp; Staff
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
          Manage accounts, church assignments, and administrative roles
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
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "12px",
          alignItems: "center", marginBottom: "24px"
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "320px" }}>
            <Search size={16} style={{
              position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: "var(--text-muted, #64748b)"
            }} />
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 36px",
                borderRadius: "12px", border: "1.5px solid var(--card-border, #e2e8f0)",
                fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
          </div>

          {/* Role filter pills */}
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { label: "All", value: "all" },
              { label: "Teachers", value: "teacher" },
              { label: "Admins", value: "admin" },
            ].map((f) => (
              <button key={f.value} onClick={() => setFilterRole(f.value as any)} style={{
                padding: "7px 14px", borderRadius: "999px", fontSize: "0.82rem",
                fontWeight: 700, cursor: "pointer", border: "none",
                background: filterRole === f.value ? "var(--primary, #0f766e)" : "var(--card-surface-alt, #f1f5f9)",
                color: filterRole === f.value ? "#fff" : "var(--text-muted, #64748b)",
              }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Church filter dropdown */}
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
            {filteredTeachers.length} record{filteredTeachers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--primary, #0f766e)" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading staff roster...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
            No teachers match your filters.
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
                  <th style={{ padding: "10px 14px" }}>Staff Member</th>
                  <th style={{ padding: "10px 14px" }}>Email</th>
                  <th style={{ padding: "10px 14px" }}>Church Assignment</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>Classes</th>
                  <th style={{ padding: "10px 14px" }}>Joined</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Authority Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--card-border, #e2e8f0)" }}>
                    {/* Name + Role Badge */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "34px", height: "34px", borderRadius: "10px",
                          background: t.role === "admin" ? "#fee2e2" : "var(--primary-surface, #ccfbf1)",
                          color: t.role === "admin" ? "#991b1b" : "var(--primary, #0f766e)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {t.role === "admin" ? <ShieldCheck size={16} /> : <GraduationCap size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-main, #0f172a)" }}>{t.name}</div>
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase",
                            padding: "1px 6px", borderRadius: "999px",
                            background: t.role === "admin" ? "#fee2e2" : "var(--primary-surface, #ccfbf1)",
                            color: t.role === "admin" ? "#991b1b" : "var(--primary, #0f766e)"
                          }}>
                            {t.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "12px 14px", color: "var(--text-muted, #64748b)", fontSize: "0.84rem" }}>
                      {t.email}
                    </td>

                    {/* Church Assignment dropdown */}
                    <td style={{ padding: "12px 14px" }}>
                      {churches.length > 0 ? (
                        <select
                          value={t.church_id || ""}
                          disabled={updatingId === t.id}
                          onChange={(e) => handleChurchAssign(t.id, e.target.value)}
                          style={{
                            padding: "6px 10px", borderRadius: "8px",
                            border: "1.5px solid var(--card-border, #e2e8f0)",
                            fontSize: "0.82rem", fontWeight: 600,
                            background: "#fff", cursor: "pointer", outline: "none",
                            maxWidth: "180px"
                          }}
                        >
                          <option value="">— No church —</option>
                          {churches.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: "var(--text-muted, #64748b)", fontSize: "0.82rem" }}>
                          {t.church_name || "—"}
                        </span>
                      )}
                    </td>

                    {/* Class count */}
                    <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700 }}>
                      {t.class_count}
                    </td>

                    {/* Joined date */}
                    <td style={{ padding: "12px 14px", color: "var(--text-muted, #64748b)", fontSize: "0.82rem" }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    {/* Role switcher */}
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <select
                        value={t.role}
                        disabled={updatingId === t.id}
                        onChange={(e) => handleRoleChange(t.id, e.target.value as any)}
                        style={{
                          padding: "6px 10px", borderRadius: "8px",
                          border: "1.5px solid var(--card-border, #e2e8f0)",
                          fontSize: "0.85rem", fontWeight: 700,
                          background: "#fff", cursor: "pointer", outline: "none"
                        }}
                      >
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
