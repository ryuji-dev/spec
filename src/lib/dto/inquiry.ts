// 고객지원 문의 입력 스키마 — 클라이언트 검증과 서버 검증이 공유(server-only 의존 없음).
import { z } from "zod";

export const INQUIRY_CATEGORIES = ["general", "password"] as const;
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export const inquirySchema = z.object({
  category: z.enum(INQUIRY_CATEGORIES),
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50, "이름은 50자 이내로 입력해주세요."),
  email: z.email("이메일 형식을 확인해주세요."),
  contact: z
    .string()
    .trim()
    .max(100, "연락처는 100자 이내로 입력해주세요.")
    .optional()
    .transform((v) => v || null),
  body: z
    .string()
    .trim()
    .min(5, "문의 내용을 5자 이상 입력해주세요.")
    .max(2000, "문의 내용은 2000자 이내로 입력해주세요."),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export const answerSchema = z.object({
  id: z.uuid(),
  answer: z
    .string()
    .trim()
    .min(1, "답변을 입력해주세요.")
    .max(2000, "답변은 2000자 이내로 입력해주세요."),
});
