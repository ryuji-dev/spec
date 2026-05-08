import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import type { DeviceType } from "@/lib/device";

const palette = FOREST_PALETTE;

type Props = {
  deviceType: DeviceType;
};

// iOS / Android 별 하단 safe-area (디자인 원본 ios-frame / android-frame 동일 값)
const SAFE_BOTTOM: Record<DeviceType, number> = {
  ios: 28,
  android: 14,
  desktop: 0,
};

/**
 * 신학원교수소개 모바일 — 디자인 원본 faculty.jsx 의 FacultyMobile 이식 골격.
 *
 * Step A: 라우트 동작 확인용 골격.
 * Step C 에서 모바일 전체 레이아웃을 채워 넣는다.
 */
export default function FacultyMobile({ deviceType }: Props) {
  return (
    <div
      style={{
        background: palette.bg,
        color: palette.ink,
        minHeight: "100vh",
        padding: `80px 22px ${80 + SAFE_BOTTOM[deviceType]}px`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.28em",
          fontWeight: 600,
          color: palette.muted,
          fontFamily: "Inter, system-ui",
          marginBottom: 14,
        }}
      >
        FACULTY
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: '"Noto Serif KR", serif',
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          color: palette.ink,
        }}
      >
        신학원교수소개
      </h1>
    </div>
  );
}
