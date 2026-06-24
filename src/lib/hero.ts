// 히어로 — 클라이언트 안전 타입. DB·server-only 의존 없음.

// 공개 히어로 컴포넌트가 받는 슬라이드 뷰.
export type HeroSlideView = { url: string; alt: string };

// 업로드 허용 이미지 확장자(공개 버킷 정책).
export const HERO_IMAGE_EXT: Record<string, "image"> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
};
