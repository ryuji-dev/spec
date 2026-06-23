// KST(UTC+9) 기준 날짜 문자열 ↔ ISO timestamptz 변환. 일정 입력(날짜만)용.
const KST_OFFSET = "+09:00";

// "YYYY-MM-DD" → 그날 23:59:59(KST)의 ISO. 같은 날 종일 '다가오는 일정'에 남도록 끝시각 사용.
export function kstDateEndToIso(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59${KST_OFFSET}`).toISOString();
}

// "YYYY-MM-DD" → 그날 00:00:00(KST)의 ISO. 시작 시각용.
export function kstDateStartToIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00${KST_OFFSET}`).toISOString();
}

// ISO timestamptz → KST 기준 "YYYY-MM-DD" (edit 화면 prefill용).
// en-CA는 ISO 8601 날짜 형식(YYYY-MM-DD)을 반환하는 locale이라 선택(표시 언어와 무관).
export function isoToKstDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
