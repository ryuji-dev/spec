// 오픈 리다이렉트 방지 — 내부 절대경로('/'로 시작)만 허용한다.
// 프로토콜-상대 URL('//evil.com')·역슬래시 변형('/\evil')은 외부로 빠질 수 있어 차단.
export function safeNext(
  next: string | null | undefined,
  fallback = "/main",
): string {
  if (!next || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
