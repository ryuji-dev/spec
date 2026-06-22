/**
 * 교육위원회 게시판 공용 타입 + 정적 보조 데이터.
 * 게시글·카테고리·인기글은 server/services/committee.ts 에서 실데이터로 제공한다.
 * 여기에는 타입 정의와 정적 태그(BD_TAGS)만 남긴다.
 */

export type PostCategoryKo = "공지" | "회의록" | "수련회" | "자료실" | "나눔";
export type PostCategoryEn =
  | "NOTICE"
  | "MINUTES"
  | "TRAINING"
  | "LIBRARY"
  | "SHARE";

export type Post = {
  id: string;
  cat: PostCategoryKo;
  catEn: PostCategoryEn;
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

export type PostCategory = {
  ko: PostCategoryKo | "전체";
  en: PostCategoryEn | "ALL";
  count: number;
};

export type PopularPost = { id: string; title: string; views: number };

export const BD_TAGS: ReadonlyArray<string> = [
  "#수련회",
  "#주일학교",
  "#성경고사",
  "#교사",
  "#공과",
  "#설교문",
  "#예배",
  "#커리큘럼",
  "#대담",
  "#나눔",
];

export type SideAuthor = {
  name: string;
  role: string;
  init: string;
  posts: number;
};
