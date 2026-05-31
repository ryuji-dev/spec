"use server";
// 관리자 전용 계정 생성. 일반 가입 경로는 없고 admin이 회원·관리자 계정을 직접 발급한다.
// 입력은 zod 검증, 비밀번호는 argon2 해시, 권한은 진입부에서 서버 재확인(헌법 보안).
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { requireAdmin } from "@/server/auth/current-user";

const createUserSchema = z.object({
  email: z.email("이메일 형식을 확인해주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  title: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  church: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  role: z.enum(["admin", "member"]),
});

export interface CreateUserState {
  error?: string;
  success?: string;
}

// PostgreSQL unique_violation
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    title: formData.get("title"),
    church: formData.get("church"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { email, password, name, title, church, role } = parsed.data;
  const db = getDb();

  // 사전 중복 확인 — 흔한 케이스를 친절한 메시지로 처리한다.
  // (아래 insert의 unique 제약 + 23505 catch는 경쟁 조건 백스톱)
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { error: "이미 등록된 이메일입니다." };
  }

  const passwordHash = await hashPassword(password);

  try {
    await db
      .insert(users)
      .values({ email, passwordHash, name, title, church, role });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "이미 등록된 이메일입니다." };
    }
    throw err;
  }

  return { success: `${name} 계정을 생성했습니다.` };
}
