import { ExamSeed } from "./seed-helpers";
import { TOEFL_READING } from "./bank-toefl-reading";
import { TOEFL_LISTENING } from "./bank-toefl-listening";
import { IELTS_READING } from "./bank-ielts-reading";
import { IELTS_LISTENING } from "./bank-ielts-listening";
import { ACT_ENGLISH } from "./bank-act-english";
import { ACT_MATH } from "./bank-act-math";
import { ACT_READING } from "./bank-act-reading";
import { ACT_SCIENCE } from "./bank-act-science";
import { C1_USE_OF_ENGLISH } from "./bank-c1-use-of-english";
import { C1_READING } from "./bank-c1-reading";
import { C1_LISTENING } from "./bank-c1-listening";
import { C2_USE_OF_ENGLISH } from "./bank-c2-use-of-english";
import { C2_READING } from "./bank-c2-reading";
import { C2_LISTENING } from "./bank-c2-listening";

// Original practice content. Not affiliated with or endorsed by ETS, IDP, the British Council,
// Cambridge University Press & Assessment or ACT, Inc. Only the objectively scoreable sections
// are included; Speaking and Writing cannot be auto-scored and Listening is transcript-based.

const base = { category: "General", provider: "Independent practice" };
const NOTE =
  "Covers the machine-scoreable sections. Speaking and Writing are not included, and Listening is presented as a transcript. Questions are original and not taken from any real test.";

export const LANGUAGE_EXAMS: ExamSeed[] = [
  {
    ...base,
    slug: "toefl-ibt-practice",
    title: "TOEFL iBT Practice",
    shortCode: "TOEFL",
    level: "English proficiency",
    sortOrder: 40,
    durationMinutes: 71,
    blueprint: { questionCount: 48, randomize: true },
    description: `TOEFL-style Reading and Listening practice: a bank of 100 questions, more than twice the 48 scored in one sitting, drawn at random for each simulation. ${NOTE} Not affiliated with or endorsed by ETS.`,
    topics: [
      { title: "Reading", questions: TOEFL_READING },
      { title: "Listening (transcript-based)", questions: TOEFL_LISTENING },
    ],
  },
  {
    ...base,
    slug: "ielts-academic-practice",
    title: "IELTS Academic Practice",
    shortCode: "IELTS",
    level: "English proficiency",
    sortOrder: 41,
    durationMinutes: 100,
    blueprint: { questionCount: 80, randomize: true },
    description: `IELTS Academic-style Reading and Listening practice: a bank of 160 questions, twice the 80 scored in one sitting, drawn at random for each simulation. ${NOTE} Not affiliated with or endorsed by IDP, the British Council or Cambridge.`,
    topics: [
      { title: "Reading", questions: IELTS_READING },
      { title: "Listening (transcript-based)", questions: IELTS_LISTENING },
    ],
  },
  {
    ...base,
    slug: "act-practice",
    title: "ACT Practice",
    shortCode: "ACT",
    level: "College admissions",
    sortOrder: 42,
    durationMinutes: 165,
    blueprint: { questionCount: 171, randomize: true },
    description: `ACT-style English, Mathematics, Reading and Science practice: a bank of 342 questions, twice the 171 in one full sitting (50 English, 45 Math, 36 Reading, 40 Science), drawn at random for each simulation. The optional Writing test is not included. Questions are original and not taken from any real test. Not affiliated with or endorsed by ACT, Inc.`,
    topics: [
      { title: "English", questions: ACT_ENGLISH },
      { title: "Mathematics", questions: ACT_MATH },
      { title: "Reading", questions: ACT_READING },
      { title: "Science", questions: ACT_SCIENCE },
    ],
  },
  {
    ...base,
    slug: "cambridge-c1-advanced",
    title: "Cambridge C1 Advanced Practice",
    shortCode: "C1",
    level: "Advanced (C1)",
    sortOrder: 43,
    durationMinutes: 130,
    blueprint: { questionCount: 86, randomize: true },
    description: `C1 Advanced-style Reading and Use of English and Listening practice: a bank of 176 questions, more than twice the 86 scored in one sitting, drawn at random for each simulation. ${NOTE} Not affiliated with or endorsed by Cambridge University Press & Assessment.`,
    topics: [
      { title: "Reading and Use of English", questions: [...C1_USE_OF_ENGLISH, ...C1_READING] },
      { title: "Listening (transcript-based)", questions: C1_LISTENING },
    ],
  },
  {
    ...base,
    slug: "cambridge-c2-proficiency",
    title: "Cambridge C2 Proficiency Practice",
    shortCode: "C2",
    level: "Proficiency (C2)",
    sortOrder: 44,
    durationMinutes: 130,
    blueprint: { questionCount: 83, randomize: true },
    description: `C2 Proficiency-style Reading and Use of English and Listening practice: a bank of 168 questions, twice the 83 scored in one sitting, drawn at random for each simulation. ${NOTE} Not affiliated with or endorsed by Cambridge University Press & Assessment.`,
    topics: [
      { title: "Reading and Use of English", questions: [...C2_USE_OF_ENGLISH, ...C2_READING] },
      { title: "Listening (transcript-based)", questions: C2_LISTENING },
    ],
  },
];
