import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 디자인 원본 번들(gitignore). React 18 CDN/Babel 환경 기준이라 React 19 strict 룰과 충돌.
    "_design/**",
    // 하니스 git 워크트리(.claude/worktrees/*)는 각자 .next 빌드 출력·_design을 가진다.
    // 루트에서 lint 시 중첩 경로(.claude/worktrees/*/.next)는 위 패턴에 안 잡히므로 통째로 제외.
    ".claude/**",
  ]),
]);

export default eslintConfig;
