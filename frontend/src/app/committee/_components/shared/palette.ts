/**
 * 교육위원회 게시판에서 사용하는 forest 팔레트.
 * 디자인 원본 `_design/.../app.jsx` PALETTES.forest 와 globals.css `:root` 변수 모두와 일치.
 * inline style 환경에서 객체로 전달하기 위해 모듈로 노출.
 */

export type Palette = {
  bg: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  muted: string;
  line: string;
};

export const FOREST_PALETTE: Palette = {
  bg: "#F5F1E8",
  surface: "#FBF8F1",
  primary: "#2D4A3E",
  secondary: "#7A8B6F",
  accent: "#C9A96E",
  ink: "#2A2520",
  muted: "#6B5F52",
  line: "rgba(42, 37, 32, 0.12)",
};
