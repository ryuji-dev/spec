// 자료공유 순수 매퍼 검증 — DB 없이.
//   실행: pnpm resource:verify
import {
  toResourceFileView,
  categoryToType,
  formatBytes,
  RESOURCE_CATEGORY_EN,
} from "../src/lib/resource.ts";
import {
  preCheck as resPreCheck,
  resolveMime as resResolveMime,
  RES_MAX_FILE_BYTES,
} from "../src/lib/resource-upload.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

assert(categoryToType("악보") === "score", "악보 → score");
assert(categoryToType("영상") === "video", "영상 → video");
assert(categoryToType(null) === "doc", "미지정 → doc 폴백");
assert(formatBytes(500) === "500 B", "B 포맷");
assert(formatBytes(8700) === "8 KB", "KB 포맷");
assert(formatBytes(13002342) === "12.4 MB", "MB 소수 포맷");
assert(formatBytes(195035136) === "186 MB", "대용량 MB 정수 포맷");
assert(RESOURCE_CATEGORY_EN["설교PPT"] === "SLIDES", "카테고리 EN 맵");

const now = new Date("2026-06-01T00:00:00Z");
const v = toResourceFileView(
  { id: "r1", category: "설교PPT", title: "봄 부흥회 PPT", excerpt: "40슬라이드 · 16:9", viewCount: 142, createdAt: new Date("2026-05-30T00:00:00Z"), authorName: "한경수", authorTitle: "목사", totalBytes: 13002342 },
  now,
);
assert(v.id === "r1" && v.type === "ppt" && v.cat === "설교PPT", "id·type·cat 매핑");
assert(v.size === "12.4 MB" && v.downloads === 142, "size·downloads");
assert(v.by === "한경수 목사" && v.date === "2026.05.30", "by·date");
assert(v.isNew === true, "7일 이내 isNew");

const v2 = toResourceFileView(
  { id: "r2", category: null, title: "t", excerpt: null, viewCount: 0, createdAt: new Date("2026-01-01T00:00:00Z"), authorName: null, authorTitle: null, totalBytes: 0 },
  now,
);
assert(v2.cat === "문서" && v2.type === "doc", "null 카테고리 → 문서/doc");
assert(v2.by === "익명" && v2.sub === "" && v2.size === "0 B", "폴백 by/sub/size");
assert(v2.isNew === false, "오래된 글 isNew=false");

// 업로드 정책
assert(resPreCheck("a.exe", 10) !== null, "[업로드] 허용 외 확장자 거부");
assert(resPreCheck("a.mp4", RES_MAX_FILE_BYTES + 1) !== null, "[업로드] 300MB 초과 거부");
assert(resPreCheck("a.mp4", 1000) === null, "[업로드] 영상 통과");
assert(resPreCheck("a.psd", 1000) === null, "[업로드] psd 통과");
assert(resResolveMime("mp4", { ext: "mp4", mime: "video/mp4" }) === "video/mp4", "[업로드] mp4 매직");
assert(resResolveMime("mov", { ext: "mov", mime: "video/quicktime" }) === "video/quicktime", "[업로드] mov 매직");
assert(resResolveMime("mp3", { ext: "mp3", mime: "audio/mpeg" }) === "audio/mpeg", "[업로드] mp3 매직");
assert(resResolveMime("wav", { ext: "wav", mime: "audio/x-wav" }) === "audio/x-wav", "[업로드] wav 매직");
assert(resResolveMime("zip", { ext: "zip", mime: "application/zip" }) === "application/zip", "[업로드] zip 매직");
assert(resResolveMime("psd", { ext: "psd", mime: "image/vnd.adobe.photoshop" }) === "image/vnd.adobe.photoshop", "[업로드] psd 매직");
assert(resResolveMime("ai", { ext: "pdf", mime: "application/pdf" }) === "application/illustrator", "[업로드] ai(pdf컨테이너) 매직");
assert(resResolveMime("mp4", { ext: "png", mime: "image/png" }) === null, "[업로드] mp4인데 이미지면 거부");
assert(resResolveMime("png", { ext: "mp4", mime: "video/mp4" }) === null, "[업로드] png인데 영상이면 거부");

console.log("\n✅ 자료공유 순수 매퍼 검증 통과");
