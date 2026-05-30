"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 마우스 휠 다운(또는 터치 스와이프 업) 시 지정한 경로로 한 번만 이동.
 * 헌법 [7]: 디자인 보존을 위해 시각적 마크업은 그대로 두고, 인터랙션만 추가하는 클라이언트 컴포넌트.
 */
export default function ScrollToEnter({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    let fired = false;

    const navigateOnce = () => {
      if (fired) return;
      fired = true;
      router.push(href);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) navigateOnce();
    };

    let touchStartY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const currentY = e.touches[0]?.clientY ?? touchStartY;
      // 위로 스와이프 = 아래쪽으로 스크롤 의도
      if (touchStartY - currentY > 30) navigateOnce();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [router, href]);

  return null;
}
