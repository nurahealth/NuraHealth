'use client';

// ── Fitness · Profile ────────────────────────────────────────────────────────
// The fourth bottom-nav tab. Assembly, not invention: every number here is
// computed by progressStats (the same functions the Progress screen renders),
// every flow it opens — weigh-in, workout builder, exercise request, theme,
// sign-out — is the one that already exists elsewhere in the app. Nothing on
// this screen owns state that another screen also owns.
//
// Same standalone full-screen shell as Progress (own gradient, plexus and
// bottom nav), so it renders without the NuraPageShell wrapper.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import NuraPlexus from '@/components/NuraPlexus';
import Avatar from '@/components/Avatar';
import ThemeToggle from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabase';
import { useThemeStore } from '@/lib/themeStore';
import FitnessBackButton from './FitnessBackButton';
import RequestExerciseModal from './RequestExerciseModal';
import WorkoutBuilder from './WorkoutBuilder';
import { LogWeightModal } from './fitnessModals';
import { goalLabelFrom, SPLIT_OPTS, splitFromProgramType } from './planLabels';
import { addDays, completionsThisWeek, startOfDay, weeklyVolumeSeries, weekStreaks } from './progressStats';
import {
  customGroupId, isCustomWorkout, loadActiveProgram, loadBodyMetrics, loadCatalog, loadCompletions,
  loadSetLogs, localDateKey, workoutDisplayName,
  type BodyMetric, type CatalogEx, type Program, type SetLog, type WorkoutCompletion,
} from './planData';

// ── Palette (1:1 with FitnessProgress.tsx — the sibling full-screen tab) ─────
const BG = 'var(--nura-bg)';
const SAGE = 'var(--nura-sage)';
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'JetBrains Mono', monospace";

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // index = day_index, 0=Mon
const programDayIndex = (d: Date) => (d.getDay() + 6) % 7;

// Trim trailing ".0" so weights read cleanly (180 not 180.0, but 180.5 stays).
const fmtWeight = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

type SubStatus = { isPro: boolean; status: string | null };

// ── Row icons — same stroke language as the bottom-nav glyphs ────────────────
const ICON: Record<string, React.ReactNode> = {
  sliders: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></>,
  contrast: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /></>,
  plusCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  trophy: <><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 21h6M12 16v5" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  chevron: <path d="M9 18l6-6-6-6" />,
};

export default function FitnessProfile() {
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState('');
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [planPrefs, setPlanPrefs] = useState<{ goal: string | null; days: number | null; split: string | null } | null>(null);
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [catalog, setCatalog] = useState<CatalogEx[]>([]);
  const [loading, setLoading] = useState(true);

  const [logOpen, setLogOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [building, setBuilding] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  // The plan itself and everything derived from it. Split out so a new custom
  // workout can refresh the list without re-fetching the account.
  const loadPlan = useCallback(async () => {
    const [{ program }, comps, sets, body, cat] = await Promise.all([
      loadActiveProgram(), loadCompletions(), loadSetLogs(), loadBodyMetrics(), loadCatalog(),
    ]);
    setProgram(program);
    setCompletions(comps);
    setSetLogs(sets);
    setBodyMetrics(body);
    setCatalog(cat);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.push('/auth'); return; }
      setUser(user);

      // Display name + the plan preferences the settings screen writes, then
      // the subscription status — the same source the account settings read.
      const [{ data: profile }, { data: fitProfile }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('fitness_profiles').select('primary_goal, days_per_week, split').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setProfileName(((profile?.full_name as string | null | undefined) ?? '').trim());
      const fp = (fitProfile ?? {}) as Record<string, unknown>;
      setPlanPrefs({
        goal: (fp.primary_goal as string | null) ?? null,
        days: (fp.days_per_week as number | null) ?? null,
        split: (fp.split as string | null) ?? null,
      });

      fetch(`/api/subscription/status?userId=${user.id}`)
        .then((r) => r.json())
        .then((d: SubStatus) => { if (!cancelled) setSub(d); })
        .catch(() => {});

      await loadPlan();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router, loadPlan]);

  // Re-pull weigh-ins after logging one, exactly as Progress does.
  const refreshBody = useCallback(async () => { setBodyMetrics(await loadBodyMetrics()); }, []);

  const displayName = profileName || (user?.user_metadata?.name as string | undefined) || user?.email?.split('@')[0] || 'Friend';

  // PRO / TRIAL / FREE — read off the shared subscription status, where
  // "trialing" and "active" are both Pro.
  const badge = useMemo(() => {
    if (!sub) return null;
    if (sub.status === 'trialing') return { label: 'TRIAL', pro: true };
    if (sub.isPro) return { label: 'PRO', pro: true };
    return { label: 'FREE', pro: false };
  }, [sub]);

  // "Build Muscle · 4 days/week · Full Body" — the settings screen's own
  // vocabulary, preferring what the user set over what the generator stored.
  const planSummary = useMemo(() => {
    const goal = goalLabelFrom(planPrefs?.goal) ?? goalLabelFrom(program?.goal);
    const days = planPrefs?.days
      ?? program?.days_per_week
      ?? (program ? program.workouts.filter((w) => !w.is_rest && w.exercises.length > 0).length : null);
    const split = (planPrefs?.split && SPLIT_OPTS.includes(planPrefs.split) ? planPrefs.split : null)
      ?? splitFromProgramType(program?.split_type);
    const parts = [goal, days ? `${days} days/week` : null, split].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  }, [planPrefs, program]);

  // ── This week — the Progress screen's numbers, from the shared derivations ──
  const workoutsThisWeek = useMemo(() => completionsThisWeek(completions, today), [completions, today]);
  const { currentStreak } = useMemo(() => weekStreaks(completions, today), [completions, today]);
  // A one-week window: the single entry IS the current week.
  const volumeThisWeek = useMemo(() => weeklyVolumeSeries(setLogs, today, 1)[0]?.value ?? 0, [setLogs, today]);
  // Whatever unit the lifts were logged in — the volume figure is in it.
  const volumeUnit = useMemo(() => setLogs.find((s) => s.weight != null)?.unit ?? 'lb', [setLogs]);

  // Latest weigh-in + the change against the one before it (as on Progress).
  const body = useMemo(() => {
    const withWeight = bodyMetrics.filter((m) => m.weight != null);
    const latest = withWeight[withWeight.length - 1] ?? null;
    const prev = withWeight[withWeight.length - 2] ?? null;
    const unit = latest?.unit ?? 'lb';
    const delta = latest?.weight != null && prev?.weight != null ? latest.weight - prev.weight : null;
    return { latest, unit, delta };
  }, [bodyMetrics]);

  // ── My workouts — the custom ones, one entry per group with its weekdays ────
  // A custom workout is stored as one row per scheduled weekday sharing a group
  // id (see planData), so the rows collapse back into the workout the user made.
  const myWorkouts = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; days: number[] }>();
    for (const w of program?.workouts ?? []) {
      const gid = customGroupId(w);
      if (!gid) continue;
      const g = groups.get(gid) ?? { id: gid, name: workoutDisplayName(w), days: [] };
      if (!g.days.includes(w.day_index)) g.days.push(w.day_index);
      groups.set(gid, g);
    }
    const todayIdx = programDayIndex(today);
    return [...groups.values()]
      .map((g) => {
        const days = [...g.days].sort((a, b) => a - b);
        // Next occurrence, counting today as day 0 — the date the plan screen
        // should open on when this workout is tapped.
        let next: Date | null = null;
        for (let k = 0; k < 7 && next === null; k++) {
          if (days.includes((todayIdx + k) % 7)) next = addDays(today, k);
        }
        return { ...g, days, next };
      })
      .sort((a, z) => (a.days[0] ?? 7) - (z.days[0] ?? 7));
  }, [program, today]);

  // Weekdays a generated workout already holds — the builder's shadowing hint.
  const generatedDays = useMemo(() => {
    const s = new Set<number>();
    for (const w of program?.workouts ?? []) {
      if (!isCustomWorkout(w) && !w.is_rest && w.exercises.length > 0) s.add(w.day_index);
    }
    return s;
  }, [program]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  }, [router]);

  // ── Shared styles (1:1 with FitnessProgress.tsx) ────────────────────────────
  const wrap: React.CSSProperties = {
    position: 'relative', minHeight: '100dvh',
    background: 'var(--nura-page-gradient)',
    fontFamily: FONT, color: TEXT,
  };
  const secHead = (text: string) => (
    <div style={{ fontSize: 12, letterSpacing: '.16em', color: MUT, textTransform: 'uppercase', margin: '0 0 14px' }}>{text}</div>
  );
  const tile = (label: string, value: string, unit?: string) => (
    <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, letterSpacing: '.05em', color: MUT, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: MUT }}>{unit}</span>}
      </div>
    </div>
  );

  // The links list. `value` sits before the chevron (Appearance uses it for the
  // current mode); `danger` is the sign-out treatment. Every entry hands off to
  // a flow that already exists — none of them is implemented here.
  const links: {
    key: string; icon: React.ReactNode; label: string; onClick: () => void;
    value?: string; danger?: boolean;
  }[] = [
    { key: 'plan', icon: ICON.sliders, label: 'Plan settings', onClick: () => router.push('/fitness/settings') },
    // The app's theme choice is two-state — see lib/themeStore, which has no
    // "system" option — so the row IS the quick toggle, showing where it stands.
    { key: 'theme', icon: ICON.contrast, label: 'Appearance', onClick: toggleTheme, value: theme === 'light' ? 'Light' : 'Dark' },
    { key: 'request', icon: ICON.plusCircle, label: 'Request an exercise', onClick: () => setReqOpen(true) },
    { key: 'milestones', icon: ICON.trophy, label: 'Milestones', onClick: () => router.push('/fitness/progress#milestones') },
    { key: 'signout', icon: ICON.logout, label: 'Sign out', onClick: () => void signOut(), danger: true },
  ];

  return (
    <div style={wrap}>
      <NuraPlexus opacity={0.3} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 'var(--fit-frame, 440px)', paddingBottom: 100 }}>

          {/* header — back + eyebrow, then serif title (1:1 with Progress) */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <FitnessBackButton onClick={() => router.push('/fitness')} />
              <div style={{ fontSize: 11, letterSpacing: '.22em', color: MUT, flex: 1 }}>FITNESS</div>
              <ThemeToggle size={36} />
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', margin: '4px 0 0', lineHeight: 1.1 }}>Profile</h1>
          </div>

          {/* identity */}
          <div className="nura-flat-accent" style={{
            position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 20, marginBottom: 24,
            background: 'linear-gradient(135deg,rgba(var(--nura-sage-rgb),.20),rgba(var(--nura-sage-rgb),.04))',
            border: '1px solid rgba(var(--nura-sage-rgb),.25)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div className="nura-halo" style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(var(--nura-sage-rgb),.35),transparent 70%)', pointerEvents: 'none' }} />
            <Avatar user={user} name={profileName} size={62} />
            <div style={{ position: 'relative', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>{displayName}</span>
                {badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '.1em', borderRadius: 999, padding: '3px 8px',
                    background: badge.pro ? SAGE : 'rgba(var(--nura-bg-tint-rgb),.06)',
                    color: badge.pro ? BG : MUT,
                    border: badge.pro ? 'none' : `1px solid ${LINE}`,
                  }}>{badge.label}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: MUT, marginTop: 6, lineHeight: 1.45 }}>
                {planSummary ?? (loading ? 'Loading your plan…' : 'No active plan yet')}
              </div>
            </div>
          </div>

          {/* this week */}
          {secHead('This week')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 30 }}>
            {tile('WORKOUTS', String(workoutsThisWeek))}
            {tile('STREAK', String(currentStreak), 'wk')}
            {tile('VOLUME', Math.round(volumeThisWeek).toLocaleString(), volumeUnit)}
          </div>

          {/* body weight — the same card, and the same "+ Log" flow, as Progress */}
          {secHead('Body weight')}
          <div style={{ marginBottom: 30 }}>
            {body.latest?.weight != null ? (
              <div className="nura-card" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: 18,
              }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '.05em', color: MUT, marginBottom: 6 }}>CURRENT</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{fmtWeight(body.latest.weight)}</span>
                    <span style={{ fontSize: 13, color: MUT }}>{body.unit}</span>
                  </div>
                  {body.delta != null && (
                    <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 6, color: body.delta <= 0 ? SAGE : MUT }}>
                      {body.delta <= 0 ? '−' : '+'}{fmtWeight(Math.abs(body.delta))} {body.unit} vs last
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => setLogOpen(true)} style={{
                  appearance: 'none', cursor: 'pointer', flexShrink: 0,
                  color: SAGE, background: 'rgba(var(--nura-sage-rgb),.12)', border: '1px solid rgba(var(--nura-sage-rgb),.3)',
                  borderRadius: 11, padding: '9px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
                }}>+ Log</button>
              </div>
            ) : (
              <button className="nura-card" type="button" onClick={() => setLogOpen(true)} style={{
                appearance: 'none', cursor: 'pointer', width: '100%', textAlign: 'center',
                background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '26px 20px', color: TEXT,
              }}>
                <div style={{ fontSize: 26, color: SAGE, marginBottom: 8 }}>+</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Log your first weigh-in</div>
                <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.5 }}>Track your weight over time to see the trend.</div>
              </button>
            )}
          </div>

          {/* my workouts */}
          {secHead('My workouts')}
          <div style={{ marginBottom: 30 }}>
            {myWorkouts.length === 0 ? (
              <button className="nura-card" type="button" onClick={() => setBuilding(true)} disabled={!program} style={{
                appearance: 'none', cursor: program ? 'pointer' : 'default', width: '100%', textAlign: 'center',
                background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '26px 20px', color: TEXT,
                opacity: program ? 1 : 0.6,
              }}>
                <div style={{ fontSize: 26, color: SAGE, marginBottom: 8 }}>+</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Create your first workout</div>
                <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.5 }}>Build your own and schedule it onto your week.</div>
              </button>
            ) : (
              <>
                <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, overflow: 'hidden', marginBottom: 10 }}>
                  {myWorkouts.map((w, i) => (
                    <button key={w.id} type="button"
                      onClick={() => router.push(w.next ? `/fitness?date=${localDateKey(w.next)}` : '/fitness')}
                      style={{
                        appearance: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        padding: '13px 15px', border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${LINE}`, color: TEXT, fontFamily: FONT,
                      }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: MUT, marginTop: 3 }}>
                          {w.days.length ? w.days.map((d) => DAY_SHORT[d]).join(' · ') : 'Not scheduled'}
                        </div>
                      </div>
                      <svg width="15" height="15" viewBox="0 0 24 24" stroke={MUT} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{ICON.chevron}</svg>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setBuilding(true)} disabled={!program} style={{
                  width: '100%', background: 'transparent', border: '1px dashed rgba(var(--nura-sage-rgb),.4)', color: SAGE,
                  borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, fontFamily: FONT,
                  cursor: program ? 'pointer' : 'default', opacity: program ? 1 : 0.6,
                }}>+ Create workout</button>
              </>
            )}
          </div>

          {/* links */}
          <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, overflow: 'hidden' }}>
            {links.map((r, i) => (
              <button key={r.key} type="button" onClick={r.onClick} style={{
                appearance: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', background: 'transparent',
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px',
                border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
                color: r.danger ? 'var(--nura-danger)' : TEXT, fontFamily: FONT,
              }}>
                <span style={{ display: 'flex', color: r.danger ? 'var(--nura-danger)' : SAGE, flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{r.icon}</svg>
                </span>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{r.label}</span>
                {r.value && <span style={{ fontSize: 12.5, color: MUT }}>{r.value}</span>}
                {!r.danger && (
                  <svg width="15" height="15" viewBox="0 0 24 24" stroke={MUT} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{ICON.chevron}</svg>
                )}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* bottom nav — same block as the dashboard, Profile active */}
      <div className="nura-floating" style={{
        position: 'fixed', bottom: 16,
        // Centre on the content area, not the viewport: at lg the body is inset
        // by the docked rail but a fixed element does not inherit that.
        left: 'calc(var(--nura-content-left) + (100vw - var(--nura-content-left)) / 2)',
        transform: 'translateX(-50%)', width: 'min(calc(100% - 40px), 400px)', maxWidth: 400,
        background: 'var(--nura-elevated)', backdropFilter: 'blur(12px)', border: `1px solid ${LINE}`, borderRadius: 20,
        display: 'flex', justifyContent: 'space-around', padding: 12, zIndex: 40,
      }}>
        {[
          { label: 'Home', on: false, to: '/fitness', path: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
          { label: 'Calendar', on: false, to: '/fitness/calendar', path: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> },
          { label: 'Progress', on: false, to: '/fitness/progress', path: <path d="M3 3v18h18M7 14l3-3 3 3 5-5" /> },
          { label: 'Profile', on: true, to: null, path: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> },
        ].map((n) => (
          <div
            key={n.label}
            onClick={n.to ? () => router.push(n.to!) : undefined}
            style={{ color: n.on ? SAGE : MUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 9, cursor: n.to ? 'pointer' : 'default' }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{n.path}</svg>
            {n.label}
          </div>
        ))}
      </div>

      {logOpen && (
        <LogWeightModal defaultUnit={body.unit} onClose={() => setLogOpen(false)} onSaved={refreshBody} />
      )}

      {reqOpen && <RequestExerciseModal onClose={() => setReqOpen(false)} />}

      {building && program && (
        <WorkoutBuilder
          programId={program.id}
          catalog={catalog}
          generatedDays={generatedDays}
          onClose={() => setBuilding(false)}
          onSaved={() => { setBuilding(false); void loadPlan(); }}
        />
      )}
    </div>
  );
}
