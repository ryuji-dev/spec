/**
 * 교역자수련회 — 공용 타입 정의.
 * 디자인 뷰모델 타입. 데이터는 server/services/training.ts(events·posts)에서 공급.
 */

export type TrainingCategoryKo = "예정" | "신청" | "후기" | "강의자료" | "Q&A";
export type TrainingCategoryEn =
  | "UPCOMING"
  | "OPEN"
  | "REVIEW"
  | "MATERIALS"
  | "QNA";

export type CoverKind =
  | "mountain-dawn"
  | "autumn"
  | "youth"
  | "desert"
  | "pine"
  | "lake"
  | "field";

export type UpcomingTraining = {
  id: string;
  badge: string;
  cat: string;
  title: string;
  subtitle: string;
  theme: string;
  dates: string;
  daysLeft: number;
  place: string;
  speakers: ReadonlyArray<string>;
  registered: number;
  capacity: number;
  deadline: string;
  fee: string;
  cover: CoverKind;
};

export type NextTraining = {
  id: string;
  badge: string;
  cat: string;
  title: string;
  dates: string;
  place: string;
  note: string;
  cover: CoverKind;
};

export type PastTraining = {
  id: number;
  season: string;
  title: string;
  date: string;
  participants: number;
  cover: CoverKind;
  kind: "big" | "tall" | "wide" | "small";
};

export type TrainingCategory = {
  ko: TrainingCategoryKo | "전체";
  en: TrainingCategoryEn | "ALL";
  count: number;
};

export type TrainingPost = {
  id: string;
  cat: TrainingCategoryKo;
  catEn: TrainingCategoryEn;
  title: string;
  excerpt: string;
  author: string;
  authorInit: string;
  date: string;
  views: number;
  comments: number;
  attach?: number;
  isNew?: boolean;
};

export type TrainingSpeaker = {
  name: string;
  role: string;
  init: string;
  talks: number;
  affiliation: string;
};

export type ScheduleItem = {
  time: string;
  what: string;
  place: string;
  tag: string;
  highlight?: boolean;
};

export type ScheduleDay = {
  day: string;
  date: string;
  items: ReadonlyArray<ScheduleItem>;
};

export type ArchiveYear = {
  y: string;
  items: ReadonlyArray<string>;
};
