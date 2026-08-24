"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ClassroomPage } from "@/app/page";
import { ArrowLeft, Church, Sparkles } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

export default function TeacherClassroomPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const [className, setClassName] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchClassInfo() {
      if (!classId) return;
      const { data } = await supabase
        .from("teacher_classes")
        .select("class_name")
        .eq("id", classId)
        .maybeSingle();

      if (data?.class_name) {
        setClassName(data.class_name);
      }
    }
    fetchClassInfo();
  }, [classId, supabase]);

  return (
    <div style={{ position: "relative" }}>
      {/* Top Banner Navigation back to Dashboard */}
      <div style={{
        background: "var(--card-bg, #ffffff)",
        borderBottom: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.85rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--primary, #0f766e)",
            fontWeight: 700,
            textDecoration: "none",
            background: "var(--primary-surface, #ccfbf1)",
            padding: "6px 12px",
            borderRadius: "999px"
          }}
        >
          <ArrowLeft size={14} />
          <span>Teacher Dashboard</span>
        </Link>

        {className && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-main, #0f172a)",
            fontWeight: 700
          }}>
            <Church size={15} color="var(--primary, #0f766e)" />
            <span>Class: {className}</span>
          </div>
        )}
      </div>

      {/* Render the FaithQuest Classroom SPA scoped to this classId */}
      <ClassroomPage classId={classId} />
    </div>
  );
}
