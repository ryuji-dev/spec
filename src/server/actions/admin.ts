"use server";
// 관리자 전용 계정 관리. 계정 발급과 비밀번호 재설정(이메일 미사용 정책 — 분실 시 관리자 경유).
// 입력은 zod 검증, 사용자 생성은 Supabase Auth(service-role), 권한은 진입부에서 서버 재확인.
import { z } from "zod";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseService } from "@/server/supabase/service";
import { newPasswordSchema } from "@/lib/dto/auth";

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
  const supabase = createSupabaseService();

  // handle_new_user 트리거가 프로필을 항상 member로 생성한다(메타데이터 role 미신뢰).
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, title, church },
  });

  if (error || !data?.user) {
    const duplicate = error && /registered|already|exists/i.test(error.message);
    return {
      error: duplicate ? "이미 등록된 이메일입니다." : "계정 생성에 실패했습니다.",
    };
  }

  // role은 생성 후 service-role로만 설정(guard 트리거가 service_role 허용).
  const { error: roleErr } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", data.user.id);
  if (roleErr) return { error: "역할 설정에 실패했습니다." };

  return { success: `${name} 계정을 생성했습니다.` };
}

export interface AdminResetPasswordState {
  error?: string;
  success?: string;
}

// 회원 비밀번호 재설정 — 이메일 발송 미사용 정책의 분실 대응. 관리자가 임시 비밀번호를
// 정해 오프라인(전화·카톡)으로 전달하고, 회원은 로그인 후 /reset-password에서 직접 변경한다.
export async function adminResetPassword(
  _prev: AdminResetPasswordState,
  formData: FormData,
): Promise<AdminResetPasswordState> {
  await requireAdmin();

  const emailParsed = z.email().safeParse(formData.get("email"));
  if (!emailParsed.success) {
    return { error: "이메일 형식을 확인해주세요." };
  }
  const pwParsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!pwParsed.success) {
    return { error: pwParsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const email = emailParsed.data.toLowerCase();
  const supabase = createSupabaseService();

  // 이메일 → user id 조회. listUsers 순회(노회 규모 전제, 회원 수 증가 시 RPC로 전환).
  let userId: string | undefined;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return { error: "사용자 조회에 실패했습니다." };
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) {
      userId = hit.id;
      break;
    }
    if (data.users.length < 100) break;
  }
  if (!userId) return { error: "해당 이메일의 계정이 없습니다." };

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: pwParsed.data.password,
  });
  if (error) return { error: "비밀번호 재설정에 실패했습니다." };

  return { success: `${email} 비밀번호를 재설정했습니다.` };
}
