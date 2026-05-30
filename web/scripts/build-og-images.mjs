// 시그니처(signature-seogyeong-white.png)를 흰 캔버스에 합성해 플랫폼별 OG 이미지를 만든다.
// 사용: pnpm og:build (혹은 node scripts/build-og-images.mjs)
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const SRC = join(root, "public", "signature-seogyeong-white.png");
const OUT_DIR = join(root, "public", "og");

// 캔버스마다 시그니처가 차지할 가로 비율은 다르게 둔다.
// 가로형 시그니처라 1:1 / 9:16 같은 좁은 캔버스일수록 폭을 더 넉넉히 잡아야 글씨가 가독선을 넘는다.
const VARIANTS = [
  { file: "og-default.png", width: 1200, height: 630, sigRatio: 0.72 },
  { file: "og-kakao.png", width: 800, height: 400, sigRatio: 0.78 },
  { file: "og-square.png", width: 1080, height: 1080, sigRatio: 0.8 },
  { file: "og-story.png", width: 1080, height: 1920, sigRatio: 0.8 },
];

async function build() {
  await mkdir(OUT_DIR, { recursive: true });

  const srcMeta = await sharp(SRC).metadata();
  if (!srcMeta.width || !srcMeta.height) {
    throw new Error("signature-seogyeong-white.png 메타데이터를 읽지 못했습니다.");
  }
  const srcRatio = srcMeta.height / srcMeta.width;

  for (const v of VARIANTS) {
    const sigW = Math.round(v.width * v.sigRatio);
    const sigH = Math.round(sigW * srcRatio);

    const sigBuffer = await sharp(SRC)
      .resize({ width: sigW, height: sigH, fit: "fill" })
      .png()
      .toBuffer();

    const left = Math.round((v.width - sigW) / 2);
    const top = Math.round((v.height - sigH) / 2);

    const outPath = join(OUT_DIR, v.file);
    await sharp({
      create: {
        width: v.width,
        height: v.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: sigBuffer, left, top }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log(`✓ ${v.file}  ${v.width}x${v.height}  (signature ${sigW}x${sigH})`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
