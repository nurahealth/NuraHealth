import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupplementScheduled, type Day, type Schedule } from "@/lib/supplements";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_LABEL: Record<Day, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};
const JS_DAY_ORDER: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseDateLocal(s: string): Date {
  // Treat YYYY-MM-DD as local midnight.
  return new Date(s + "T00:00:00");
}

function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function dowOf(d: Date): Day {
  return JS_DAY_ORDER[d.getDay()];
}

function mondayOf(d: Date): Date {
  const day = d.getDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(m.getDate() + offset);
  return m;
}

type SuppRow = { id: string; user_id: string; schedule: Schedule | null };
type LogRow = { supplement_id: string; log_date: string };

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayParam = req.nextUrl.searchParams.get("today");
    if (!todayParam || !ISO_DATE.test(todayParam)) {
      return NextResponse.json({ error: "today must be YYYY-MM-DD" }, { status: 400 });
    }
    const today = parseDateLocal(todayParam);

    const monday = mondayOf(today);
    const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(monday);
      dt.setDate(dt.getDate() + i);
      return dt;
    });

    const { data: suppsData, error: suppsErr } = await supabase
      .from("supplements")
      .select("id, user_id, schedule")
      .eq("user_id", user.id);
    if (suppsErr) {
      console.error("[supplements/stats] supplements fetch failed:", suppsErr);
      return NextResponse.json({ error: "Could not load supplements" }, { status: 500 });
    }
    const supplements = (suppsData ?? []) as SuppRow[];

    const { data: logsData, error: logsErr } = await supabase
      .from("supplement_logs")
      .select("supplement_id, log_date")
      .eq("user_id", user.id);
    if (logsErr) {
      console.error("[supplements/stats] logs fetch failed:", logsErr);
      return NextResponse.json({ error: "Could not load logs" }, { status: 500 });
    }
    const allLogs = (logsData ?? []) as LogRow[];

    // Distinct log dates (any supplement counts).
    const datesSet = new Set<string>(allLogs.map((l) => l.log_date));
    // Per-date distinct supplement_ids.
    const perDateSupps = new Map<string, Set<string>>();
    for (const l of allLogs) {
      let bucket = perDateSupps.get(l.log_date);
      if (!bucket) {
        bucket = new Set<string>();
        perDateSupps.set(l.log_date, bucket);
      }
      bucket.add(l.supplement_id);
    }

    // Current streak: count back from today; if today not logged, start from yesterday.
    let streak = 0;
    {
      const start = new Date(today);
      if (!datesSet.has(fmtLocal(start))) {
        start.setDate(start.getDate() - 1);
      }
      const cur = new Date(start);
      // Safety cap to avoid pathological loops.
      for (let i = 0; i < 100000; i++) {
        if (datesSet.has(fmtLocal(cur))) {
          streak++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Personal best: longest run of consecutive log_dates in history (ISO sorts chronologically).
    let personalBest = 0;
    {
      const sorted = [...datesSet].sort();
      let run = 0;
      let prev: Date | null = null;
      for (const ds of sorted) {
        const dt = parseDateLocal(ds);
        if (prev) {
          const diff = Math.round((dt.getTime() - prev.getTime()) / 86400000);
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        if (run > personalBest) personalBest = run;
        prev = dt;
      }
      if (streak > personalBest) personalBest = streak;
    }

    const todayStr = fmtLocal(today);
    const days = weekDates.map((dt) => {
      const dateStr = fmtLocal(dt);
      const dow = dowOf(dt);
      const isToday = dateStr === todayStr;
      const isFuture = dt.getTime() > today.getTime();
      const taken = perDateSupps.get(dateStr)?.size ?? 0;
      const scheduled = supplements.filter(
        (s) => isSupplementScheduled(s) && s.schedule!.days.includes(dow)
      ).length;
      return {
        date: dateStr,
        day_of_week: DAY_LABEL[dow],
        taken,
        scheduled,
        is_today: isToday,
        is_future: isFuture,
      };
    });

    let sumTaken = 0;
    let sumScheduled = 0;
    for (const d of days) {
      if (d.is_future) continue;
      sumTaken += d.taken;
      sumScheduled += d.scheduled;
    }
    const compliancePct =
      sumScheduled === 0 ? 0 : Math.min(100, Math.round((sumTaken / sumScheduled) * 100));

    return NextResponse.json({
      streak,
      personal_best: personalBest,
      week_start: fmtLocal(monday),
      days,
      compliance_pct: compliancePct,
    });
  } catch (err) {
    console.error("[supplements/stats] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}
