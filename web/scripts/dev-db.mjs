// 로컬 개발용 PostgreSQL — Docker 없이 PGlite를 PG 와이어 프로토콜 서버로 띄운다.
// 앱은 평소처럼 postgres-js로 127.0.0.1:5432에 접속(운영 코드 무변경).
//   실행: pnpm dev:db  (next dev와 함께 별도 터미널에서)
// 영속: web/.pglite (gitignore). 최초 1회 마이그레이션 적용 + admin 시드.
import { readFileSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import argon2 from "@node-rs/argon2";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "../.pglite");
const migrationsDir = join(here, "../src/server/db/migrations");

const PORT = 5432;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@seogyeong.kr";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

const db = await PGlite.create({ dataDir });

// 최초 1회만 마이그레이션 적용 (users 테이블 유무로 판단)
const hasUsers = await db.query(
  `select 1 from information_schema.tables where table_schema='public' and table_name='users'`,
);
if (hasUsers.rows.length === 0) {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
  console.log(`[dev-db] 마이그레이션 적용: ${files.join(", ")}`);
} else {
  console.log("[dev-db] 스키마 이미 존재 — 마이그레이션 건너뜀");
}

// admin 시드 (없을 때만)
const exists = await db.query(`select 1 from users where email=$1`, [ADMIN_EMAIL]);
if (exists.rows.length === 0) {
  const hash = await argon2.hash(ADMIN_PASSWORD);
  await db.query(
    `insert into users (email, password_hash, name, title, role) values ($1,$2,$3,$4,'admin')`,
    [ADMIN_EMAIL, hash, "관리자", "교육위원회"],
  );
  console.log(`[dev-db] admin 시드: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
} else {
  console.log(`[dev-db] admin 이미 존재: ${ADMIN_EMAIL}`);
}

// 교육위원회 게시판 seed (없을 때만) — admin을 작성자로 몇 개 생성
const adminRow = await db.query(`select id from users where email=$1`, [ADMIN_EMAIL]);
const adminId = adminRow.rows[0].id;
const cExists = await db.query(`select 1 from posts where section='committee' limit 1`);
if (cExists.rows.length === 0) {
  const seed = [
    ["공지", "2026년 상반기 교육위원회 정기총회 안내", "5월 24일 주일 오후 2시, 서경교회 본당. 안건과 일정 안내.", true],
    ["회의록", "제 4차 임원회의 회의록 (2026.04.18)", "교사 수련회 일정 확정, 성경고사 본선 진행 안내.", false],
    ["수련회", "2026 봄 교사 수련회 — 사전 신청 마감 안내", "4월 30일까지 각 교회별 명단 제출 바랍니다.", false],
    ["자료실", "주일학교 봄학기 공과 PDF 일괄 다운로드", "유년부·초등부·중고등부 공과 일괄 제공.", false],
    ["나눔", "주일학교 부서 운영, 작은 교회의 한 사례", "학생 9명 교회의 1년 통합 운영 사례를 나눕니다.", false],
  ];
  for (const [cat, title, excerpt, pinned] of seed) {
    await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id, is_pinned)
       values ('committee', $1, $2, $3, $4, $5, $6)`,
      [cat, title, excerpt, excerpt + "\n\n(본문 예시)", adminId, pinned],
    );
  }
  console.log(`[dev-db] 교육위원회 글 ${seed.length}건 seed`);
} else {
  console.log("[dev-db] 교육위원회 글 이미 존재");
}

// 자료공유 seed (없을 때만) — 카테고리별 글 + placeholder 파일 + 첨부 행
const resourceDir = join(here, "../uploads/resource");
const rExists = await db.query(`select 1 from posts where section='resource' limit 1`);
if (rExists.rows.length === 0) {
  await mkdir(resourceDir, { recursive: true });
  const rseed = [
    ["설교PPT", "봄 부흥회 둘째 날 — 다시, 광야로 (PPT)", "40슬라이드 · 16:9 · 본문 막 1:12-13", "sample.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", 13002342, 142],
    ["교안", "주일학교 봄학기 초등부 공과 (1-13과)", "인쇄용 · A4 · 학생용 + 교사용", "sample.pdf", "application/pdf", 9122611, 384],
    ["악보", "“주의 인자하심이” — 4부 합창 + 피아노", "원곡 G장조 · MR 2분 38초", "score.pdf", "application/pdf", 25272320, 612],
    ["문서", "교사 양육 매뉴얼 v3 — 신임 교사 6주 과정", "한글 + PDF 2종 · 평가지 포함", "manual.pdf", "application/pdf", 3355443, 218],
    ["영상", "제27회 성경고사 본선 — 진행 가이드 영상", "4분 22초 · 1080p · 자막", "guide.mp4", "video/mp4", 148897792, 96],
    ["디자인", "여름 수련회 포스터 · SNS 카드", "인쇄용 + 인스타 1080² 일괄", "poster.zip", "application/zip", 195035136, 174],
  ];
  for (const [cat, title, sub, oname, mime, sizeBytes, dl] of rseed) {
    const p = await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id, view_count)
       values ('resource', $1, $2, $3, '', $4, $5) returning id`,
      [cat, title, sub, adminId, dl],
    );
    const storedName = `${randomUUID()}.${oname.split(".").pop()}`;
    await writeFile(join(resourceDir, storedName), `placeholder for ${oname}`);
    await db.query(
      `insert into attachments (post_id, original_name, stored_name, mime, size_bytes)
       values ($1,$2,$3,$4,$5)`,
      [p.rows[0].id, oname, storedName, mime, sizeBytes],
    );
  }
  console.log(`[dev-db] 자료공유 글 ${rseed.length}건 + 파일 seed`);
} else {
  console.log("[dev-db] 자료공유 글 이미 존재");
}

// member 유저 seed (없을 때만) — 자유게시판 작성자용
const MEMBER_EMAIL = "member@seogyeong.kr";
const mExists = await db.query(`select id from users where email=$1`, [MEMBER_EMAIL]);
let memberId;
if (mExists.rows.length === 0) {
  const mhash = await argon2.hash("member1234");
  const mr = await db.query(
    `insert into users (email, password_hash, name, title, church, role) values ($1,$2,$3,$4,$5,'member') returning id`,
    [MEMBER_EMAIL, mhash, "이수민", "전도사", "은혜로교회"],
  );
  memberId = mr.rows[0].id;
  console.log(`[dev-db] member 시드: ${MEMBER_EMAIL} / member1234`);
} else {
  memberId = mExists.rows[0].id;
  console.log(`[dev-db] member 이미 존재: ${MEMBER_EMAIL}`);
}

// 자유게시판 seed (없을 때만)
const bExists = await db.query(`select 1 from posts where section='board' limit 1`);
if (bExists.rows.length === 0) {
  const bseed = [
    ["나눔", "아이가 처음 “기도해도 돼요?”라고 물었던 날", memberId],
    ["Q&A", "중고등부 큐티 교재, 요즘 뭐 쓰시나요?", memberId],
    ["기도", "봄학기 새가족을 위해 기도 부탁드립니다", adminId],
    ["토론", "주일학교 출석 감소, 우리 교회만의 문제일까요?", adminId],
    ["소식", "청년부 봄 워십나잇 — 4월 27일", memberId],
  ];
  for (const [cat, title, author] of bseed) {
    await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id)
       values ('board', $1, $2, $3, $4, $5)`,
      [cat, title, title + " (요약)", title + "\n\n(본문 예시)", author],
    );
  }
  console.log(`[dev-db] 자유게시판 글 ${bseed.length}건 seed`);
} else {
  console.log("[dev-db] 자유게시판 글 이미 존재");
}

const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
await server.start();
console.log(`[dev-db] PGlite 서버 listening: postgres://127.0.0.1:${PORT}`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
