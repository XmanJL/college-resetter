"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

type Stage =
  | "home"
  | "unload"
  | "relieve"
  | "checkpoint"
  | "reset"
  | "save"
  | "dashboard"
  | "community"
  | "resources";
type Visibility = "private" | "anonymous_community";
type Session = {
  id?: string;
  thought: string;
  tags: string[];
  tagColors: Record<string, string>;
  state: string;
  activity: string;
  nextStep: string;
  duration: string;
  saved: boolean;
  visibility: Visibility;
};

const tags = [
  "deadlines",
  "academics",
  "money",
  "relationships",
  "health",
  "future",
];
const threadColors: Record<string, string> = {
  deadlines: "#f6d9ce",
  academics: "#b9c9ed",
  money: "#e6e1f4",
  relationships: "#f1dfeb",
  health: "#dbe9e8",
  future: "#f4e8c8",
};
const moods = [
  ["anxious", "😟"],
  ["scattered", "🌀"],
  ["exhausted", "😴"],
  ["numb", "😶"],
  ["frustrated", "😤"],
] as const;
const activities = [
  [
    "Three-minute pause",
    "Put everything down. Let the room be exactly as it is for 180 seconds.",
    "3 min",
    "#e3edf4",
  ],
  [
    "5–4–3–2–1 grounding",
    "Name five things you see, four you feel, three you hear, two you smell, one you taste.",
    "2 min",
    "#dbe9e8",
  ],
  [
    "Small body reset",
    "Unclench your jaw. Drop your shoulders. Take one slow breath out longer than in.",
    "1 min",
    "#dcecf0",
  ],
];
const rhythmQuotes = [
  "I can't make the whole week okay. I can make the next ten minutes gentler.",
  "I don't have to carry the whole day at once. I can take one softer minute.",
  "The next small step is enough for this moment.",
  "I can pause without falling behind myself.",
  "A little room to breathe can change what comes next.",
  "I can meet this moment without solving everything around it.",
  "Rest now can make the next thing feel more possible.",
];
const initial: Session = {
  thought: "",
  tags: [],
  tagColors: {},
  state: "",
  activity: "",
  nextStep: "",
  duration: "25 minutes",
  saved: false,
  visibility: "private",
};

function formatVisibility(value: string) {
  return value === "anonymous_community" ? "community" : "private";
}

function getTagColor(item: Record<string, unknown>, tag: string) {
  const tags = item.tags;
  if (tags && typeof tags === "object" && !Array.isArray(tags) && tag in tags) {
    return String((tags as Record<string, unknown>)[tag]);
  }
  return threadColors[tag] || "#dcebf3";
}

function getTagMap(item: Record<string, unknown>) {
  const tags = item.tags;
  if (tags && typeof tags === "object" && !Array.isArray(tags)) {
    return Object.fromEntries(Object.entries(tags).map(([tag, color]) => [tag, String(color)]));
  }
  const colors = item.tag_colors && typeof item.tag_colors === "object" ? item.tag_colors as Record<string, unknown> : {};
  return Object.fromEntries((Array.isArray(tags) ? tags : []).map((tag) => [String(tag), String(colors[String(tag)] || threadColors[String(tag)] || "#dcebf3")]));
}

function getMoodEmoji(item: Record<string, unknown>) {
  const mood = moods.find(([name]) => name === String(item.state || ""));
  return mood?.[1] || "";
}

function recordToSession(item: Record<string, unknown>): Session {
  return {
    id: String(item.id),
    thought: String(item.thought || ""),
    tags: Object.keys(getTagMap(item)),
    tagColors: getTagMap(item),
    state: String(item.state || ""),
    activity: String(item.activity || ""),
    nextStep: String(item.next_step || ""),
    duration: String(item.duration || "25 minutes"),
    saved: true,
    visibility: item.visibility === "anonymous_community" ? "anonymous_community" : "private",
  };
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("home");
  const [session, setSession] = useState<Session>(initial);
  const [account, setAccount] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [inactivitySeconds, setInactivitySeconds] = useState(60);
  const inactivityResetRef = useRef<() => void>(() => undefined);
  const [dashboard, setDashboard] = useState<Record<string, unknown>[]>([]);
  const update = (changes: Partial<Session>) =>
    setSession((current) => ({ ...current, ...changes }));
  const signOut = async (notice = "You have been logged out safely.") => {
    await fetch("/api/auth", { method: "DELETE" });
    window.localStorage.removeItem("reset-room-display-name");
    setAccount(false);
    setDashboard([]);
    setStage("home");
    setInactivityWarning(false);
    setAuthNotice(notice);
  };
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    const restoreAccount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/auth");
      const data = (await response.json().catch(() => ({}))) as {
        authenticated?: boolean;
        displayName?: string;
      };
      if (!mounted) return;
      const authenticated = Boolean(data.authenticated || session);
      setAccount(authenticated);
      if (authenticated) {
        const displayName = data.displayName || window.localStorage.getItem("reset-room-display-name");
        if (displayName) setAuthNotice(`Welcome, ${displayName}.`);
        const dashboardResponse = await fetch("/api/sessions");
        if (mounted && dashboardResponse.ok) setDashboard(await dashboardResponse.json());
      }
    };
    void restoreAccount();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAccount(Boolean(session));
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!account) {
      inactivityResetRef.current = () => undefined;
      return;
    }
    let warningTimer: number | undefined;
    let logoutTimer: number | undefined;
    let countdownTimer: number | undefined;
    const clearTimers = () => {
      if (warningTimer) window.clearTimeout(warningTimer);
      if (logoutTimer) window.clearTimeout(logoutTimer);
      if (countdownTimer) window.clearInterval(countdownTimer);
    };
    const timeoutSignOut = async () => {
      clearTimers();
      await signOut("You were signed out after 5 minutes of inactivity.");
    };
    const resetActivity = () => {
      clearTimers();
      setInactivityWarning(false);
      setInactivitySeconds(60);
      warningTimer = window.setTimeout(() => {
        setInactivityWarning(true);
        setInactivitySeconds(60);
        countdownTimer = window.setInterval(() => {
          setInactivitySeconds((seconds) => Math.max(seconds - 1, 0));
        }, 1000);
        logoutTimer = window.setTimeout(() => void timeoutSignOut(), 60000);
      }, 240000);
    };
    inactivityResetRef.current = resetActivity;
    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((event) => window.addEventListener(event, resetActivity, { passive: true }));
    resetActivity();
    return () => {
      clearTimers();
      inactivityResetRef.current = () => undefined;
      activityEvents.forEach((event) => window.removeEventListener(event, resetActivity));
    };
  }, [account]);
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="grain pointer-events-none fixed inset-0" />
      <aside className="site-header site-sidebar" aria-label="Main navigation">
        <div className="site-header-inner sidebar-inner">
          <p className="sidebar-title">Your Space</p>
          <nav className="site-nav" aria-label="Reset Room features">
            <button
              onClick={() => setStage("home")}
              className={`feature-link ${stage !== "dashboard" && stage !== "community" && stage !== "resources" ? "active" : ""}`}
              aria-current={stage !== "dashboard" && stage !== "community" && stage !== "resources" ? "page" : undefined}
            >
              <Image
                src="/images/reset-room.png"
                alt=""
                width={48}
                height={48}
                loading="eager"
              />
              <span>Reset room</span>
            </button>
            <button
              onClick={() => {
                setStage("dashboard");
                fetch("/api/sessions")
                  .then((r) => (r.ok ? r.json() : []))
                  .then(setDashboard);
              }}
              className={`feature-link ${stage === "dashboard" ? "active" : ""}`}
              aria-current={stage === "dashboard" ? "page" : undefined}
            >
              <Image
                src="/images/dashboard.png"
                alt=""
                width={48}
                height={48}
              />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setStage("community")}
              className={`feature-link ${stage === "community" ? "active" : ""}`}
              aria-current={stage === "community" ? "page" : undefined}
            >
              <Image
                src="/images/community.png"
                alt=""
                width={48}
                height={48}
                loading="eager"
              />
              <span>Community</span>
            </button>
            <button
              onClick={() => setStage("resources")}
              className={`feature-link ${stage === "resources" ? "active" : ""}`}
              aria-current={stage === "resources" ? "page" : undefined}
            >
              <Image
                src="/images/support-resources.png"
                alt=""
                width={48}
                height={48}
                loading="eager"
              />
              <span>Resources</span>
            </button>
            <button
              onClick={() => (account ? signOut() : setAuthOpen(true))}
              className="feature-link"
            >
              <Image src="/images/sign-in.png" alt="" width={48} height={48} />
              <span>{account ? "Log out" : "Sign in"}</span>
            </button>
          </nav>
        </div>
      </aside>
      <div className="app-content">
        {authNotice && (
          <p className="auth-notice" role="status">
            {authNotice}
          </p>
        )}
        {stage === "home" && (
          <HomeView
            onStart={() => {
              setSession(initial);
              setStage("unload");
            }}
            onCommunity={() => setStage("community")}
          />
        )}
        {stage === "unload" && (
          <Unload
            session={session}
            update={update}
            next={() => setStage("relieve")}
            back={() => setStage("home")}
          />
        )}
        {stage === "relieve" && (
          <Relieve
            session={session}
            update={update}
            next={() => setStage("checkpoint")}
            back={() => setStage("unload")}
          />
        )}
        {stage === "checkpoint" && (
          <Checkpoint
            next={() => {
              setStage("reset");
            }}
            repeat={() => setStage("relieve")}
          />
        )}
        {stage === "reset" && (
          <Reset
            session={session}
            update={update}
            next={() => setStage("save")}
            back={() => setStage("relieve")}
          />
        )}
        {stage === "save" && (
          <Save
            session={session}
            setSession={setSession}
            dashboard={dashboard}
            setDashboard={setDashboard}
            account={account}
            modify={() => setStage("reset")}
            toDashboard={() => setStage("dashboard")}
          />
        )}
        {stage === "dashboard" && (
          <Dashboard
            sessions={dashboard}
            onEdit={(item) => {
              setSession(recordToSession(item));
              setStage("unload");
            }}
            onDelete={(id) =>
              setDashboard(dashboard.filter((item) => item.id !== id))
            }
            onRestore={(item) =>
              setDashboard((current) =>
                current.some((existing) => existing.id === item.id)
                  ? current
                  : [item, ...current],
              )
            }
          />
        )}
        {stage === "community" && (
          <Community account={account} onSignIn={() => setAuthOpen(true)} />
        )}
        {stage === "resources" && <Resources />}
        {inactivityWarning && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-[rgba(32,54,74,0.35)] p-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="inactivity-title"
              className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-2xl"
            >
              <h2 id="inactivity-title" className="serif text-3xl">
                Still there?
              </h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">
                You have been inactive. You will be signed out automatically in
                <span className="font-bold text-[var(--ink)]"> {inactivitySeconds} seconds</span>.
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Would you like to stay signed in?
              </p>
              <div className="mt-7 flex justify-end gap-3">
                <button
                  onClick={() => void signOut("You have been logged out safely.")}
                  className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-bold"
                >
                  Sign out
                </button>
                <button
                  onClick={() => inactivityResetRef.current()}
                  className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white"
                >
                  Stay signed in
                </button>
              </div>
            </div>
          </div>
        )}
        {authOpen && (
          <AuthPanel
            close={() => setAuthOpen(false)}
            onSignedIn={(name) => {
              window.localStorage.setItem("reset-room-display-name", name);
              setAccount(true);
              fetch("/api/sessions")
                .then((response) => (response.ok ? response.json() : []))
                .then(setDashboard);
              setAuthNotice(`Welcome, ${name}.`);
              setAuthOpen(false);
            }}
          />
        )}
      </div>
    </main>
  );
}

function Shell({
  children,
  eyebrow,
  title,
  intro,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: React.ReactNode;
  intro: React.ReactNode;
}) {
  return (
    <section className="responsive-shell relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-14 lg:px-10 lg:pt-20">
      <div className="max-w-2xl fade-up">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[var(--coral-dark)]">
          {eyebrow}
        </p>
        <h1 className="serif text-5xl leading-[.98] tracking-[-.04em] text-[var(--ink)] sm:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
          {intro}
        </p>
      </div>
      {children}
    </section>
  );
}

function HomeView({
  onStart,
  onCommunity,
}: {
  onStart: () => void;
  onCommunity: () => void;
}) {
  const [rhythmQuote, setRhythmQuote] = useState(rhythmQuotes[0]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRhythmQuote(
        rhythmQuotes[Math.floor(Math.random() * rhythmQuotes.length)],
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="responsive-home relative z-10 mx-auto grid max-w-6xl gap-16 px-6 pb-20 pt-14 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-10 lg:pt-24">
      <div className="fade-up">
        <p className="mb-6 text-xs font-bold uppercase tracking-[.2em] text-[var(--coral-dark)]">
          A softer place to begin again
        </p>
        <h1 className="serif max-w-3xl text-6xl leading-[.92] tracking-[-.05em] sm:text-8xl">
          You don&apos;t have to solve it all{" "}
          <em className="font-normal text-[var(--coral)]">right now.</em>
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-8 text-[var(--muted)]">
          A private reset room for when work feels like too much. Put it
          down, find a little room to breathe, then choose one small next thing.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            onClick={onStart}
            className="rounded-full bg-[var(--ink)] px-7 py-4 text-sm font-bold text-white hover:-translate-y-0.5"
          >
            Start a reset <span className="ml-3 text-[#f5b19a]">→</span>
          </button>
          <button
            onClick={onCommunity}
            className="px-3 py-4 text-sm font-semibold text-[var(--muted)] underline decoration-[#b8cdd8] underline-offset-4"
          >
            Read shared thoughts
          </button>
        </div>
        <p className="mt-7 text-xs text-[var(--muted)]">
          No account needed to begin · private by default
        </p>
      </div>
      <div className="relative mx-auto w-full max-w-md lg:mt-8">
        <div className="absolute -inset-5 rounded-[40%] bg-[#d7e7ef] opacity-70 blur-3xl" />
        <div className="soft-shadow relative rounded-[28px] border border-white/70 bg-[var(--paper)] p-8 sm:p-10">
          <div className="mb-16 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>today&apos;s room</span>
            <span className="rounded-full bg-[var(--sage)] px-3 py-1 text-[#476b76]">
              quiet mode
            </span>
          </div>
          <p className="serif text-3xl leading-tight">
            &quot;{rhythmQuote}&quot;
          </p>
          <div className="mt-16 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
                the rhythm
              </p>
              <div className="mt-3 flex items-end gap-1">
                <i className="h-4 w-1.5 rounded-full bg-[#d9bda4]" />
                <i className="h-7 w-1.5 rounded-full bg-[#6c9fbd]" />
                <i className="h-11 w-1.5 rounded-full bg-[#8bb3aa]" />
                <i className="h-6 w-1.5 rounded-full bg-[#d9bda4]" />
                <i className="h-9 w-1.5 rounded-full bg-[#6c9fbd]" />
              </div>
            </div>
            <span className="text-3xl text-[var(--coral)]">↘</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Unload({
  session,
  update,
  next,
  back,
}: {
  session: Session;
  update: (c: Partial<Session>) => void;
  next: () => void;
  back: () => void;
}) {
  const [customThread, setCustomThread] = useState("");
  const [customColor, setCustomColor] = useState("#dbe9e8");
  const addCustomThread = () => {
    const thread = customThread.trim();
    if (!thread) return;
    if (!session.tags.includes(thread)) {
      update({
        tags: [...session.tags, thread],
        tagColors: { ...session.tagColors, [thread]: customColor },
      });
    }
    setCustomThread("");
  };
  const removeThread = (tag: string) => {
    const tagColors = { ...session.tagColors };
    delete tagColors[tag];
    update({
      tags: session.tags.filter((item) => item !== tag),
      tagColors,
    });
  };
  return (
    <Shell
      eyebrow="01 / unload"
      title="What's taking up space?"
      intro="There's no right way to say it. A sentence, a list, or a beautiful mess all count."
    >
      <div className="mt-12 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          Thought Dumps
        </p>
        <div className="mt-4">
          <p className="mb-3 text-sm font-semibold">
            What is the thread of your dump?
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (session.tags.includes(tag)) removeThread(tag);
                  else {
                    update({
                      tags: [...session.tags, tag],
                      tagColors: {
                        ...session.tagColors,
                        [tag]: threadColors[tag],
                      },
                    });
                  }
                }}
                style={
                  session.tags.includes(tag)
                    ? { backgroundColor: session.tagColors[tag] || threadColors[tag] }
                    : undefined
                }
                className={`rounded-full border px-4 py-2 text-sm ${session.tags.includes(tag) ? "border-[var(--coral)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--muted)]"}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={customThread}
              onChange={(e) => setCustomThread(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomThread();
                }
              }}
              placeholder="Add your own thread"
              aria-label="Add your own thread"
              className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-sm outline-none focus:border-[var(--coral)]"
            />
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              aria-label="Choose a color for your thread"
              title="Choose a color for your thread"
              className="h-11 w-11 cursor-pointer rounded-full border border-[var(--line)] bg-[var(--paper)] p-1"
            />
            <button
              onClick={addCustomThread}
              disabled={!customThread.trim()}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold transition hover:border-[var(--coral)] hover:bg-[#eef6fa] disabled:opacity-35"
            >
              Add thread
            </button>
          </div>
        </div>
        {session.tags.length > 0 && (
          <div className="mt-6 rounded-2xl bg-[#dcebf3] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              Selected threads
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {session.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    removeThread(tag)
                  }
                  style={{
                    backgroundColor:
                      session.tagColors[tag] || threadColors[tag] || "#dcebf3",
                  }}
                  className="rounded-full px-3 py-1.5 text-sm text-[var(--ink)] transition hover:brightness-95"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>
        )}
        <textarea
          autoFocus
          required
          aria-required="true"
          value={session.thought}
          onChange={(e) => update({ thought: e.target.value })}
          placeholder="I keep thinking about..."
          className="mt-6 min-h-52 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-xl leading-8 outline-none focus:border-[var(--coral)]"
        />
        <p className="mt-4 text-sm text-[var(--muted)]">
          Add a thought and choose at least one thread to continue.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-6">
          <button
            onClick={back}
            className="stage-back-button rounded-l-full rounded-r-md bg-[var(--ink)] px-4 py-3 text-sm font-bold text-white"
          >
            ← Back
          </button>
          <button
            disabled={!session.thought.trim() || session.tags.length === 0}
            onClick={next}
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white disabled:opacity-35"
          >
            Make a little room →
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Relieve({
  session,
  update,
  next,
  back,
}: {
  session: Session;
  update: (c: Partial<Session>) => void;
  next: () => void;
  back: () => void;
}) {
  return (
    <Shell
      eyebrow="02 / relieve"
      title="First, let's lower the volume."
      intro="You don't need to feel great. Just a tiny bit less alone inside the noise. What is closest right now?"
    >
      <div className="mt-10 max-w-3xl">
        <p className="mb-3 text-sm font-semibold">Mood</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {moods.map(([state, emoji]) => (
            <button
              key={state}
              onClick={() => update({ state })}
              className={`rounded-xl border px-3 py-4 text-sm capitalize ${session.state === state ? "border-[var(--coral)] bg-[#dcebf3] font-bold text-[var(--coral-dark)]" : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"}`}
            >
              <span className="mr-2 text-lg" aria-hidden="true">
                {emoji}
              </span>
              {state}
            </button>
          ))}
        </div>
        <p className="mb-4 mt-10 text-sm font-semibold">
          Choose a two-minute doorway
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {activities.map(([name, detail, time, color]) => (
            <button
              key={name}
              onClick={() => update({ activity: name })}
              className={`rounded-2xl border p-5 text-left ${session.activity === name ? "border-[var(--coral)] ring-2 ring-[#6c9fbd]/20" : "border-[var(--line)]"}`}
              style={{ background: color }}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                {time}
              </span>
              <h2 className="serif mt-8 text-2xl">{name}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {detail}
              </p>
            </button>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            onClick={back}
            className="rounded-l-full rounded-r-md bg-[var(--ink)] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--coral-dark)]"
          >
            <span aria-hidden="true" className="mr-2 text-base">
              ←
            </span>
            Edit thoughts
          </button>
          <button
            disabled={!session.state || !session.activity}
            onClick={next}
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white disabled:opacity-35"
          >
            I gave myself a moment →
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Checkpoint({
  next,
  repeat,
}: {
  next: () => void;
  repeat: () => void;
}) {
  return (
    <Shell
      eyebrow="a small checkpoint"
      title="Is there 2% more room now?"
      intro="That is enough. You can move toward one small thing or take another pause."
    >
      <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
        <button
          onClick={repeat}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-left transition hover:-translate-y-1 hover:border-[var(--coral)] hover:bg-[#eef6fa]"
        >
          <span className="text-2xl">↺</span>
          <h2 className="mt-8 text-lg font-bold">One more minute of relief</h2>
        </button>
        <button
          onClick={next}
          className="rounded-2xl bg-[var(--ink)] p-6 text-left text-white transition hover:bg-[var(--coral-dark)]"
        >
          <span className="text-2xl">→</span>
          <h2 className="mt-8 text-lg font-bold">
            I&apos;m ready to choose a next step
          </h2>
        </button>
      </div>
    </Shell>
  );
}

function Reset({
  session,
  update,
  next,
  back,
}: {
  session: Session;
  update: (c: Partial<Session>) => void;
  next: () => void;
  back: () => void;
}) {
  return (
    <Shell
      eyebrow="03 / reset"
      title="Make it smaller than the fear."
      intro="You are the expert on what needs doing. We are only looking for one action with a clear edge: what will you do, and when will you stop?"
    >
      <div className="mt-10 max-w-3xl">
        <div className="mb-6 rounded-2xl bg-[#dbe9e8] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#476b76]">
            You put down
          </p>
          <p className="serif mt-3 text-xl leading-8">
            {session.thought || "a lot of things at once"}
          </p>
        </div>
        <p className="mb-3 text-sm font-semibold">
          How long will you work on this?
        </p>
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            "10 minutes",
            "25 minutes",
            "Until one small piece is done",
            "Just start",
          ].map((duration) => (
            <button
              key={duration}
              onClick={() => update({ duration })}
              className={`rounded-full border px-4 py-2 text-sm ${session.duration === duration ? "border-[var(--coral)] bg-[#dcebf3] text-[var(--coral-dark)]" : "border-[var(--line)] text-[var(--muted)]"}`}
            >
              {duration}
            </button>
          ))}
        </div>
        <textarea
          value={session.nextStep}
          onChange={(e) => update({ nextStep: e.target.value })}
          placeholder="Write one small thing you will do during this time."
          className="min-h-32 w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-lg outline-none focus:border-[var(--coral)]"
        />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={back}
            className="stage-back-button rounded-l-full rounded-r-md bg-[var(--ink)] px-4 py-3 text-sm font-bold text-white"
          >
            ← Back to relief
          </button>
          <button
            onClick={next}
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white"
          >
            Keep this one thing →
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Save({
  session,
  setSession,
  dashboard,
  setDashboard,
  account,
  modify,
  toDashboard,
}: {
  session: Session;
  setSession: (s: Session) => void;
  dashboard: Record<string, unknown>[];
  setDashboard: (s: Record<string, unknown>[]) => void;
  account: boolean;
  modify: () => void;
  toDashboard: () => void;
}) {
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const editing = Boolean(session.id);
    const response = await fetch(editing ? `/api/sessions/${session.id}` : "/api/sessions", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thought: session.thought,
        tags: session.tags,
        tag_colors: session.tagColors,
        state: session.state,
        activity: session.activity,
        next_step: session.nextStep,
        duration: session.duration,
        visibility: session.visibility,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };
    if (!response.ok) {
      setMessage(data.error || "Sign in to save your reset server-side.");
      return false;
    }
    setSession({ ...session, id: data.id, saved: true });
    setDashboard(editing ? dashboard.map((item) => item.id === data.id ? data : item) : [data, ...dashboard]);
    return true;
  };
  const confirmSave = async () => {
    setSaving(true);
    const saved = await save();
    setSaving(false);
    if (saved) {
      setConfirmOpen(false);
      toDashboard();
    }
  };
  return (
    <Shell
      eyebrow="04 / keep"
      title="This stays yours."
      intro="Your reset is private by default. Choose exactly what it means before it leaves this room."
    >
      <div className="mt-10 max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          Your next small thing
        </p>
        <p className="serif mt-4 text-3xl">
          {session.nextStep || "Come back when you have more room."}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {session.duration} · {formatVisibility(session.visibility)}
        </p>
        <div className="mt-7 border-t border-[var(--line)] pt-6">
          <p className="text-sm font-bold">Visibility</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["private", "anonymous_community"] as Visibility[]).map(
              (value) => (
                <button
                  key={value}
                  onClick={() => setSession({ ...session, visibility: value })}
                  className={`rounded-xl border p-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-[var(--coral)] hover:bg-[#eef6fa] ${session.visibility === value ? "border-[var(--coral)] bg-[#dcebf3]" : "border-[var(--line)]"}`}
                >
                  <span className="font-bold">
                    {formatVisibility(value)}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {value === "private"
                      ? "Only you, across your devices."
                      : "Share only the preview below anonymously."}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--line)] pt-6">
          <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
            anonymous preview
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            (Your name, email, and private notes never appear here.)
          </p>
          <div className="mt-4 rounded-xl bg-[#e3edf4] p-5">
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  01 / unload
                </p>
                <p className="serif mt-2 text-xl leading-8">
                  {session.thought || "Nothing added yet."}
                </p>
                {session.tags.length > 0 && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {session.tags.join(" · ")}
                  </p>
                )}
              </div>
              <div className="border-t border-white/70 pt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  02 / relieve
                </p>
                <p className="mt-2 text-sm leading-6">
                  {session.state || "No feeling selected yet."}
                  {session.activity ? ` · ${session.activity}` : ""}
                </p>
              </div>
              <div className="border-t border-white/70 pt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  03 / reset
                </p>
                <p className="serif mt-2 text-xl leading-8">
                  {session.nextStep || "No next step added yet."}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {session.duration}
                </p>
              </div>
            </div>
          </div>
        </div>
        {message && (
          <p className="mt-5 rounded-xl bg-[#dbe9e8] p-4 text-sm text-[#476b76]">
            {message}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={modify}
            className="rounded-l-full rounded-r-md bg-[var(--ink)] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--coral-dark)]"
          >
            <span aria-hidden="true" className="mr-2 text-base">
              ←
            </span>
            Edit My Todos
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--coral-dark)]"
          >
            Save to my dashboard
          </button>
        </div>
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(32,54,74,0.35)] p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-confirmation-title"
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-2xl"
          >
            <h2 id="save-confirmation-title" className="serif text-3xl">
              Save this reset?
            </h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              This will save it to your personal dashboard so you can come back
              to it later.
            </p>
            {!account && (
              <p className="mt-4 rounded-xl bg-[#f8e8dc] p-4 text-sm leading-6 text-[#7d5143]">
                You are not signed in. This reset will not be saved to your
                dashboard or the database unless you sign in first.
              </p>
            )}
            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-bold transition hover:border-[var(--coral)] hover:bg-[#eef6fa] disabled:opacity-50"
              >
                No, stay here
              </button>
              <button
                onClick={confirmSave}
                disabled={saving}
                className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--coral-dark)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Yes, save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Community({
  account,
  onSignIn,
}: {
  account: boolean;
  onSignIn: () => void;
}) {
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [reactingIds, setReactingIds] = useState<Set<string>>(new Set());
  const [optIn, setOptIn] = useState(false);
  useEffect(() => {
    fetch("/api/community")
      .then((response) => response.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);
  const reactToPost = async (postId: string) => {
    if (reactingIds.has(postId)) return;
    const currentPost = posts.find((post) => String(post.id) === postId);
    if (!currentPost) return;
    setReactingIds((current) => new Set(current).add(postId));
    const wasReacted = Boolean(currentPost.reacted_by_user);
    const currentCount = Number(currentPost.reaction_count || 0);
    const optimisticPost = {
      ...currentPost,
      reacted_by_user: !wasReacted,
      reaction_count: Math.max(0, currentCount + (wasReacted ? -1 : 1)),
    };
    setPosts((current) => current.map((post) => String(post.id) === postId ? optimisticPost : post));
    try {
      const response = await fetch(`/api/community/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react" }),
      });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        setPosts((current) => current.map((post) => String(post.id) === postId ? currentPost : post));
        return;
      }
      setPosts((current) => current.map((post) => String(post.id) === postId ? { ...post, ...data } : post));
    } finally {
      setReactingIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  };
  return (
    <Shell
      eyebrow="community / anonymous"
      title="You are not the only one carrying it."
      intro={
        <>
          A quiet wall of thoughts shared by students who chose to be seen
          without being identified. No advice, no fixing. Just recognition.{" "}
          <button
            onClick={onSignIn}
            className="community-signin-link"
          >
            Sign in to interact with the community.
          </button>
        </>
      }
    >
      <div className="mt-8 min-h-24 max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <label className="flex items-start gap-3 text-base leading-7">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong>Show me community posts</strong>
            <br />
            <span className="text-[var(--muted)]">
              Optional. Posts are anonymous and never include private sessions.
            </span>
          </span>
        </label>
      </div>
      {optIn ? (
        <div className="mt-5 grid max-w-4xl gap-4 md:grid-cols-2">
          {posts.length ? (
            posts.map((post, index) => (
              <article
                key={String(post.id)}
                className={`relative min-w-0 overflow-hidden rounded-[2rem] border border-white/70 p-7 shadow-[0_18px_45px_rgba(45,74,94,0.12)] ${post.is_owner ? "border-[#e8b6aa] bg-[#f8e1dc]" : index % 2 ? "bg-[#dcecf0]" : "bg-[#e3edf4]"}`}
              >
                <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  <span>anonymous reset</span>
                  <span>{String(post.duration || "25 minutes")}</span>
                </div>
                <p className="serif mt-8 text-3xl leading-10">
                  {String(post.thought)}
                  {post.is_owner ? (
                    <span className="block font-sans text-xs font-bold leading-5 text-[var(--muted)]">
                      (Your post)
                    </span>
                  ) : null}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {Object.keys(getTagMap(post)).map((tag) => (
                    <span key={String(tag)} style={{ backgroundColor: getTagColor(post, String(tag)) }} className="rounded-full px-3 py-1 text-xs font-bold text-[var(--ink)]">
                      {String(tag)}
                    </span>
                  ))}
                  {post.state ? <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-bold text-[var(--ink)]">{getMoodEmoji(post)} {String(post.state)}</span> : null}
                </div>
                <div className="mt-7 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                  {post.activity ? <p><strong className="text-[var(--ink)]">Did:</strong> {String(post.activity)}</p> : null}
                  {post.next_step ? <p><strong className="text-[var(--ink)]">Next:</strong> {String(post.next_step)}</p> : null}
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-4 text-base font-bold">
                  <button
                    onClick={() => reactToPost(String(post.id))}
                    disabled={!account || reactingIds.has(String(post.id))}
                    aria-pressed={Boolean(post.reacted_by_user)}
                    className={`rounded-full px-5 py-3 transition-colors ${post.reacted_by_user ? "bg-[#9fc9aa] text-[var(--ink)] hover:bg-[#b7d8be]" : "bg-[#6c9fbd] text-white hover:bg-[#86b7d0]"} disabled:cursor-not-allowed disabled:opacity-55`}
                  >
                    {post.reacted_by_user ? "♥" : "♡"} {Number(post.reaction_count || 0)} {Number(post.reaction_count || 0) === 1 ? "person" : "people"} feel this too
                  </button>
                  <button
                    onClick={() =>
                      fetch(`/api/community/${String(post.id)}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "report",
                          reason: "concern",
                        }),
                      })
                    }
                    className="rounded-full border border-[var(--line)] px-5 py-3 font-normal text-[var(--muted)]"
                  >
                    Report
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-sm text-[var(--muted)]">
              No community posts yet. Sharing is opt-in and requires an account.
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 flex min-h-24 max-w-2xl items-center rounded-2xl bg-[#dbe9e8] p-7 text-base leading-7 text-[#476b76]">
          Community is hidden. Turn it on to browse shared thoughts.
        </div>
      )}
    </Shell>
  );
}

function Dashboard({
  sessions,
  onEdit,
  onDelete,
  onRestore,
}: {
  sessions: Record<string, unknown>[];
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (id: unknown) => void;
  onRestore: (item: Record<string, unknown>) => void;
}) {
  const [pendingAction, setPendingAction] = useState<{
    type: "export" | "delete";
    id: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const filteredSessions = sessions.filter((item) => {
    const searchableText = [
      item.thought,
      item.next_step,
      item.state,
      item.activity,
      Object.keys(getTagMap(item)).join(" "),
    ]
      .map((value) => String(value || ""))
      .join(" ")
      .toLowerCase();
    return searchableText.includes(searchQuery.trim().toLowerCase());
  });
  const confirmAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === "export") {
      const downloadLink = document.createElement("a");
      downloadLink.href = `/api/sessions/${pendingAction.id}/export`;
      downloadLink.download = `reset-room-${pendingAction.id}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      setPendingAction(null);
      return;
    }
    const item = sessions.find((candidate) => String(candidate.id) === pendingAction.id);
    const id = pendingAction.id;
    setPendingAction(null);
    if (!item) return;
    setActionMessage("");
    onDelete(id);
    try {
      const response = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!response.ok) {
        onRestore(item);
        setActionMessage("This reset could not be deleted. It has been restored.");
      }
    } catch {
      onRestore(item);
      setActionMessage("This reset could not be deleted. It has been restored.");
    }
  };
  return (
    <Shell
      eyebrow="your room / personal"
      title="A place to come back."
      intro="Your saved resets live here, protected by your account. You can find, download, edit, or delete any one of them."
    >
      <div className="mt-6 max-w-4xl">
        {actionMessage ? (
          <p className="mb-4 rounded-xl bg-[#f8e1dc] p-4 text-sm text-[#9b6258]" role="alert">
            {actionMessage}
          </p>
        ) : null}
        <label className="block max-w-4xl text-sm font-semibold">
          Search your resets
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by thought, thread, mood, or next step"
            className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4 text-base font-normal outline-none transition focus:border-[var(--coral)]"
          />
        </label>
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            No saved resets yet. Finish a reset and choose “save to my
            dashboard.”
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            No resets match your search.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {filteredSessions.map((item) => (
              <article
                key={String(item.id)}
                className="flex h-full min-w-0 flex-col rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6"
              >
                <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
                  {formatVisibility(String(item.visibility || "private"))}
                </p>
                <p className="serif mt-4 text-2xl">
                  <span className="break-words">
                    {String(item.next_step || item.thought || "A quiet moment")}
                  </span>
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {item.created_at
                    ? new Date(String(item.created_at)).toLocaleString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )
                    : "just now"}
                </p>
                {Object.keys(getTagMap(item)).length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-[var(--ink)]">Threads:</span>
                    {Object.keys(getTagMap(item)).map((tag) => (
                      <span
                        key={String(tag)}
                        style={{
                          backgroundColor: getTagColor(item, String(tag)),
                        }}
                        className="rounded-full px-3 py-1.5 text-[var(--ink)]"
                      >
                        {String(tag)}
                      </span>
                    ))}
                  </div>
                )}
                {Boolean(item.state) && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    <span className="font-bold text-[var(--ink)]">Mood:</span>{" "}
                    <span className="mr-1" aria-hidden="true">
                      {getMoodEmoji(item)}
                    </span>
                    {String(item.state)}
                  </p>
                )}
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {String(item.duration || "")} · {formatVisibility(
                    String(item.visibility || "private"),
                  )}
                </p>
                <div className="mt-auto flex flex-wrap gap-3 pt-6 text-sm">
                  <button
                    onClick={() => onEdit(item)}
                    className="rounded-full bg-[var(--ink)] px-4 py-2 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--coral-dark)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setPendingAction({
                        type: "export",
                        id: String(item.id),
                      })
                    }
                    className="rounded-full bg-[var(--ink)] px-4 py-2 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--coral-dark)]"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() =>
                      setPendingAction({
                        type: "delete",
                        id: String(item.id),
                      })
                    }
                    className="rounded-full bg-[var(--ink)] px-4 py-2 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--coral-dark)]"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {pendingAction && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(32,54,74,0.35)] p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-action-title"
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-2xl"
          >
            <h2 id="dashboard-action-title" className="serif text-3xl">
              {pendingAction.type === "delete"
                ? "Delete this reset?"
                : "Export this reset?"}
            </h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              {pendingAction.type === "delete"
                ? "This will remove it from your dashboard."
                : "This will download a clean PDF copy of this reset."}
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setPendingAction(null)}
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-bold transition hover:border-[var(--coral)] hover:bg-[#eef6fa]"
              >
                No, stay here
              </button>
              <button
                onClick={confirmAction}
                className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--coral-dark)]"
              >
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function AuthPanel({
  close,
  onSignedIn,
}: {
  close: () => void;
  onSignedIn: (name: string) => void;
}) {
  type FieldError = "displayName" | "email" | "password" | null;
  const [signup, setSignup] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorField, setErrorField] = useState<FieldError>(null);
  const submit = async () => {
    if (signup && !displayName.trim()) {
      setErrorField("displayName");
      setMessage("Enter a display name to create your account.");
      return;
    }
    if (!email.trim()) {
      setErrorField("email");
      setMessage("Enter your email address.");
      return;
    }
    if (!password) {
      setErrorField("password");
      setMessage("Enter your password.");
      return;
    }
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: signup ? "signup" : "signin",
        displayName: displayName.trim(),
        email,
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const serverMessage = String(data.error || "Unable to continue.");
      const nextErrorField: FieldError = /email/i.test(serverMessage)
        ? "email"
        : /password|credential/i.test(serverMessage)
          ? "password"
          : signup
            ? "displayName"
            : null;
      setErrorField(nextErrorField);
      setMessage(serverMessage);
    } else if (data.needsConfirmation) {
      setErrorField(null);
      setMessage("Check your email to confirm your account.");
    } else {
      setErrorField(null);
      onSignedIn(data.displayName);
    }
  };
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-[var(--ink)]/30 p-6">
      <div className="w-full max-w-md rounded-2xl bg-[var(--paper)] p-7 soft-shadow">
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--coral-dark)]">
              private account
            </p>
            <h1 className="serif mt-2 text-5xl leading-none">
              {signup ? "Sign Up" : "Sign In"}
            </h1>
            <h2 className="serif mt-3 text-2xl">Keep your room close.</h2>
          </div>
          <button
            onClick={close}
            aria-label="Close sign in"
            className="auth-close text-[var(--muted)]"
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Your email is used for access only. It is never shown in community
          sharing.
        </p>
        {signup && (
          <input
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (errorField === "displayName") setErrorField(null);
            }}
            type="text"
            placeholder="Display name"
            className={`mt-6 w-full rounded-xl border bg-white p-3 ${errorField === "displayName" ? "border-red-500" : "border-[var(--line)]"}`}
            required
          />
        )}
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorField === "email") setErrorField(null);
          }}
          type="email"
          placeholder="you@example.com"
          className={`${signup ? "mt-3" : "mt-6"} w-full rounded-xl border bg-white p-3 ${errorField === "email" ? "border-red-500" : "border-[var(--line)]"}`}
        />
        <input
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errorField === "password") setErrorField(null);
          }}
          type="password"
          placeholder="8+ character password"
          className={`mt-3 w-full rounded-xl border bg-white p-3 ${errorField === "password" ? "border-red-500" : "border-[var(--line)]"}`}
        />
        {message && (
          <p className="mt-3 text-sm text-[var(--coral-dark)]">{message}</p>
        )}
        <button
          onClick={submit}
          className="mt-5 w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white"
        >
          {signup ? "Create account" : "Sign in"}
        </button>
        <button
          onClick={() => {
            setSignup(!signup);
            setMessage("");
            setErrorField(null);
          }}
          className="mt-4 w-full text-sm underline"
        >
          {signup
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

function Resources() {
  return (
    <Shell
      eyebrow="support, when you need it"
      title="You deserve human support too."
      intro="Reset Room is not a diagnosis or a substitute for professional care. If things feel unsafe or urgent, please contact a person who can be with you now."
    >
      <div className="mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#e8b6aa] bg-[#f8e1dc] p-7 shadow-[0_18px_45px_rgba(45,74,94,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9b6258]">
                Immediate support
              </p>
              <h2 className="serif mt-3 text-2xl leading-tight">
                If you might hurt yourself or someone else
              </h2>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#efc4b8] text-2xl" aria-hidden="true">
              ♡
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            In the U.S., call or text{" "}
            <a className="resource-link" href="tel:988">
              988
            </a>{" "}
            for the Suicide & Crisis Lifeline, or call{" "}
            <a className="resource-link" href="tel:911">
              911
            </a>{" "}
            for immediate danger. You can also{" "}
            <a
              className="resource-link"
              href="https://988lifeline.org/chat/"
              target="_blank"
              rel="noreferrer"
            >
              chat with 988
            </a>
            .
          </p>
        </article>
        <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#b8d6d2] bg-[#dcebe8] p-7 shadow-[0_18px_45px_rgba(45,74,94,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#527b7b]">
                Find ongoing care
              </p>
              <h2 className="serif mt-3 text-2xl leading-tight">
                Campus support
              </h2>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#b9d9d2] text-2xl" aria-hidden="true">
              ✦
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            For the U.S. launch region, use your school&apos;s verified
            counseling or health-center number from its official .edu site. The{" "}
            <a
              className="resource-link"
              href="https://www.samhsa.gov/find-help"
              target="_blank"
              rel="noreferrer"
            >
              SAMHSA treatment locator
            </a>{" "}
            can find local care, and{" "}
            <a
              className="font-bold underline"
              href="https://www.crisistextline.org/"
              target="_blank"
              rel="noreferrer"
            >
              Crisis Text Line
            </a>{" "}
            is available by texting HOME to 741741.
          </p>
        </article>
      </div>
    </Shell>
  );
}
