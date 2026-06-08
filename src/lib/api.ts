// 클라이언트 fetch 단일 래퍼. Route Handler 응답 {ok,data}/{ok,error} 스키마를 파싱.
// 직접 fetch 금지 — 클라이언트에서 Route Handler 호출은 반드시 이 래퍼를 거친다.
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

async function parse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("INVALID_RESPONSE", "서버 응답을 해석할 수 없습니다.");
  }
  if (!json.ok) throw new ApiError(json.error.code, json.error.message);
  return json.data;
}

export async function apiGet<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { method: "GET" }));
}

export async function apiPostForm<T>(url: string, form: FormData): Promise<T> {
  return parse<T>(await fetch(url, { method: "POST", body: form }));
}

export async function apiDelete<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { method: "DELETE" }));
}

// UUID v4 형식 검사 — 잘못된 경로 세그먼트를 DB 조회 전에 차단(Postgres 22P02 500 방지).
export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
