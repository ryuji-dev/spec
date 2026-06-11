// 인증 입력 스키마 — 클라이언트 검증과 서버 검증이 공유한다(server-only 의존 없음).
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "성함을 입력해주세요."),
    church: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || null),
    email: z.email("이메일 형식을 확인해주세요."),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    passwordConfirm: z.string(),
    terms: z.boolean().refine((v) => v === true, {
      message: "약관에 동의해주세요.",
    }),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
