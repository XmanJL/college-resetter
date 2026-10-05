"use client";

import { useEffect, useState } from "react";

type Stage =
  | "home"
  | "unload"
  | "relieve"
  | "checkpoint"
  | "reset"
  | "save"
  | "community"
  | "resources";
type Session = {
  thought: string;
  tags: string[];
  state: string;
  activity: string;
  nextStep: string;
  duration: string;
  saved: boolean;
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
    "#f5dfc9",
  ],
  [
    "5–4–3–2–1 grounding",
    "Name five things you see, four you feel, three you hear, two you smell, one you taste.",
    "2 min",
    "#dce8dc",
  ],
  [
    "Small body reset",
    "Unclench your jaw. Drop your shoulders. Take one slow breath out longer than in.",
    "1 min",
    "#dce9ee",
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
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("home");
  const [session, setSession] = useState<Session>(() => {
    if (typeof window === "undefined") return initial;
    const draft = window.localStorage.getItem("reset-room-session");
    return draft ? JSON.parse(draft) : initial;
  });
  useEffect(() => {
    window.localStorage.setItem("reset-room-session", JSON.stringify(session));
  }, [session]);
  const update = (changes: Partial<Session>) =>
    setSession((current) => ({ ...current, ...changes }));
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="grain pointer-events-none fixed inset-0" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <button
          onClick={() => setStage("home")}
          className="serif text-xl font-semibold tracking-tight"
        >
          reset room<span className="text-[#e98568]">.</span>
        </button>
        <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
          <button
            onClick={() => setStage("community")}
            className="hidden hover:text-[var(--ink)] sm:block"
          >
            Community
          </button>
          <button
            onClick={() => setStage("resources")}
            className="hidden hover:text-[var(--ink)] sm:block"
          >
            Support resources
          </button>
          <span
            className="h-2 w-2 rounded-full bg-[#8cae8e]"
            title="Private by default"
          />
        </nav>
      </header>
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
          done={() => {
            update({ saved: true });
            setStage("home");
          }}
        />
      )}
      {stage === "community" && <Community back={() => setStage("home")} />}
      {stage === "resources" && <Resources back={() => setStage("home")} />}
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
            className="px-3 py-4 text-sm font-semibold text-[var(--muted)] underline decoration-[#cfcbc0] underline-offset-4"
          >
            Read shared thoughts
          </button>
        </div>
        <p className="mt-7 text-xs text-[var(--muted)]">
          No account needed to begin · private by default
        </p>
      </div>
      <div className="relative mx-auto w-full max-w-md lg:mt-8">
        <div className="absolute -inset-5 rounded-[40%] bg-[#eadfce] opacity-60 blur-3xl" />
        <div className="soft-shadow relative rounded-[28px] border border-white/70 bg-[var(--paper)] p-8 sm:p-10">
          <div className="mb-16 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>today&apos;s room</span>
            <span className="rounded-full bg-[var(--sage)] px-3 py-1 text-[#55705b]">
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
                <i className="h-7 w-1.5 rounded-full bg-[#e98568]" />
                <i className="h-11 w-1.5 rounded-full bg-[#8cae8e]" />
                <i className="h-6 w-1.5 rounded-full bg-[#d9bda4]" />
                <i className="h-9 w-1.5 rounded-full bg-[#e98568]" />
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
                className={`rounded-full border px-4 py-2 text-sm ${session.tags.includes(tag) ? "border-[var(--coral)] bg-[#fbe4da] text-[var(--coral-dark)]" : "border-[var(--line)] text-[var(--muted)]"}`}
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
                className={`rounded-xl border px-3 py-4 text-sm capitalize ${session.state === state ? "border-[var(--coral)] bg-[#fbe4da] font-bold text-[var(--coral-dark)]" : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"}`}
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
              className={`rounded-2xl border p-5 text-left ${session.activity === name ? "border-[var(--coral)] ring-2 ring-[#e98568]/20" : "border-[var(--line)]"}`}
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
        <div className="mb-6 rounded-2xl bg-[#e9eee7] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#55705b]">
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
              className={`rounded-full border px-4 py-2 text-sm ${session.duration === duration ? "border-[var(--coral)] bg-[#fbe4da] text-[var(--coral-dark)]" : "border-[var(--line)] text-[var(--muted)]"}`}
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

function Save({ session, done }: { session: Session; done: () => void }) {
  return (
    <Shell
      eyebrow="04 / keep"
      title="This stays yours."
      intro="Your reset is private by default. Nothing leaves this room unless you choose it. This demo saves your draft in this browser only."
    >
      <div className="mt-10 max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          Your next small thing
        </p>
        <p className="serif mt-4 text-3xl">
          {session.nextStep || "Come back when you have more room."}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {session.duration} · private
        </p>
        <div className="mt-8 border-t border-[var(--line)] pt-6">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Community sharing is intentionally not wired into this first pass.
            When it is added, you will preview the exact text before anything is
            shared anonymously.
          </p>
        </div>
        <button
          onClick={done}
          className="mt-8 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white"
        >
          Save my reset
        </button>
      </div>
    </Shell>
  );
}

function Community({ back }: { back: () => void }) {
  return (
    <Shell
      eyebrow="community / anonymous"
      title="You are not the only one carrying it."
      intro="A quiet, read-only wall of thoughts shared by students who chose to be seen without being identified. No advice, no fixing. Just recognition."
    >
      <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
        <article className="rounded-2xl bg-[#f5dfc9] p-7">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
            academics · anonymous
          </p>
          <p className="serif mt-10 text-2xl leading-8">
            I keep waiting for the perfect time to start, and then the day is
            gone.
          </p>
          <button className="mt-10 text-sm font-bold text-[var(--coral-dark)]">
            ♡ 18 feel this too
          </button>
        </article>
        <article className="rounded-2xl bg-[#dce9ee] p-7">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
            future · anonymous
          </p>
          <p className="serif mt-10 text-2xl leading-8">
            Everyone seems to know what they&apos;re doing. I&apos;m trying to
            remember that seems is doing a lot of work.
          </p>
          <button className="mt-10 text-sm font-bold text-[#557681]">
            ♡ 31 feel this too
          </button>
        </article>
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

function Resources({ back }: { back: () => void }) {
  return (
    <Shell
      eyebrow="support, when you need it"
      title="You deserve human support too."
      intro="Reset Room is not a diagnosis or a substitute for professional care. If things feel unsafe or urgent, please contact a person who can be with you now."
    >
      <div className="mt-10 grid max-w-3xl gap-3">
        <div className="rounded-2xl bg-[#fbe4da] p-6">
          <p className="font-bold">
            If you might hurt yourself or someone else
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Call or text 988 in the U.S. and Canada, call your local emergency
            number, or go to the nearest emergency department. If you are
            elsewhere, use your local crisis line.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <p className="font-bold">Campus support</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Your campus counseling center, health center, resident advisor, dean
            of students, or a trusted professor can help you find the next layer
            of support.
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
