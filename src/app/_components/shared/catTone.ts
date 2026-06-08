/**
 * 카테고리 칩 표시에 쓰이는 색상 토큰 타입.
 * 카테고리 → CatTone 매핑은 각 페이지(committee, training)에서 자체 정의.
 * 디자인 원본 board.jsx 의 catTone() 결과 형식을 그대로 따라간다.
 */

export type CatTone = {
  bg: string;
  fg: string;
  soft: string;
};
