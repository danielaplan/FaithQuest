"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import {
  Church,
  Plus,
  Users,
  LogOut,
  Sparkles,
  BookOpen,
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  GraduationCap
} from "lucide-react";

interface TeacherClass {
  id: string;
  class_name: string;
  join_code: string;
  created_at: string;
  student_count?: number;
}

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/signin");
      return;
    }

    // Fetch profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (prof) {
      setProfile(prof);
    } else {
      setProfile({
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Teacher",
        role: "teacher"
      });
    }

    // Fetch classes
    const { data: classList, error } = await supabase
      .from("teacher_classes")
      .select("*, students(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (classList) {
      const formatted = classList.map((c: any) => ({
        id: c.id,
        class_name: c.class_name,
        join_code: c.join_code,
        created_at: c.created_at,
        student_count: c.students ? c.students[0]?.count || 0 : 0
      }));
      setClasses(formatted);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !profile) return;
    setCreating(true);
    setErrorMsg("");

    // Generate clean join code (e.g. FQ-7294)
    const randomCode = "FQ-" + Math.floor(1000 + Math.random() * 9000);

    const { data, error } = await supabase
      .from("teacher_classes")
      .insert({
        user_id: profile.id,
        class_name: newClassName.trim(),
        join_code: randomCode,
      })
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
      setCreating(false);
    } else if (data) {
      setShowModal(false);
      setNewClassName("");
      setCreating(false);
      // Directly navigate to classroom or reload
      router.push(`/teacher/${data.id}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/signin");
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--canvas-bg, #f0fdf4)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        gap: "12px",
        color: "var(--primary, #0f766e)"
      }}>
        <Loader2 size={36} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontWeight: 600 }}>Loading teacher portal...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--canvas-gradient, #f0fdf4)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: "24px 20px"
    }}>
      {/* Navigation Bar */}
      <header style={{
        maxWidth: "1100px",
        margin: "0 auto 36px auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        background: "var(--card-bg, #ffffff)",
        borderRadius: "var(--radius-lg, 20px)",
        boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15, 118, 110, 0.08))",
        border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "var(--hero-bg, linear-gradient(135deg, #042f2e 0%, #0f766e 100%))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff"
          }}>
            <Church size={24} />
          </div>
          <div>
            <h2 style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: "1.4rem",
              margin: 0,
              color: "var(--text-main, #0f172a)",
              lineHeight: 1.1
            }}>
              FaithQuest
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
              Teacher Dashboard
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
              {profile?.name}
            </span>
            <span style={{
              fontSize: "0.75rem",
              background: "var(--primary-surface, #ccfbf1)",
              color: "var(--primary, #0f766e)",
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              {profile?.role}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign Out"
            style={{
              background: "var(--card-surface-alt, #f8fafc)",
              border: "1px solid var(--card-border, #e2e8f0)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-muted, #64748b)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              transition: "all 0.2s ease"
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Banner */}
        <div style={{
          background: "var(--hero-bg, linear-gradient(135deg, #042f2e 0%, #0f766e 55%, #115e59 100%))",
          borderRadius: "var(--radius-xl, 28px)",
          padding: "36px 32px",
          color: "#ffffff",
          boxShadow: "var(--shadow-xl, 0 20px 35px -6px rgba(15, 118, 110, 0.18))",
          marginBottom: "36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div>
            <span style={{
              background: "rgba(255, 255, 255, 0.18)",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "10px"
            }}>
              <Sparkles size={14} /> Ministry Workspace
            </span>
            <h1 style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: "2.2rem",
              fontWeight: 800,
              margin: "0 0 8px 0",
              lineHeight: 1.2
            }}>
              Welcome, {profile?.name}! 👋
            </h1>
            <p style={{ fontSize: "1rem", opacity: 0.9, margin: 0, maxWidth: "560px" }}>
              Select a classroom below to launch projector mode, record attendance, award points, and grow faith trees!
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "var(--accent, #f59e0b)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              padding: "14px 22px",
              borderRadius: "var(--radius-md, 14px)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "var(--clay-btn-shadow-accent, 0 4px 0 #b45309, 0 8px 15px rgba(245, 158, 11, 0.4))",
              transition: "transform 0.1s ease"
            }}
          >
            <Plus size={20} />
            <span>Create New Class</span>
          </button>
        </div>

        {/* Section Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: "1.6rem",
            color: "var(--text-main, #0f172a)",
            margin: 0
          }}>
            Your Classes ({classes.length})
          </h2>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "var(--radius-lg, 20px)",
            padding: "50px 24px",
            textAlign: "center",
            border: "2px dashed var(--card-border, #e2e8f0)",
            boxShadow: "var(--shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.04))"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: "var(--primary-surface, #ccfbf1)",
              color: "var(--primary, #0f766e)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <GraduationCap size={32} />
            </div>
            <h3 style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: "1.3rem",
              margin: "0 0 8px 0",
              color: "var(--text-main, #0f172a)"
            }}>
              No classes created yet
            </h3>
            <p style={{
              color: "var(--text-muted, #64748b)",
              fontSize: "0.95rem",
              maxWidth: "420px",
              margin: "0 auto 24px auto"
            }}>
              Create your first Sunday school, youth group, or outreach class to start enrolling students and tracking activities.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "var(--primary, #0f766e)",
                color: "#ffffff",
                fontWeight: 700,
                padding: "12px 20px",
                borderRadius: "var(--radius-md, 14px)",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "var(--clay-btn-shadow, 0 4px 0 #042f2e, 0 8px 15px rgba(15, 118, 110, 0.35))"
              }}
            >
              <Plus size={18} />
              <span>Create Your First Class</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {classes.map((cls) => (
              <div
                key={cls.id}
                style={{
                  background: "var(--card-bg, #ffffff)",
                  borderRadius: "var(--radius-lg, 20px)",
                  padding: "24px",
                  boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15, 118, 110, 0.08))",
                  border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
              >
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "14px"
                  }}>
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "var(--secondary-surface, #e0f2fe)",
                      color: "var(--secondary, #0284c7)",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      letterSpacing: "0.05em"
                    }}>
                      {cls.join_code}
                    </span>
                    <span style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted, #64748b)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      <Calendar size={13} />
                      {new Date(cls.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: "'Baloo 2', cursive",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "var(--text-main, #0f172a)",
                    margin: "0 0 10px 0",
                    lineHeight: 1.2
                  }}>
                    {cls.class_name}
                  </h3>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-muted, #64748b)",
                    fontSize: "0.9rem",
                    marginBottom: "20px"
                  }}>
                    <Users size={16} color="var(--primary, #0f766e)" />
                    <span>{cls.student_count || 0} Registered Students</span>
                  </div>
                </div>

                <Link
                  href={`/teacher/${cls.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: "var(--radius-md, 14px)",
                    background: "var(--primary, #0f766e)",
                    color: "#ffffff",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "var(--clay-btn-shadow, 0 4px 0 #042f2e, 0 8px 15px rgba(15, 118, 110, 0.35))",
                    boxSizing: "border-box"
                  }}
                >
                  <span>Open Classroom</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Class Modal */}
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
              Create New Class
            </h2>
            <p style={{
              fontSize: "0.9rem",
              color: "var(--text-muted, #64748b)",
              margin: "0 0 20px 0"
            }}>
              Give your class a name (e.g. &ldquo;Sunday School - Primary 1-3&rdquo;, &ldquo;Youth Outreach 2026&rdquo;)
            </p>

            {errorMsg && (
              <div style={{
                padding: "10px 14px",
                background: "var(--danger-surface, #fee2e2)",
                color: "#b91c1c",
                borderRadius: "12px",
                fontSize: "0.85rem",
                marginBottom: "16px"
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateClass}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-main, #0f172a)",
                  marginBottom: "8px"
                }}>
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Junior Youth Ministry"
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
                  disabled={creating || !newClassName.trim()}
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
                  {creating ? "Creating..." : "Create & Launch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
