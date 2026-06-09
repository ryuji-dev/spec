// JWT 페이로드에서 user_role 커스텀 클레임만 디코드한다(서명 검증이 아니라 값 추출용).
// 검증은 Supabase가 토큰 발급 시 수행하므로 여기서는 클레임만 읽는다.
export function readUserRole(
  accessToken: string | undefined | null,
): string | undefined {
  if (!accessToken) return undefined;
  try {
    let b64 = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64)).user_role ?? undefined;
  } catch {
    return undefined;
  }
}
