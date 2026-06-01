// 업로드 순수 검증 — DB·디스크 없이.
//   실행: pnpm uploads:verify
import {
  preCheck,
  resolveMime,
  extOf,
  MAX_FILE_BYTES,
} from "../src/lib/committee-upload.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

assert(extOf("a.PNG") === "png", "확장자 소문자화");
assert(extOf("noext") === "", "확장자 없음");

assert(preCheck("a.exe", 10) !== null, "허용 외 확장자 거부");
assert(preCheck("a.png", MAX_FILE_BYTES + 1) !== null, "용량 초과 거부");
assert(preCheck("a.png", 0) !== null, "빈 파일 거부");
assert(preCheck("a.png", 1000) === null, "정상 이미지 통과");

assert(resolveMime("png", { ext: "png", mime: "image/png" }) === "image/png", "png 매직 일치");
assert(resolveMime("jpg", { ext: "jpg", mime: "image/jpeg" }) === "image/jpeg", "jpg→jpeg 정규화");
assert(resolveMime("png", { ext: "pdf", mime: "application/pdf" }) === null, "확장자 png인데 pdf면 거부");
assert(resolveMime("png", null) === null, "이미지 매직 미검출 거부");

assert(resolveMime("pdf", { ext: "pdf", mime: "application/pdf" }) === "application/pdf", "pdf 통과");
assert(resolveMime("pdf", { ext: "png", mime: "image/png" }) === null, "pdf인데 이미지면 거부");

assert(
  resolveMime("docx", { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })?.includes("word"),
  "docx 구체 타입 통과",
);
assert(resolveMime("xlsx", { ext: "zip", mime: "application/zip" })?.includes("spreadsheet"), "xlsx zip 컨테이너 통과");
assert(resolveMime("hwpx", { ext: "zip", mime: "application/zip" }) === "application/hwp+zip", "hwpx zip 통과");
assert(resolveMime("docx", { ext: "cfb", mime: "application/x-cfb" }) === null, "docx인데 cfb면 거부");

assert(resolveMime("hwp", { ext: "cfb", mime: "application/x-cfb" }) === "application/x-hwp", "hwp cfb 통과");
assert(resolveMime("hwp", { ext: "zip", mime: "application/zip" }) === null, "hwp인데 zip이면 거부");

console.log("\n✅ 업로드 순수 검증 통과");
