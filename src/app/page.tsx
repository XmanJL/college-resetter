"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
type Visibility = "private" | "personal_only" | "anonymous_community";
type Session = {
  id?: string;
  thought: string;
  tags: string[];
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
const initial: Session = {
  thought: "",
  tags: [],
  state: "",
  activity: "",
  nextStep: "",
  duration: "25 minutes",
  saved: false,
  visibility: "private",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("home");
  const [session, setSession] = useState<Session>(initial);
  const [account, setAccount] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [dashboard, setDashboard] = useState<Record<string, unknown>[]>([]);
  const update = (changes: Partial<Session>) =>
    setSession((current) => ({ ...current, ...changes }));
  const signOut = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAccount(false);
    setDashboard([]);
    setStage("home");
    setAuthNotice("You have been logged out safely.");
  };
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="grain pointer-events-none fixed inset-0" />
      <aside className="site-header site-sidebar" aria-label="Main navigation">
        <div className="site-header-inner sidebar-inner">
          <p className="sidebar-title">Your Space</p>
          <nav className="site-nav" aria-label="Reset Room features">
            <button onClick={() => setStage("home")} className="feature-link">
              <Image
                src="/images/reset-room.png"
                alt=""
                width={48}
                height={48}
              />
              <span>Reset room</span>
            </button>
            <button
              onClick={() => setStage("community")}
              className="feature-link"
            >
              <Image
                src="/images/community.png"
                alt=""
                width={48}
                height={48}
              />
              <span>Community</span>
            </button>
            <button
              onClick={() => setStage("resources")}
              className="feature-link"
            >
              <Image
                src="/images/support-resources.png"
                alt=""
                width={48}
                height={48}
              />
              <span>Resources</span>
            </button>
            <button
              onClick={() => {
                setStage("dashboard");
                fetch("/api/sessions")
                  .then((r) => (r.ok ? r.json() : []))
                  .then(setDashboard);
              }}
              className="feature-link"
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
            onStart={() => setStage("unload")}
            onCommunity={() => setStage("community")}
          />
        )}
        {stage === "unload" && (
          <Unload
            session={session}
            update={update}
            next={() => setStage("relieve")}
          />
        )}
        {stage === "relieve" && (
          <Relieve
            session={session}
            update={update}
            next={() => setStage("checkpoint")}
          />
        )}
        {stage === "checkpoint" && (
          <Checkpoint
            next={() => setStage("reset")}
            repeat={() => setStage("relieve")}
            save={() => setStage("save")}
          />
        )}
        {stage === "reset" && (
          <Reset
            session={session}
            update={update}
            next={() => setStage("save")}
          />
        )}
        {stage === "save" && (
          <Save
            session={session}
            setSession={setSession}
            dashboard={dashboard}
            setDashboard={setDashboard}
            account={account}
            done={() => {
              update({ saved: true });
              setStage("home");
            }}
          />
        )}
        {stage === "dashboard" && (
          <Dashboard
            sessions={dashboard}
            back={() => setStage("home")}
            onDelete={(id) =>
              setDashboard(dashboard.filter((item) => item.id !== id))
            }
          />
        )}
        {stage === "community" && <Community back={() => setStage("home")} />}
        {stage === "resources" && <Resources back={() => setStage("home")} />}
        {authOpen && (
          <AuthPanel
            close={() => setAuthOpen(false)}
            onSignedIn={(name) => {
              setAccount(true);
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
  title: string;
  intro: string;
}) {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-14 lg:px-10 lg:pt-20">
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
  return (
    <section className="relative z-10 mx-auto grid max-w-6xl gap-16 px-6 pb-20 pt-14 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-10 lg:pt-24">
      <div className="fade-up">
        <p className="mb-6 text-xs font-bold uppercase tracking-[.2em] text-[var(--coral-dark)]">
          A softer place to begin again
        </p>
        <h1 className="serif max-w-3xl text-6xl leading-[.92] tracking-[-.05em] sm:text-8xl">
          You don&apos;t have to solve it all{" "}
          <em className="font-normal text-[var(--coral)]">right now.</em>
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-8 text-[var(--muted)]">
          A private reset room for when college feels like too much. Put it
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
            &quot;I can&apos;t make the whole week okay. I can make the next ten
            minutes gentler.&quot;
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
            <span className="text-3xl">↘</span>
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
}: {
  session: Session;
  update: (c: Partial<Session>) => void;
  next: () => void;
}) {
  return (
    <Shell
      eyebrow="01 / unload"
      title="What's taking up space?"
      intro="There's no right way to say it. A sentence, a list, or a beautiful mess all count."
    >
      <div className="mt-12 max-w-3xl">
        <textarea
          autoFocus
          value={session.thought}
          onChange={(e) => update({ thought: e.target.value })}
          placeholder="I keep thinking about..."
          className="min-h-52 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-xl leading-8 outline-none focus:border-[var(--coral)]"
        />
        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold">
            Any threads you want to name?{" "}
            <span className="font-normal text-[var(--muted)]">optional</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  update({
                    tags: session.tags.includes(tag)
                      ? session.tags.filter((item) => item !== tag)
                      : [...session.tags, tag],
                  })
                }
                className={`rounded-full border px-4 py-2 text-sm ${session.tags.includes(tag) ? "border-[var(--coral)] bg-[#dcebf3] text-[var(--coral-dark)]" : "border-[var(--line)] text-[var(--muted)]"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-6">
          <span className="text-sm text-[var(--muted)]">
            Saved privately as you go
          </span>
          <button
            onClick={next}
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white"
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
}: {
  session: Session;
  update: (c: Partial<Session>) => void;
  next: () => void;
}) {
  return (
    <Shell
      eyebrow="02 / relieve"
      title="First, let's lower the volume."
      intro="You don't need to feel great. Just a tiny bit less alone inside the noise. What is closest right now?"
    >
      <div className="mt-10 max-w-3xl">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {["anxious", "scattered", "exhausted", "numb", "frustrated"].map(
            (state) => (
              <button
                key={state}
                onClick={() => update({ state })}
                className={`rounded-xl border px-3 py-4 text-sm capitalize ${session.state === state ? "border-[var(--coral)] bg-[#dcebf3] font-bold text-[var(--coral-dark)]" : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"}`}
              >
                {state}
              </button>
            ),
          )}
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
        <div className="mt-10 flex justify-end">
          <button
            disabled={!session.activity}
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
  save,
}: {
  next: () => void;
  repeat: () => void;
  save: () => void;
}) {
  return (
    <Shell
      eyebrow="a small checkpoint"
      title="Is there 2% more room now?"
      intro="That is enough. You can move toward one small thing, take another pause, or save this moment exactly as it is."
    >
      <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
        <button
          onClick={next}
          className="rounded-2xl bg-[var(--ink)] p-6 text-left text-white"
        >
          <span className="text-2xl">→</span>
          <h2 className="mt-8 text-lg font-bold">
            I&apos;m ready to choose a next step
          </h2>
        </button>
        <button
          onClick={repeat}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-left"
        >
          <span className="text-2xl">↺</span>
          <h2 className="mt-8 text-lg font-bold">One more minute of relief</h2>
        </button>
        <button
          onClick={save}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-left"
        >
          <span className="text-2xl">□</span>
          <h2 className="mt-8 text-lg font-bold">Save and come back later</h2>
        </button>
      </div>
    </Shell>
  );
}

function Reset({
  session,
  update,
  next,
}: {
  session: Session;
  update: (c: Partial<Session>) => void;
  next: () => void;
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
        <textarea
          value={session.nextStep}
          onChange={(e) => update({ nextStep: e.target.value })}
          placeholder="For the next 25 minutes, I will..."
          className="min-h-32 w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-lg outline-none focus:border-[var(--coral)]"
        />
        <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mt-8 flex justify-end">
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
  done,
}: {
  session: Session;
  setSession: (s: Session) => void;
  dashboard: Record<string, unknown>[];
  setDashboard: (s: Record<string, unknown>[]) => void;
  account: boolean;
  done: () => void;
}) {
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const save = async () => {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thought: session.thought,
        tags: session.tags,
        state: session.state,
        activity: session.activity,
        next_step: session.nextStep,
        duration: session.duration,
        visibility: session.visibility,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Sign in to save your reset server-side.");
      return;
    }
    setSession({ ...session, id: data.id, saved: true });
    setDashboard([data, ...dashboard]);
    setMessage("Saved to your private dashboard.");
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
          {session.duration} · {session.visibility.replace("_", " ")}
        </p>
        <div className="mt-7 border-t border-[var(--line)] pt-6">
          <p className="text-sm font-bold">Visibility</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(
              [
                "private",
                "personal_only",
                "anonymous_community",
              ] as Visibility[]
            ).map((value) => (
              <button
                key={value}
                onClick={() => setSession({ ...session, visibility: value })}
                className={`rounded-xl border p-3 text-left text-sm ${session.visibility === value ? "border-[var(--coral)] bg-[#dcebf3]" : "border-[var(--line)]"}`}
              >
                <span className="font-bold">{value.replace("_", " ")}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {value === "private"
                    ? "Delete or export anytime."
                    : value === "personal_only"
                      ? "Only you, across devices."
                      : "Share only the preview below anonymously."}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--line)] pt-6">
          <button
            onClick={() => setPreview(!preview)}
            className="text-sm font-bold underline underline-offset-4"
          >
            Preview what could be shared
          </button>
          {preview && (
            <div className="mt-4 rounded-xl bg-[#e3edf4] p-5">
              <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
                anonymous preview
              </p>
              <p className="serif mt-3 text-xl leading-8">
                {session.thought || session.nextStep || "Nothing to share yet."}
              </p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Your name, email, and private notes never appear here.
              </p>
            </div>
          )}
        </div>
        {message && (
          <p className="mt-5 rounded-xl bg-[#dbe9e8] p-4 text-sm text-[#476b76]">
            {message}
          </p>
        )}
        <button
          onClick={save}
          className="mt-8 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white"
        >
          {account ? "Save to my dashboard" : "Sign in to save securely"}
        </button>
        {session.id && (
          <div className="mt-4 flex gap-4 text-sm">
            <a
              href={`/api/sessions/${session.id}/export`}
              className="underline"
            >
              Export JSON
            </a>
            <button
              onClick={async () => {
                await fetch(`/api/sessions/${session.id}`, {
                  method: "DELETE",
                });
                setMessage("Deleted from your dashboard.");
                done();
              }}
              className="text-[var(--coral-dark)] underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Community({ back }: { back: () => void }) {
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [optIn, setOptIn] = useState(false);
  useEffect(() => {
    fetch("/api/community")
      .then((response) => response.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);
  return (
    <Shell
      eyebrow="community / anonymous"
      title="You are not the only one carrying it."
      intro="A quiet, read-only wall of thoughts shared by students who chose to be seen without being identified. No advice, no fixing. Just recognition."
    >
      <div className="mt-8 max-w-4xl rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <label className="flex items-start gap-3 text-sm">
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
              This is optional. Posts are anonymous, moderated, and never
              include private sessions.
            </span>
          </span>
        </label>
      </div>
      {optIn ? (
        <div className="mt-5 grid max-w-4xl gap-4 sm:grid-cols-2">
          {posts.length ? (
            posts.map((post, index) => (
              <article
                key={String(post.id)}
                className={`rounded-2xl p-7 ${index % 2 ? "bg-[#dcecf0]" : "bg-[#e3edf4]"}`}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  {String(post.topic || "general")} · anonymous
                </p>
                <p className="serif mt-10 text-2xl leading-8">
                  {String(post.body)}
                </p>
                <div className="mt-10 flex gap-4 text-sm font-bold">
                  <button
                    onClick={() =>
                      fetch(`/api/community/${String(post.id)}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "react" }),
                      })
                    }
                  >
                    ♡ feel this too
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
                    className="font-normal text-[var(--muted)]"
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
        <div className="mt-5 max-w-4xl rounded-2xl bg-[#dbe9e8] p-7 text-sm text-[#476b76]">
          Community is hidden. Turn it on above whenever you want to browse
          shared thoughts.
        </div>
      )}
      <button
        onClick={back}
        className="mt-10 text-sm font-bold underline underline-offset-4"
      >
        Back to reset room
      </button>
    </Shell>
  );
}

function Dashboard({
  sessions,
  back,
  onDelete,
}: {
  sessions: Record<string, unknown>[];
  back: () => void;
  onDelete: (id: unknown) => void;
}) {
  return (
    <Shell
      eyebrow="your room / personal"
      title="A place to come back to."
      intro="Your saved resets live here, protected by your account. You can export or delete any one of them."
    >
      <div className="mt-10 max-w-4xl">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            No saved resets yet. Finish a reset and choose “save to my
            dashboard.”
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map((item) => (
              <article
                key={String(item.id)}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6"
              >
                <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
                  {String(item.visibility || "private").replace("_", " ")}
                </p>
                <p className="serif mt-4 text-2xl">
                  {String(item.next_step || item.thought || "A quiet moment")}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {String(item.duration || "")} ·{" "}
                  {item.created_at
                    ? new Date(String(item.created_at)).toLocaleDateString()
                    : "just now"}
                </p>
                <div className="mt-6 flex gap-4 text-sm">
                  <a
                    href={`/api/sessions/${String(item.id)}/export`}
                    className="underline"
                  >
                    Export
                  </a>
                  <button
                    onClick={async () => {
                      await fetch(`/api/sessions/${String(item.id)}`, {
                        method: "DELETE",
                      });
                      onDelete(item.id);
                    }}
                    className="text-[var(--coral-dark)] underline"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        <button
          onClick={back}
          className="mt-10 text-sm font-bold underline underline-offset-4"
        >
          Back to reset room
        </button>
      </div>
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

function Resources({ back }: { back: () => void }) {
  return (
    <Shell
      eyebrow="support, when you need it"
      title="You deserve human support too."
      intro="Reset Room is not a diagnosis or a substitute for professional care. If things feel unsafe or urgent, please contact a person who can be with you now."
    >
      <div className="mt-10 grid max-w-3xl gap-3">
        <div className="rounded-2xl bg-[#dcebf3] p-6">
          <p className="font-bold">
            If you might hurt yourself or someone else
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            In the U.S., call or text{" "}
            <a className="font-bold underline" href="tel:988">
              988
            </a>{" "}
            for the Suicide & Crisis Lifeline, or call{" "}
            <a className="font-bold underline" href="tel:911">
              911
            </a>{" "}
            for immediate danger. You can also{" "}
            <a
              className="font-bold underline"
              href="https://988lifeline.org/chat/"
              target="_blank"
              rel="noreferrer"
            >
              chat with 988
            </a>
            .
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <p className="font-bold">Campus support</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            For the U.S. launch region, use your school&apos;s verified
            counseling or health-center number from its official .edu site. The{" "}
            <a
              className="font-bold underline"
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
        </div>
      </div>
      <button
        onClick={back}
        className="mt-10 text-sm font-bold underline underline-offset-4"
      >
        Back to reset room
      </button>
    </Shell>
  );
}
