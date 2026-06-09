# 로그인·회원가입 페이지 디자인 이식 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 정책(중요):** 이 저장소는 "사용자가 명시 요청할 때만 커밋/PR"이 원칙이다. 아래 각 Task의 커밋 단계는 **사용자 승인 후** 실행한다. 무단 커밋 금지.

**Goal:** Claude Design 번들의 로그인 디자인과 사용자 제공 회원가입 디자인을 `/login`·`/signup` 두 라우트로 이식하고, 화면간 이동·인터랙션(비밀번호 토글·zod 클라이언트 검증)까지 구현한다. 실제 가입·Google OAuth 연동은 범위 밖.

**Architecture:** 좌측 사진 히어로 + 우측 폼의 스플릿 스크린. 좌측 히어로와 로고·폼 스타일은 공통 컴포넌트로 추출하고, 로그인/회원가입은 각자 라우트의 Server Component(page) + Client Component(form)로 구성한다. 디자인은 inline-style 원본을 **CSS Module**로 캡슐화(헌법 [7] 보존), 테마는 원본 활성값 **dark + gold**로 고정 해석한다.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, CSS Modules, zod, Supabase Auth(기존 `login` 액션 재사용). 폰트는 기존 `next/font`(`--font-noto-*`, `--font-inter`, `--font-cormorant`).

---

## 사전 완료 사항 (이미 처리됨)

- 번들 언팩 완료: `_design/auth/`(login.template.html, asset0~2, design-system.css) — gitignore.
- 히어로 이미지 추출 완료: `public/images/auth-hero.webp`.
- 원본 컴포넌트 분석 완료: `_design/auth/asset1.js`(AuthScreen/AuthForm/AuthHero/Field), `asset2.js`(BrandMark/BrandLockup/Button).

## 디자인 토큰 해석표 (dark + gold, 원본 `buildTheme` 기준)

| 용도 | 값 |
|------|-----|
| 폼/히어로 배경 | `#1A1410` |
| 폼 패널 오버레이 | `radial-gradient(120% 90% at 50% -10%, rgba(45,74,62,0.22) 0%, rgba(26,20,16,0) 55%)` |
| 본문 텍스트 | `#F5F1E8` |
| muted | `rgba(245,241,232,0.55)` |
| label | `rgba(245,241,232,0.92)` |
| line(구분선) | `rgba(245,241,232,0.16)` |
| input 배경 | `rgba(245,241,232,0.05)` |
| input 테두리 | `rgba(245,241,232,0.18)` |
| oauth hover | `rgba(245,241,232,0.11)` |
| accent(골드) | `#C9A96E` |
| accent 글로우 | `0 10px 34px rgba(201,169,110,0.45)` |
| link/kicker(골드, dark) | `#D9C18C` |
| 폰트 sans | `var(--font-noto-sans-kr)` |
| 폰트 serif | `var(--font-noto-serif-kr)` |
| 폰트 label | `var(--font-inter)` |
| dur-fast | `0.2s` |

## 파일 구조

```
src/lib/dto/
  auth.ts                                  # Create: loginSchema, signupSchema (zod, 클라/서버 공용)
src/app/(public)/_components/auth/
  auth.module.css                          # Create: 공통 스타일(grid·hero·form·input·button·footer)
  AuthLayout.tsx                           # Create: 스플릿 그리드 + 히어로 + {children}
  BrandLockup.tsx                          # Create: 십자가 마크 + 국/영문 명칭
  PasswordInput.tsx                        # Create: 'use client', 표시/숨김 토글 input
src/app/(public)/login/
  page.tsx                                 # Modify: 디자인 교체(AuthLayout + LoginForm)
  LoginForm.tsx                            # Modify: 새 디자인 + 기존 login 액션 유지
src/app/(public)/signup/
  page.tsx                                 # Create: AuthLayout + SignupForm
  SignupForm.tsx                           # Create: 'use client', signupSchema 검증 + 스텁 제출
src/server/actions/auth.ts                 # Modify: loginSchema를 lib/dto/auth.ts에서 import
public/images/auth-hero.webp               # (완료)
```

## 검증 방식 (테스트 러너 없음)

이 저장소는 자동 테스트 프레임워크가 없다. 각 Task는 다음으로 검증한다:
- **타입/린트**: `pnpm lint` (TypeScript strict 포함)
- **빌드**: `pnpm build`
- **시각 검증**: `pnpm dev` 후 Claude Preview로 `/login`·`/signup` 렌더 → 원본 스크린샷과 비교.

---

### Task 1: 공유 zod 스키마 (`lib/dto/auth.ts`) + 기존 액션 리팩터

**Files:**
- Create: `src/lib/dto/auth.ts`
- Modify: `src/server/actions/auth.ts` (인라인 loginSchema 제거 → import)

- [ ] **Step 1: 스키마 파일 작성**

`src/lib/dto/auth.ts`:
```typescript
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
    terms: z.boolean().refine((v) => v === true, "약관에 동의해주세요."),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });
export type SignupInput = z.infer<typeof signupSchema>;
```

- [ ] **Step 2: 기존 액션이 공유 스키마를 쓰도록 수정**

`src/server/actions/auth.ts` 상단에서 인라인 `loginSchema` 정의를 삭제하고 import로 교체:
```typescript
import { loginSchema } from "@/lib/dto/auth";
```
(파일 내 `const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });` 블록 제거. `login` 함수의 `loginSchema.safeParse(...)` 호출은 그대로 둔다. `z` import가 더 이상 쓰이지 않으면 제거.)

- [ ] **Step 3: 린트/타입 검증**

Run: `pnpm lint`
Expected: 통과 (auth.ts·dto/auth.ts 오류 없음)

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add src/lib/dto/auth.ts src/server/actions/auth.ts
git commit -m "refactor: 인증 zod 스키마를 lib/dto/auth.ts로 분리(로그인·회원가입 공용)"
```

---

### Task 2: 공통 스타일 모듈 (`auth.module.css`)

**Files:**
- Create: `src/app/(public)/_components/auth/auth.module.css`

- [ ] **Step 1: 스타일 모듈 작성**

`src/app/(public)/_components/auth/auth.module.css`:
```css
/* 로그인·회원가입 공통 — 디자인 원본(_design/auth) dark+gold 테마 해석. 헌법 [7] 보존. */

/* 레이아웃 */
.grid {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 47%) 1fr;
}

/* 좌측 히어로 */
.hero {
  position: relative;
  overflow: hidden;
  background: #1a1410;
  min-height: 660px;
}
.heroImg {
  position: absolute;
  inset: 0;
  background-image: url("/images/auth-hero.webp");
  background-size: cover;
  background-position: center;
  transform: scale(1.04);
}
.heroGrad {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    155deg,
    rgba(45, 74, 62, 0.45) 0%,
    rgba(26, 20, 16, 0.42) 42%,
    rgba(26, 20, 16, 0.9) 100%
  );
}
.heroDots {
  position: absolute;
  inset: 0;
  z-index: 2;
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255, 255, 255, 0.05) 1px,
    transparent 0
  );
  background-size: 3px 3px;
  mix-blend-mode: overlay;
}
.heroContent {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 46px 52px;
  color: #fff;
}
.heroKicker {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
  font-family: var(--font-inter), sans-serif;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.78);
}
.heroKicker::before {
  content: "";
  width: 22px;
  height: 1px;
  background: rgba(245, 241, 232, 0.4);
}
.heroEyebrow {
  font-family: var(--font-inter), sans-serif;
  font-size: 11px;
  letter-spacing: 0.32em;
  opacity: 0.72;
  margin-bottom: 22px;
}
.heroTitle {
  margin: 0;
  font-family: var(--font-noto-serif-kr), serif;
  font-size: 46px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: -0.025em;
}
.heroTitle em {
  font-style: italic;
  font-weight: 300;
  color: #d9c18c;
}
.heroQuoteWrap {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid rgba(245, 241, 232, 0.2);
  max-width: 400px;
}
.heroQuote {
  margin: 0;
  font-family: var(--font-noto-serif-kr), serif;
  font-size: 16px;
  line-height: 1.65;
  opacity: 0.92;
  letter-spacing: -0.01em;
}
.heroCite {
  margin: 12px 0 0;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 11px;
  opacity: 0.58;
  letter-spacing: 0.08em;
}

/* 우측 폼 사이드 */
.formSide {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 44px;
  background: #1a1410;
  min-height: 660px;
}
.formPanel {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    120% 90% at 50% -10%,
    rgba(45, 74, 62, 0.22) 0%,
    rgba(26, 20, 16, 0) 55%
  );
}
.formInner {
  position: relative;
  width: 100%;
  max-width: 396px;
}

/* 브랜드 락업 */
.brandRow {
  display: flex;
  justify-content: center;
  margin-bottom: 34px;
}
.lockup {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.mark {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  flex-shrink: 0;
}
.lockupKo {
  display: block;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #fff;
  white-space: nowrap;
}
.lockupEn {
  display: block;
  margin-top: 2px;
  font-family: var(--font-inter), sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

/* OAuth(구글) 버튼 — 이번엔 disabled */
.oauth {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 16px;
  background: rgba(245, 241, 232, 0.05);
  border: 1px solid rgba(245, 241, 232, 0.18);
  border-radius: 8px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #f5f1e8;
  cursor: pointer;
  transition: background var(--auth-dur, 0.2s);
}
.oauth:hover:not(:disabled) {
  background: rgba(245, 241, 232, 0.11);
}
.oauth:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 구분선 */
.divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 0;
}
.dividerLine {
  flex: 1;
  height: 1px;
  background: rgba(245, 241, 232, 0.16);
}
.dividerText {
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: rgba(245, 241, 232, 0.55);
}

/* 폼 */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.twoCol {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field {
  display: block;
}
.label {
  display: block;
  margin-bottom: 8px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: rgba(245, 241, 232, 0.92);
}
.labelRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.inputWrap {
  position: relative;
  display: block;
}
.input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px;
  background: rgba(245, 241, 232, 0.05);
  border: 1px solid rgba(245, 241, 232, 0.18);
  border-radius: 8px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14px;
  color: #f5f1e8;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.input::placeholder {
  color: rgba(245, 241, 232, 0.4);
}
.input:focus {
  border-color: rgba(201, 169, 110, 0.6);
}
.inputEye {
  padding-right: 44px;
}
.eyeBtn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(245, 241, 232, 0.55);
  display: inline-flex;
  padding: 2px;
}
.forgot {
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #d9c18c;
  text-decoration: none;
}

/* 약관 동의 */
.terms {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(245, 241, 232, 0.55);
  cursor: pointer;
}
.terms input {
  margin-top: 2px;
  width: 15px;
  height: 15px;
  accent-color: #c9a96e;
  flex-shrink: 0;
}
.termsLink {
  color: #d9c18c;
  font-weight: 600;
}

/* 제출 버튼 (accent/gold) */
.submit {
  width: 100%;
  margin-top: 6px;
  padding: 15px 28px;
  border: 1px solid #c9a96e;
  border-radius: 8px;
  background: #c9a96e;
  color: #2a2520;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 34px rgba(201, 169, 110, 0.45);
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.submit:hover:not(:disabled) {
  transform: translateY(-1px);
}
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 하단 토글 + 오류 */
.footer {
  margin-top: 28px;
  text-align: center;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 13px;
  color: rgba(245, 241, 232, 0.55);
}
.footerLink {
  color: #d9c18c;
  font-weight: 700;
  text-decoration: none;
}
.error {
  margin: 0;
  color: #e6907f;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 12.5px;
}

/* 모바일 — 원본엔 브레이크포인트 없음(데스크톱 전용). 사용성 위해 최소 스택 추가. */
@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .hero {
    display: none;
  }
  .formSide {
    padding: 40px 20px;
  }
}
```

- [ ] **Step 2: 빌드 검증 (CSS 파싱 오류 없음 확인)**

Run: `pnpm build`
Expected: 통과 (이 모듈은 아직 import되지 않으므로 빌드만 깨지지 않으면 OK)

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/_components/auth/auth.module.css"
git commit -m "feat: 인증 화면 공통 스타일 모듈 추가(로그인·회원가입 dark+gold)"
```

---

### Task 3: 공통 컴포넌트 (`AuthLayout`, `BrandLockup`, `PasswordInput`, `GoogleMark`)

**Files:**
- Create: `src/app/(public)/_components/auth/BrandLockup.tsx`
- Create: `src/app/(public)/_components/auth/AuthLayout.tsx`
- Create: `src/app/(public)/_components/auth/PasswordInput.tsx`
- Create: `src/app/(public)/_components/auth/GoogleMark.tsx`

- [ ] **Step 1: BrandLockup 작성 (Server Component)**

`src/app/(public)/_components/auth/BrandLockup.tsx`:
```tsx
import styles from "./auth.module.css";

// 십자가 마크 + 국/영문 명칭. 원본 BrandLockup(dark variant) 그대로.
export default function BrandLockup() {
  return (
    <span className={styles.lockup}>
      <span className={styles.mark}>
        <svg width="12.8" height="20.8" viewBox="0 0 12 20" fill="none" aria-hidden="true">
          <rect x="5" y="0" width="2" height="20" fill="#fff" />
          <rect x="0" y="5" width="12" height="2" fill="#fff" />
        </svg>
      </span>
      <span style={{ lineHeight: 1.2, minWidth: 0 }}>
        <span className={styles.lockupKo}>서경노회 교육위원회</span>
        <span className={styles.lockupEn}>
          Seogyeong Presbytery Education Committee
        </span>
      </span>
    </span>
  );
}
```

- [ ] **Step 2: AuthLayout 작성 (Server Component)**

`src/app/(public)/_components/auth/AuthLayout.tsx`:
```tsx
import type { ReactNode } from "react";
import styles from "./auth.module.css";

// 좌측 사진 히어로 + 우측 폼(children)의 스플릿 스크린. 원본 AuthScreen/AuthHero 구조.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.grid}>
      <div className={styles.hero}>
        <div className={styles.heroImg} />
        <div className={styles.heroGrad} />
        <div className={styles.heroDots} />
        <div className={styles.heroContent}>
          <div className={styles.heroKicker}>서경노회 · 교육위원회</div>
          <div>
            <div className={styles.heroEyebrow}>EDUCATION · COMMUNITY · FAITH</div>
            <h2 className={styles.heroTitle}>
              가르치는 자의
              <br />
              <em>거룩한 부르심</em>
            </h2>
            <div className={styles.heroQuoteWrap}>
              <p className={styles.heroQuote}>
                보라 형제가 연합하여 동거함이
                <br />
                어찌 그리 선하고 아름다운고
              </p>
              <p className={styles.heroCite}>— 시편 133:1</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.formSide}>
        <div className={styles.formPanel} />
        <div className={styles.formInner}>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: PasswordInput 작성 (Client Component, 표시/숨김 토글)**

`src/app/(public)/_components/auth/PasswordInput.tsx`:
```tsx
"use client";
import { useState } from "react";
import styles from "./auth.module.css";

type Props = {
  name: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
};

// 비밀번호 입력 + 눈 아이콘 토글. 원본 Field(withEye) 동작 그대로.
export default function PasswordInput({
  name,
  placeholder,
  autoComplete,
  value,
  onChange,
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <span className={styles.inputWrap}>
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.input} ${styles.inputEye}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 표시"}
        className={styles.eyeBtn}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9s2.7-4.5 7-4.5S16 9 16 9s-2.7 4.5-7 4.5S2 9 2 9Z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9s2.7-4.5 7-4.5S16 9 16 9s-2.7 4.5-7 4.5S2 9 2 9Z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3 15 15 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </span>
  );
}
```

- [ ] **Step 4: GoogleMark 작성 (공통 G 로고)**

`src/app/(public)/_components/auth/GoogleMark.tsx`:
```tsx
// 구글 G 로고. 원본 GoogleG 그대로.
export default function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
```

- [ ] **Step 5: 린트 검증**

Run: `pnpm lint`
Expected: 통과

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/_components/auth/"
git commit -m "feat: 인증 공통 컴포넌트 추가(AuthLayout·BrandLockup·PasswordInput·GoogleMark)"
```

---

### Task 4: 로그인 페이지 디자인 교체

**Files:**
- Modify: `src/app/(public)/login/page.tsx`
- Modify: `src/app/(public)/login/LoginForm.tsx`

- [ ] **Step 1: page.tsx 교체**

`src/app/(public)/login/page.tsx`:
```tsx
import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
```

- [ ] **Step 2: LoginForm.tsx 교체 (기존 login 액션 유지)**

`src/app/(public)/login/LoginForm.tsx`:
```tsx
"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { login, type LoginState } from "@/server/actions/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import GoogleMark from "../_components/auth/GoogleMark";
import styles from "../_components/auth/auth.module.css";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [password, setPassword] = useState("");

  return (
    <>
      <div className={styles.brandRow}>
        <BrandLockup />
      </div>

      <button type="button" className={styles.oauth} disabled aria-disabled="true">
        <GoogleMark /> Google로 계속하기
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>또는</span>
        <span className={styles.dividerLine} />
      </div>

      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.inputWrap}>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={styles.input}
            />
          </span>
        </label>

        <div>
          <div className={styles.labelRow}>
            <span className={styles.label} style={{ marginBottom: 0 }}>비밀번호</span>
            <span className={styles.forgot} aria-disabled="true">비밀번호를 잊으셨나요?</span>
          </div>
          <PasswordInput
            name="password"
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        {state.error && (
          <p role="alert" className={styles.error}>{state.error}</p>
        )}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <div className={styles.footer}>
        계정이 없으신가요?{" "}
        <Link href="/signup" className={styles.footerLink}>회원가입</Link>
      </div>
    </>
  );
}
```

> 주의: `GoogleMark`·`BrandLockup`·`PasswordInput`은 Task 3에서 생성됨. "비밀번호를 잊으셨나요?"는 기능 미연동이라 비활성 표기(링크 아님).

- [ ] **Step 3: 빌드/린트 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과

- [ ] **Step 4: 시각 검증**

Run: `pnpm dev` → Claude Preview로 `http://localhost:3000/login`
Expected: 원본 로그인 스크린샷과 동일 — 좌측 히어로, 우측 골드 CTA, Google 버튼 비활성, 비밀번호 토글 동작, "회원가입" 링크 → `/signup` 이동.

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/login/"
git commit -m "feat: 로그인 페이지 디자인 이식(번들 dark+gold)"
```

---

### Task 5: 회원가입 페이지 신설

**Files:**
- Create: `src/app/(public)/signup/page.tsx`
- Create: `src/app/(public)/signup/SignupForm.tsx`

- [ ] **Step 1: page.tsx 작성 (Server Component)**

`src/app/(public)/signup/page.tsx`:
```tsx
import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
```

- [ ] **Step 2: SignupForm 작성 (Client, zod 검증 + 스텁 제출)**

`src/app/(public)/signup/SignupForm.tsx`:
```tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { signupSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import GoogleMark from "../_components/auth/GoogleMark";
import styles from "../_components/auth/auth.module.css";

type Errors = Partial<
  Record<"name" | "email" | "password" | "passwordConfirm" | "terms" | "form", string>
>;

export default function SignupForm() {
  const [f, setF] = useState({
    name: "",
    church: "",
    email: "",
    password: "",
    passwordConfirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const set =
    (k: keyof typeof f) =>
    (v: string | boolean) =>
      setF((p) => ({ ...p, [k]: v }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(f);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    // 디자인 단계: 실제 가입은 미연동(기능 단계에서 signupSchema 공유 Server Action 연결).
    setDone(true);
  }

  return (
    <>
      <div className={styles.brandRow}>
        <BrandLockup />
      </div>

      <button type="button" className={styles.oauth} disabled aria-disabled="true">
        <GoogleMark /> Google로 계속하기
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>또는</span>
        <span className={styles.dividerLine} />
      </div>

      <form onSubmit={onSubmit} className={styles.form} noValidate>
        <div className={styles.twoCol}>
          <label className={styles.field}>
            <span className={styles.label}>성함</span>
            <span className={styles.inputWrap}>
              <input
                className={styles.input}
                placeholder="홍길동"
                autoComplete="name"
                value={f.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>소속 교회</span>
            <span className={styles.inputWrap}>
              <input
                className={styles.input}
                placeholder="서경중앙교회"
                autoComplete="organization"
                value={f.church}
                onChange={(e) => set("church")(e.target.value)}
              />
            </span>
          </label>
        </div>
        {errors.name && <p className={styles.error}>{errors.name}</p>}

        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.inputWrap}>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={f.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </span>
        </label>
        {errors.email && <p className={styles.error}>{errors.email}</p>}

        <div>
          <span className={styles.label}>비밀번호</span>
          <PasswordInput
            name="password"
            placeholder="8자 이상 입력하세요"
            autoComplete="new-password"
            value={f.password}
            onChange={set("password")}
          />
        </div>
        {errors.password && <p className={styles.error}>{errors.password}</p>}

        <div>
          <span className={styles.label}>비밀번호 확인</span>
          <PasswordInput
            name="passwordConfirm"
            placeholder="비밀번호를 다시 입력하세요"
            autoComplete="new-password"
            value={f.passwordConfirm}
            onChange={set("passwordConfirm")}
          />
        </div>
        {errors.passwordConfirm && (
          <p className={styles.error}>{errors.passwordConfirm}</p>
        )}

        <label className={styles.terms}>
          <input
            type="checkbox"
            checked={f.terms}
            onChange={(e) => set("terms")(e.target.checked)}
          />
          <span>
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>이용약관</a> 및{" "}
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>개인정보 처리방침</a>에 동의합니다.
          </span>
        </label>
        {errors.terms && <p className={styles.error}>{errors.terms}</p>}

        {done && (
          <p className={styles.error} style={{ color: "#9DB08F" }}>
            입력이 확인되었습니다. (가입 기능은 준비 중입니다)
          </p>
        )}

        <button type="submit" className={styles.submit}>가입하기</button>
      </form>

      <div className={styles.footer}>
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className={styles.footerLink}>로그인</Link>
      </div>
    </>
  );
}
```

- [ ] **Step 3: 빌드/린트 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과

- [ ] **Step 4: 시각 검증**

Run: `pnpm dev` → Claude Preview로 `http://localhost:3000/signup`
Expected: 사용자 제공 회원가입 이미지와 동일 — 성함/소속교회 2열, 이메일, 비밀번호·확인(토글), 약관 체크박스, 골드 "가입하기", "로그인" 링크. 빈 값/불일치/약관 미동의 시 zod 오류 표시.

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/signup/"
git commit -m "feat: 회원가입 페이지 신설(이미지 기준, zod 클라이언트 검증)"
```

---

### Task 6: 최종 통합 검증

**Files:** (없음 — 검증만)

- [ ] **Step 1: 전체 린트/빌드**

Run: `pnpm lint && pnpm build`
Expected: 통과

- [ ] **Step 2: 양방향 이동·인터랙션 확인**

Run: `pnpm dev` → Claude Preview
- `/login` → "회원가입" → `/signup` → "로그인" → `/login` 왕복.
- 비밀번호 토글(로그인 1, 회원가입 2) 동작.
- 회원가입 빈 제출 → 필드별 오류, 비밀번호 불일치 → 확인란 오류, 약관 미동의 → 오류.
- 데스크톱/모바일(<=860px) 레이아웃 확인.

- [ ] **Step 3: 정리 확인**

- `_design/`은 gitignore이므로 커밋에 포함되지 않음을 확인: `git status --short` 에 `_design/` 없음.
- `public/images/auth-hero.webp`는 커밋에 포함.

---

## Self-Review (작성자 점검 결과)

- **Spec 커버리지**: 로그인 이식(Task 4) · 회원가입 신설(Task 5) · 좌측 히어로 공통화(Task 3 AuthLayout) · zod 공유 스키마(Task 1) · 비밀번호 토글/링크 이동/약관/Google disabled(Task 3·4·5) · 검증(Task 6) — 모두 매핑됨.
- **범위 밖 준수**: 실제 가입 Server Action·Google OAuth·약관 페이지·proxy 변경 없음(스텁/placeholder/disabled로 처리).
- **타입 일관성**: `loginSchema`/`signupSchema`/`SignupInput` 명칭, `LoginState`(기존) 재사용, `PasswordInput` props(name·placeholder·autoComplete·value·onChange) Task 3 정의와 Task 4·5 사용 일치.
- **의존성**: `GoogleMark`·`BrandLockup`·`PasswordInput`은 Task 3에서 모두 생성 → Task 4·5가 안전하게 참조(순서 의존 해소).
- **알려진 디자인 편차(확인 필요)**: 원본 번들에는 모바일 브레이크포인트가 없음 → `@media (max-width:860px)` 최소 스택 규칙을 추가함. 원본 100% 보존 원칙과 충돌하므로 사용자 확인 권장.
