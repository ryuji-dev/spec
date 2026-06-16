"use client";
import { useState } from "react";
import type { PhotoTileType } from "@/lib/main-page-data";
import PhotoThumb from "./PhotoThumb";

// 실이미지 썸네일 — 로드 실패 시 브랜드 그라데이션(PhotoThumb)으로 폴백(graceful degradation).
export default function PhotoTileThumb({
  imageId,
  type,
  idPrefix,
}: {
  imageId: string;
  type: PhotoTileType;
  idPrefix: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <PhotoThumb type={type} idPrefix={idPrefix} />;
  return (
    // 사설 API 라우트(service-role 스트리밍) + 디자인 보존 위해 next/image 대신 img 사용.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/files/${imageId}`}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
