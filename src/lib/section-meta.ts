import type { Database } from "@/lib/database.types";
import type { PhotoTileType } from "@/lib/main-page-data";

export type PostSection = Database["public"]["Enums"]["post_section"];

// 섹션 → 한글 라벨(목록 뱃지·태그 폴백).
export const SECTION_LABEL: Record<PostSection, string> = {
  notice: "공지",
  board: "게시판",
  committee: "교육위원회",
  training: "강습회",
  webzine: "웹진",
  resource: "자료",
};

// 섹션 → 공개 상세 경로. 'resource'는 라우트가 복수형(/resources).
export const SECTION_ROUTE: Record<PostSection, string> = {
  notice: "/notice",
  board: "/board",
  committee: "/committee",
  training: "/training",
  webzine: "/webzine",
  resource: "/resources",
};

// 섹션 → 사진 그라데이션 폴백 타입(실이미지 대신 브랜드 그라데이션).
export const SECTION_PHOTO_TYPE: Record<PostSection, PhotoTileType> = {
  notice: "mountain",
  board: "music",
  committee: "meeting",
  training: "camp",
  webzine: "book",
  resource: "book",
};
