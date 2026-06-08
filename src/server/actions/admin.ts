"use server";
// 관리자 전용 계정 생성. 일반 가입 경로는 없고 admin이 회원·관리자 계정을 직접 발급한다.
// 입력은 zod 검증, 사용자 생성은 Supabase Auth(service-role), 권한은 진입부에서 서버 재확인.
import { z } from "zod";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseService } from "@/server/supabase/service";

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
