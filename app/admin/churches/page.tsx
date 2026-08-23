"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import {
  Church,
  Plus,
  Users,
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ChurchOrg {
  id: string;
  name: string;
  admin_id: string;
  created_at: string;
  teacher_count: number;
  class_count: number;
}

export default function AdminChurchesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [churches, setChurches] = useState<ChurchOrg[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newChurchName, setNewChurchName] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ title: string; type: "success" | "error" } | null>(null);

  const fetchChurches = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("churches")
      .select("*, teacher_classes(id, user_id)")
      .order("created_at", { ascending: false });

    if (data) {
      const formatted = data.map((c: any) => {
        const classes = c.teacher_classes || [];
        const uniqueTeacherIds = new Set(classes.map((cl: any) => cl.user_id));
        return {
          id: c.id,
          name: c.name,
          admin_id: c.admin_id,
          created_at: c.created_at,
          class_count: classes.length,
          teacher_count: uniqueTeacherIds.size,
        };
      });
      setChurches(formatted);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchChurches();
  }, [fetchChurches]);

  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChurchName.trim()) return;
    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from("churches")
      .insert({
        name: newChurchName.trim(),
        admin_id: user.id,
      })
      .select()
      .single();

    if (error) {
      setToast({ title: error.message, type: "error" });
    } else if (data) {
      setToast({ title: `Church "${data.name}" created successfully!`, type: "success" });
      setShowModal(false);
      setNewChurchName("");
      fetchChurches();
    }

    setCreating(false);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 18px",
          borderRadius: "14px",
          background: toast.type === "success" ? "#d1fae5" : "#fee2e2",
          color: toast.type === "success" ? "#065f46" : "#991b1b",
          boxShadow: "var(--shadow-lg, 0 12px 28px -4px rgba(15, 118, 110, 0.12))",
          fontWeight: 600,
          fontSize: "0.9rem",
          border: `1px solid ${toast.type === "success" ? "#6ee7b7" : "#fca5a5"}`
        }}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.title}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "28px"
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: "2rem",
            margin: "0 0 4px 0",
            color: "var(--text-main, #0f172a)",
            lineHeight: 1.1
          }}>
            Churches &amp; Campuses
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
            Manage church organizations, multi-site campuses, and ministry branches
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "var(--primary, #0f766e)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "11px 18px",
            borderRadius: "var(--radius-md, 14px)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "var(--clay-btn-shadow, 0 4px 0 #042f2e, 0 8px 15px rgba(15, 118, 110, 0.35))"
          }}
        >
          <Plus size={18} />
          <span>Add New Church</span>
        </button>
      </div>

      {/* Churches Grid */}
      <div>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "var(--primary, #0f766e)" }}>
            <Loader2 size={32} className="animate-spin" style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading churches...</p>
          </div>
        ) : churches.length === 0 ? (
          <div style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "var(--radius-lg, 20px)",
            padding: "50px 24px",
            textAlign: "center",
            border: "2px dashed var(--card-border, #e2e8f0)",
            boxShadow: "var(--shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.04))"
          }}>
            <Church size={36} color="var(--primary, #0f766e)" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "1.3rem", margin: "0 0 8px 0", color: "var(--text-main, #0f172a)" }}>
              No churches created yet
            </h3>
            <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.9rem", maxWidth: "420px", margin: "0 auto 20px auto" }}>
              Add your main church or ministry organization to group your classrooms and teaching staff.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "var(--primary, #0f766e)",
                color: "#ffffff",
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: "var(--radius-md, 14px)",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={16} />
              <span>Add Your First Church</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {churches.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "var(--card-bg, #ffffff)",
                  borderRadius: "var(--radius-lg, 20px)",
                  padding: "24px",
                  boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15, 118, 110, 0.08))",
                  border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "var(--primary-surface, #ccfbf1)",
                      color: "var(--primary, #0f766e)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Church size={22} />
                    </div>
                    <div>
                      <h3 style={{
                        fontFamily: "'Baloo 2', cursive",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "var(--text-main, #0f172a)",
                        margin: 0
                      }}>
                        {c.name}
                      </h3>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)" }}>
                        Added {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginTop: "16px",
                    padding: "12px",
                    background: "var(--card-surface-alt, #f8fafc)",
                    borderRadius: "12px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-main, #0f172a)" }}>
                      <Users size={16} color="var(--primary, #0f766e)" />
                      <span>{c.teacher_count} Teachers</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-main, #0f172a)" }}>
                      <GraduationCap size={16} color="#3b82f6" />
                      <span>{c.class_count} Classes</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Church Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "var(--radius-xl, 28px)",
            padding: "32px 28px",
            width: "100%",
            maxWidth: "460px",
            boxShadow: "var(--shadow-xl, 0 20px 35px -6px rgba(15, 118, 110, 0.18))"
          }}>
            <h2 style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: "1.6rem",
              fontWeight: 800,
              margin: "0 0 6px 0",
              color: "var(--text-main, #0f172a)"
            }}>
              Add New Church
            </h2>
            <p style={{
              fontSize: "0.9rem",
              color: "var(--text-muted, #64748b)",
              margin: "0 0 20px 0"
            }}>
              Enter the church or campus name (e.g. &ldquo;Grace Community Church - Main Campus&rdquo;)
            </p>

            <form onSubmit={handleCreateChurch}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-main, #0f172a)",
                  marginBottom: "8px"
                }}>
                  Church Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newChurchName}
                  onChange={(e) => setNewChurchName(e.target.value)}
                  placeholder="e.g. Faith Fellowship Church"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md, 14px)",
                    border: "1.5px solid var(--card-border, #e2e8f0)",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "var(--radius-md, 14px)",
                    background: "var(--card-surface-alt, #f8fafc)",
                    border: "1px solid var(--card-border, #e2e8f0)",
                    color: "var(--text-muted, #64748b)",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newChurchName.trim()}
                  style={{
                    padding: "12px 22px",
                    borderRadius: "var(--radius-md, 14px)",
                    background: "var(--primary, #0f766e)",
                    color: "#ffffff",
                    fontWeight: 700,
                    border: "none",
                    cursor: creating ? "not-allowed" : "pointer",
                    boxShadow: "var(--clay-btn-shadow, 0 4px 0 #042f2e, 0 8px 15px rgba(15, 118, 110, 0.35))"
                  }}
                >
                  {creating ? "Creating..." : "Save Church"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
