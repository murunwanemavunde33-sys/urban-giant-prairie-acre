import raw from "./papers.json";

export type FileKind =
  | "paper"
  | "memo"
  | "addendum"
  | "answerbook"
  | "data"
  | "erratum"
  | "other";

export type Lang = "en" | "af" | "bilingual" | "unspecified";

export type PaperFile = {
  id: string;
  title: string;
  url: string;
  kind: FileKind;
  language: Lang;
  paper: number | null;
  ext: string;
};

export type PaperSet = {
  id: string;
  grade: number;
  subject: string;
  year: number;
  sitting: string;
  body: string;
  province: string;
  files: PaperFile[];
};

export const CATALOG = raw.papers as PaperSet[];

export const GRADES = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const SITTING_ORDER = [
  "November",
  "Preparatory",
  "May/June",
  "June common",
  "June",
  "GEC",
  "Exemplar",
];

const GROUPS = ["All", "Languages", "Maths & sciences", "Commerce", "Technology", "Arts & life"] as const;
export type SubjectGroup = (typeof GROUPS)[number];
export const SUBJECT_GROUPS: SubjectGroup[] = [...GROUPS];

const FEATURED = [
  "Mathematics",
  "Mathematical Literacy",
  "Physical Sciences",
  "Life Sciences",
  "Accounting",
  "Business Studies",
  "Economics",
  "Geography",
  "History",
  "English Home Language",
  "English First Additional Language",
  "Afrikaans Home Language",
  "Afrikaans First Additional Language",
  "isiZulu Home Language",
  "isiXhosa Home Language",
  "Life Orientation",
];

export function phaseOf(grade: number) {
  if (grade <= 6) return "Intermediate";
  if (grade <= 9) return "Senior";
  return "FET";
}

export function groupOf(subject: string): Exclude<SubjectGroup, "All"> {
  const s = subject.toLowerCase();
  if (
    /language|afrikaans|english|isizulu|isixhosa|isindebele|sepedi|sesotho|setswana|siswati|tshivenda|xitsonga|sign language/.test(
      s,
    )
  ) {
    return "Languages";
  }
  if (/math|science|agricultural science|marine/.test(s)) return "Maths & sciences";
  if (/accounting|business|econom|tourism/.test(s)) return "Commerce";
  if (/technolog|computer|information|engineering|civil|electrical|mechanical/.test(s)) {
    return "Technology";
  }
  return "Arts & life";
}

export function sourceLabel(set: PaperSet) {
  if (set.body === "DBE") return "National · DBE";
  return `${set.province} · ${set.body}`;
}

export function kindLabel(kind: FileKind) {
  switch (kind) {
    case "paper":
      return "Question paper";
    case "memo":
      return "Memorandum";
    case "addendum":
      return "Addendum";
    case "answerbook":
      return "Answer book";
    case "data":
      return "Data files";
    case "erratum":
      return "Erratum";
    default:
      return "Document";
  }
}

export function langLabel(lang: Lang) {
  switch (lang) {
    case "en":
      return "English";
    case "af":
      return "Afrikaans";
    case "bilingual":
      return "English & Afrikaans";
    default:
      return null;
  }
}

export function cardKey(setId: string, paper: number | null) {
  return `${setId}:p${paper ?? 0}`;
}

export type PaperCard = {
  key: string;
  set: PaperSet;
  paper: number | null;
  files: PaperFile[];
};

const KIND_RANK: Record<FileKind, number> = {
  paper: 0,
  addendum: 1,
  answerbook: 2,
  data: 3,
  memo: 4,
  erratum: 5,
  other: 6,
};

export function cardsFor(sets: PaperSet[]): PaperCard[] {
  const cards: PaperCard[] = [];
  const sorted = [...sets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const sa = SITTING_ORDER.indexOf(a.sitting);
    const sb = SITTING_ORDER.indexOf(b.sitting);
    return (sa === -1 ? 99 : sa) - (sb === -1 ? 99 : sb);
  });
  for (const set of sorted) {
    const buckets = new Map<number | null, PaperFile[]>();
    for (const file of set.files) {
      const key = file.paper;
      const list = buckets.get(key) ?? [];
      list.push(file);
      buckets.set(key, list);
    }
    const papers = [...buckets.keys()].sort((a, b) => (a ?? 99) - (b ?? 99));
    for (const paper of papers) {
      const files = (buckets.get(paper) ?? []).slice().sort((a, b) => {
        const d = KIND_RANK[a.kind] - KIND_RANK[b.kind];
        if (d !== 0) return d;
        return a.language.localeCompare(b.language);
      });
      cards.push({ key: cardKey(set.id, paper), set, paper, files });
    }
  }
  return cards;
}

export function setsForGrade(grade: number) {
  return CATALOG.filter((p) => p.grade === grade);
}

export function subjectsFor(grade: number, group: SubjectGroup) {
  const counts = new Map<string, { papers: number; memos: number; sets: number }>();
  for (const set of setsForGrade(grade)) {
    if (group !== "All" && groupOf(set.subject) !== group) continue;
    const row = counts.get(set.subject) ?? { papers: 0, memos: 0, sets: 0 };
    row.sets += 1;
    for (const file of set.files) {
      if (file.kind === "paper") row.papers += 1;
      if (file.kind === "memo") row.memos += 1;
    }
    counts.set(set.subject, row);
  }
  return [...counts.entries()]
    .map(([subject, stats]) => ({ subject, ...stats }))
    .sort((a, b) => {
      const ia = FEATURED.indexOf(a.subject);
      const ib = FEATURED.indexOf(b.subject);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.subject.localeCompare(b.subject);
    });
}

export function yearsFor(grade: number, subject?: string) {
  const years = new Set<number>();
  for (const set of CATALOG) {
    if (set.grade !== grade) continue;
    if (subject && set.subject !== subject) continue;
    years.add(set.year);
  }
  return [...years].sort((a, b) => b - a);
}

export function sittingsFor(grade: number, subject?: string) {
  const sittings = new Set<string>();
  for (const set of CATALOG) {
    if (set.grade !== grade) continue;
    if (subject && set.subject !== subject) continue;
    sittings.add(set.sitting);
  }
  return [...sittings].sort(
    (a, b) =>
      (SITTING_ORDER.indexOf(a) === -1 ? 99 : SITTING_ORDER.indexOf(a)) -
      (SITTING_ORDER.indexOf(b) === -1 ? 99 : SITTING_ORDER.indexOf(b)),
  );
}

export const TOTAL_FILES = CATALOG.reduce((n, set) => n + set.files.length, 0);
export const TOTAL_MEMOS = CATALOG.reduce(
  (n, set) => n + set.files.filter((f) => f.kind === "memo").length,
  0,
);
export const TOTAL_PAPERS = CATALOG.reduce(
  (n, set) => n + set.files.filter((f) => f.kind === "paper").length,
  0,
);

export function coverageNote(grade: number) {
  switch (grade) {
    case 12:
      return "National DBE question papers and memorandums for every sitting the department published from 2019 to 2025, plus Eastern Cape prelim and June common papers.";
    case 11:
      return "Eastern Cape November common papers for 2019 and 2022–2025. Grade 11 is not a national exam, so other provinces publish their own papers separately.";
    case 10:
      return "Eastern Cape released a 2019 November set and a handful of exemplars. A full national Grade 10 archive for 2019–2025 does not exist.";
    case 9:
      return "Eastern Cape Grade 9 exams for 2019, and General Education Certificate pilot papers for the years that province published.";
    case 4:
      return "Only the 2025 Eastern Cape tests that were put online. Grades 4 to 8 have no national past-paper archive for 2019–2025.";
    default:
      return "No department has published a Grade " + grade + " past-paper set for 2019–2025 that we can link to. National papers in this library are the Grade 12 NSC exams.";
  }
}
