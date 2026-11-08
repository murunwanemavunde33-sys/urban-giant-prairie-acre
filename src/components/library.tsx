import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import {
  CATALOG,
  GRADES,
  SUBJECT_GROUPS,
  TOTAL_FILES,
  TOTAL_MEMOS,
  TOTAL_PAPERS,
  cardsFor,
  coverageNote,
  kindLabel,
  langLabel,
  phaseOf,
  setsForGrade,
  sittingsFor,
  sourceLabel,
  subjectsFor,
  yearsFor,
  type PaperCard,
  type SubjectGroup,
} from "@/data/catalog";
import { useStudy } from "@/lib/study";

const number = new Intl.NumberFormat("en-ZA");

export function Library() {
  const [grade, setGrade] = useState(12);
  const [group, setGroup] = useState<SubjectGroup>("All");
  const [subject, setSubject] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | "all">("all");
  const [sitting, setSitting] = useState<string>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  const saved = useStudy((s) => s.saved);
  const done = useStudy((s) => s.done);
  const toggleSaved = useStudy((s) => s.toggleSaved);
  const toggleDone = useStudy((s) => s.toggleDone);

  useEffect(() => {
    void useStudy.persist.rehydrate();
    setMounted(true);
  }, []);

  const savedCount = mounted ? Object.values(saved).filter(Boolean).length : 0;
  const subjects = useMemo(() => subjectsFor(grade, group), [grade, group]);
  const years = useMemo(() => yearsFor(grade, subject ?? undefined), [grade, subject]);
  const sittings = useMemo(
    () => sittingsFor(grade, subject ?? undefined),
    [grade, subject],
  );

  const detailCards = useMemo(() => {
    if (!subject) return [];
    const sets = setsForGrade(grade).filter((set) => {
      if (set.subject !== subject) return false;
      if (year !== "all" && set.year !== year) return false;
      if (sitting !== "all" && set.sitting !== sitting) return false;
      return true;
    });
    return cardsFor(sets);
  }, [grade, subject, year, sitting]);

  const searchCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const sets = CATALOG.filter((set) => {
      if (set.grade !== grade) return false;
      const blob = `${set.subject} ${set.year} ${set.sitting} ${set.province} ${set.files
        .map((f) => f.title)
        .join(" ")}`.toLowerCase();
      return blob.includes(q);
    });
    return cardsFor(sets).slice(0, 60);
  }, [query, grade]);

  const savedCards = useMemo(() => {
    if (!savedOnly) return [];
    return cardsFor(CATALOG).filter((card) => saved[card.key]);
  }, [savedOnly, saved]);

  const searching = query.trim().length >= 2 && !savedOnly;
  const showGrid = !subject && !searching && !savedOnly;

  function pickGrade(next: number) {
    setGrade(next);
    setSubject(null);
    setYear("all");
    setSitting("all");
    setSavedOnly(false);
    setGroup("All");
  }

  function pickSubject(name: string) {
    setSubject(name);
    setYear("all");
    setSitting("all");
    setQuery("");
    setSavedOnly(false);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-stamp font-display text-2xl text-stamp-ink">
                V
              </span>
              <div>
                <p className="font-display text-2xl leading-none tracking-tight">Vula</p>
                <p className="mt-1 text-sm text-muted">Past papers and memorandums</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSavedOnly((v) => !v);
                setSubject(null);
                setQuery("");
              }}
              className={
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors " +
                (savedOnly
                  ? "border-stamp bg-stamp text-stamp-ink"
                  : "border-line bg-paper text-ink")
              }
            >
              <Bookmark className="size-4" aria-hidden="true" />
              Saved
              <span className="tabular-nums">{savedCount}</span>
            </button>
          </div>

          <div className="max-w-2xl">
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
              Every published paper, sitting next to its memorandum.
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted">
              Grades 4 to 12, 2019 to 2025. {number.format(TOTAL_PAPERS)} question papers and{" "}
              {number.format(TOTAL_MEMOS)} memorandums — {number.format(TOTAL_FILES)} official files
              in all. They open on the department site. Vula only organises them.
            </p>
          </div>

          <label className="relative block max-w-xl">
            <span className="sr-only">Search papers</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSavedOnly(false);
                setSubject(null);
              }}
              placeholder="Search a subject, year, or paper"
              className="min-h-11 w-full rounded-full border border-line bg-paper pr-4 pl-10 text-base text-ink placeholder:text-muted"
            />
          </label>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {GRADES.map((g) => {
            const active = g === grade && !savedOnly;
            const count = setsForGrade(g).length;
            return (
              <button
                key={g}
                type="button"
                onClick={() => pickGrade(g)}
                className={
                  "flex min-h-11 shrink-0 flex-col items-start rounded-xl border px-3 py-2 text-left " +
                  (active
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-ink")
                }
              >
                <span className="text-sm font-medium">Grade {g}</span>
                <span className={"text-xs " + (active ? "text-paper-deep" : "text-muted")}>
                  {phaseOf(g)}
                  {count === 0 ? " · none published" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {savedOnly ? (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl">Saved for revision</h2>
            {savedCards.length === 0 ? (
              <Empty
                title="Nothing saved yet"
                body="Open a subject and bookmark a paper. Your list stays on this device."
              />
            ) : (
              <CardList
                cards={savedCards}
                saved={mounted ? saved : {}}
                done={mounted ? done : {}}
                onSave={toggleSaved}
                onDone={toggleDone}
              />
            )}
          </section>
        ) : searching ? (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl">
              Results in Grade {grade}
              <span className="ml-2 font-sans text-base font-normal text-muted">
                {searchCards.length === 60 ? "First 60" : searchCards.length}
              </span>
            </h2>
            {searchCards.length === 0 ? (
              <Empty
                title="No match in this grade"
                body="Try another grade, or a shorter word such as Maths, History, or 2023."
              />
            ) : (
              <CardList
                cards={searchCards}
                saved={mounted ? saved : {}}
                done={mounted ? done : {}}
                onSave={toggleSaved}
                onDone={toggleDone}
              />
            )}
          </section>
        ) : showGrid ? (
          <section className="flex flex-col gap-4">
            <p className="max-w-3xl text-sm text-muted">{coverageNote(grade)}</p>
            {subjects.length === 0 ? (
              <Empty
                title={`No Grade ${grade} papers in this library`}
                body={coverageNote(grade)}
                links
              />
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto">
                  {SUBJECT_GROUPS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setGroup(item)}
                      className={
                        "min-h-11 shrink-0 rounded-full border px-4 text-sm " +
                        (group === item
                          ? "border-ink bg-ink text-paper"
                          : "border-line bg-card text-ink")
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subjects.map((item) => (
                    <li key={item.subject}>
                      <button
                        type="button"
                        onClick={() => pickSubject(item.subject)}
                        className="flex min-h-24 w-full flex-col items-start justify-between rounded-2xl border border-line bg-card px-4 py-4 text-left transition-colors hover:border-ink"
                      >
                        <span className="font-display text-xl leading-tight">{item.subject}</span>
                        <span className="mt-3 text-sm text-muted">
                          {item.papers} question {item.papers === 1 ? "paper" : "papers"}
                          {item.memos > 0 ? " · memorandum included" : " · no memorandum yet"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSubject(null)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                All subjects
              </button>
              <h2 className="font-display text-2xl">
                Grade {grade} {subject}
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 overflow-x-auto">
                <FilterChip active={year === "all"} onClick={() => setYear("all")}>
                  All years
                </FilterChip>
                {years.map((item) => (
                  <FilterChip key={item} active={year === item} onClick={() => setYear(item)}>
                    {item}
                  </FilterChip>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <FilterChip active={sitting === "all"} onClick={() => setSitting("all")}>
                  All sittings
                </FilterChip>
                {sittings.map((item) => (
                  <FilterChip
                    key={item}
                    active={sitting === item}
                    onClick={() => setSitting(item)}
                  >
                    {item}
                  </FilterChip>
                ))}
              </div>
            </div>
            {detailCards.length === 0 ? (
              <Empty title="Nothing for that filter" body="Clear the year or sitting and try again." />
            ) : (
              <CardList
                cards={detailCards}
                saved={mounted ? saved : {}}
                done={mounted ? done : {}}
                onSave={toggleSaved}
                onDone={toggleDone}
              />
            )}
          </section>
        )}

        <footer className="border-t border-line pt-4 pb-8 text-sm text-muted">
          <p>
            National files are published by the{" "}
            <a
              className="underline decoration-line underline-offset-2"
              href="https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations.aspx"
              target="_blank"
              rel="noreferrer"
            >
              Department of Basic Education
            </a>
            . Provincial files linked here are from the{" "}
            <a
              className="underline decoration-line underline-offset-2"
              href="https://www.ecexams.co.za/ExaminationPapers.htm"
              target="_blank"
              rel="noreferrer"
            >
              Eastern Cape Department of Education
            </a>
            . Some downloads are ZIP folders. Grades 4–8 and most Grade 10 years were never
            published as a national set.
          </p>
        </footer>
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string | number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "min-h-11 shrink-0 rounded-full border px-4 text-sm tabular-nums " +
        (active ? "border-stamp bg-stamp text-stamp-ink" : "border-line bg-card text-ink")
      }
    >
      {children}
    </button>
  );
}

function Empty({
  title,
  body,
  links,
}: {
  title: string;
  body: string;
  links?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-8">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted">{body}</p>
      {links ? (
        <p className="mt-4 flex flex-col gap-2 text-sm">
          <a
            className="underline decoration-line underline-offset-2"
            href="https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations.aspx"
            target="_blank"
            rel="noreferrer"
          >
            DBE past exam papers
          </a>
          <a
            className="underline decoration-line underline-offset-2"
            href="https://www.ecexams.co.za/ExaminationPapers.htm"
            target="_blank"
            rel="noreferrer"
          >
            Eastern Cape examination papers
          </a>
        </p>
      ) : null}
    </div>
  );
}

function CardList({
  cards,
  saved,
  done,
  onSave,
  onDone,
}: {
  cards: PaperCard[];
  saved: Record<string, boolean>;
  done: Record<string, boolean>;
  onSave: (id: string) => void;
  onDone: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {cards.map((card) => (
        <li key={card.key}>
          <article className="rounded-2xl border border-line bg-card">
            <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-stamp uppercase">
                  {card.paper ? `Paper ${card.paper}` : "Papers"} · {card.set.sitting}{" "}
                  {card.set.year}
                </p>
                <h3 className="mt-1 font-display text-xl">
                  Grade {card.set.grade} {card.set.subject}
                </h3>
                <p className="mt-1 text-sm text-muted">{sourceLabel(card.set)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-pressed={Boolean(done[card.key])}
                  onClick={() => onDone(card.key)}
                  className={
                    "inline-flex min-h-11 items-center gap-1 rounded-full border px-3 text-sm " +
                    (done[card.key]
                      ? "border-memo bg-memo-soft text-memo"
                      : "border-line bg-paper text-ink")
                  }
                >
                  <Check className="size-4" aria-hidden="true" />
                  {done[card.key] ? "Practised" : "Mark done"}
                </button>
                <button
                  type="button"
                  aria-pressed={Boolean(saved[card.key])}
                  aria-label={saved[card.key] ? "Remove from saved" : "Save paper"}
                  onClick={() => onSave(card.key)}
                  className={
                    "inline-flex size-11 items-center justify-center rounded-full border " +
                    (saved[card.key]
                      ? "border-stamp bg-stamp text-stamp-ink"
                      : "border-line bg-paper text-ink")
                  }
                >
                  <Bookmark className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {card.files.map((file) => {
                const language = langLabel(file.language);
                const memo = file.kind === "memo";
                return (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center gap-3 px-4 py-3 text-sm hover:bg-paper"
                    >
                      <FileText
                        className={"size-4 shrink-0 " + (memo ? "text-memo" : "text-stamp")}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{kindLabel(file.kind)}</span>
                      {language ? <span className="text-muted">{language}</span> : null}
                      {file.ext === "zip" ? (
                        <span className="rounded-full bg-paper-deep px-2 py-0.5 text-xs text-ink">
                          ZIP
                        </span>
                      ) : null}
                      <ExternalLink className="ml-auto size-4 shrink-0 text-muted" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </article>
        </li>
      ))}
    </ul>
  );
}
