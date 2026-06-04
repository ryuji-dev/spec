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

// 교역자수련회 seed (없을 때만) — admin 작성. 강의자료 글엔 첨부 placeholder 1개.
const trainingDir = join(here, "../uploads/training");
const tExists = await db.query(`select 1 from posts where section='training' limit 1`);
if (tExists.rows.length === 0) {
  await mkdir(trainingDir, { recursive: true });
  const tseed = [
    ["신청", "2026 봄 교역자 수련회 신청 — 변경/취소 절차 안내", null],
    ["후기", "광야 한복판에서, 다시 일어설 힘을 받다", null],
    ["Q&A", "봄 수련회 — 가족 동반(아이 포함) 가능한가요?", null],
    ["강의자료", "2025 가을 수련회 — 이정훈 교수 강의안 PDF (3편 일괄)", "lecture.pdf"],
  ];
  for (const [cat, title, attachName] of tseed) {
    const p = await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id)
       values ('training', $1, $2, $3, $4, $5) returning id`,
      [cat, title, title + " (요약)", title + "\n\n(본문 예시)", adminId],
    );
    if (attachName) {
      const storedName = `${randomUUID()}.${attachName.split(".").pop()}`;
      await writeFile(join(trainingDir, storedName), `placeholder for ${attachName}`);
      await db.query(
        `insert into attachments (post_id, original_name, stored_name, mime, size_bytes)
         values ($1,$2,$3,$4,$5)`,
        [p.rows[0].id, attachName, storedName, "application/pdf", 9122611],
      );
    }
  }
  console.log(`[dev-db] 교역자수련회 글 ${tseed.length}건 + 첨부 seed`);
} else {
  console.log("[dev-db] 교역자수련회 글 이미 존재");
}

// 신학원웹진 seed (없을 때만) — admin 발행. 표지 에세이 1편(isPinned) + 카테고리별 기사.
const wExists = await db.query(`select 1 from posts where section='webzine' limit 1`);
if (wExists.rows.length === 0) {
  const longBody =
    "광야로 보내심을 다시 묵상하며, 교사의 자리를 지탱하는 것이 무엇인지 돌아봅니다.\n\n".repeat(20);
  const wseed = [
    ["신학산책", "말씀을 가르친다는 것 — 칼뱅의 교사론 다시 읽기", "제네바의 작은 강의실에서 시작된 가르침의 신학.", true],
    ["현장에서", "시골 작은 교회의 주일학교, 무엇이 가능한가", "학생 일곱 명, 교사 두 명. 그 자리의 작은 사건들.", false],
    ["북리뷰", "『가르치는 자의 영성』 — 파머의 오래된 질문", "“우리는 누구인가”가 어떻게 가르침의 본질이 되는가.", false],
    ["에세이", "아이의 한 마디가 나를 다시 세웁니다", "교사로 십이 년, 한 아이의 짧은 기도가 가르쳐 준 것.", false],
    ["교회사", "한국교회 주일학교의 한 세기", "1907년 평양에서 시작된 작은 모임이 오늘에 이르기까지.", false],
    ["대담", "두 세대의 교사, 같은 자리에서 만나다", "삼십 년 전 교사였던 어머니와 오늘의 교사 딸이 마주 앉았다.", false],
  ];
  for (const [cat, title, excerpt, pinned] of wseed) {
    await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id, is_pinned)
       values ('webzine', $1, $2, $3, $4, $5, $6)`,
      [cat, title, excerpt, longBody, adminId, pinned],
    );
  }
  console.log(`[dev-db] 신학원웹진 글 ${wseed.length}건 seed`);
} else {
  console.log("[dev-db] 신학원웹진 글 이미 존재");
}

// 신학원교수 seed (없을 때만) — 커버 교수 1명(isCover) + 부서별 교수 6명.
const fExists = await db.query(`select 1 from faculty limit 1`);
if (fExists.rows.length === 0) {
  // [dept, name, title, en, degree, tone, field, teaches[], quote, years, papers, office, hours, isCover, about, sortOrder]
  const fseed = [
    ["st", "강민준", "학장 / 조직신학 교수", "KANG, MIN-JUN · TH.D", "Th.D · Universität Heidelberg", "pine", "조직신학·교회론",
      ["교회론과 공동체", "성령과 교회", "신학원 모더레이션"],
      "신학은 교회의 삶을 향해 열려 있어야 합니다. 강의실의 텍스트가 한 가정의 식탁에 닿을 때까지.", 24, 11, "본관 401호", "수 14:00–17:00",
      true, "하이델베르크 대학에서 칼 바르트 후기 신학으로 박사 학위를 받았다. 노회 신학원 학장으로 봉사한 지 8년째이며, 매학기 두 강좌를 직접 강의한다.", 0],
    ["ot", "문성재", "구약학 교수", "MOON, SEONG-JAE", "Ph.D · Princeton Theological Seminary", "forest", "예언서·시편 신학",
      ["예언서 강해", "시편의 신학", "히브리어 강독 II"], "본문이 입을 다물 때까지 끈질기게 듣는 일.", 14, 23, "본관 207호", "월·수 14:00–17:00", false, null, 1],
    ["nt", "한도윤", "신약학 교수", "HAN, DO-YOON", "D.Phil · University of Oxford", "olive", "바울서신·역사적 예수",
      ["로마서 강해", "예수의 비유", "헬라어 강독 I"], "바울이 빌립보에 보낸 안부가 오늘 우리에게도 같은 무게로 도착합니다.", 18, 31, "본관 312호", "화·목 10:00–13:00", false, null, 2],
    ["pt", "정아라", "실천신학 부교수", "JUNG, A-RA", "Ph.D · Fuller Theological Seminary", "sage", "예배학·기독교교육",
      ["예배학 개론", "주일학교 커리큘럼 설계", "청년 사역의 신학"], "예배는 텍스트가 아니라 시간 속에 짜이는 옷감입니다.", 11, 18, "교육관 105호", "월·금 09:00–12:00", false, null, 3],
    ["ch", "이혜성", "교회사 부교수", "LEE, HYE-SUNG", "Ph.D · University of Edinburgh", "forest", "한국교회사·종교개혁사",
      ["한국교회사", "종교개혁사", "청교도 영성"], "잊혀진 이름들 사이에서 오늘의 길이 자라납니다.", 9, 14, "본관 215호", "화·목 13:00–16:00", false, null, 4],
    ["mn", "정현우", "선교학 교수", "JUNG, HYUN-WOO", "Ph.D · Trinity Evangelical Divinity School", "forest", "디아스포라 선교·문화신학",
      ["선교신학 개론", "디아스포라와 교회", "비교종교론"], "복음은 언제나 길 위에서 자랐습니다. 정착이 아닌 보냄의 신학.", 19, 27, "국제관 202호", "수·금 13:00–16:00", false, null, 5],
  ];
  for (const [dept, name, title, en, degree, tone, field, teaches, quote, years, papers, office, hours, isCover, about, sortOrder] of fseed) {
    await db.query(
      `insert into faculty (dept, name, title, en, degree, tone, field, teaches, quote, years, papers, office, hours, is_cover, about, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [dept, name, title, en, degree, tone, field, JSON.stringify(teaches), quote, years, papers, office, hours, isCover, about, sortOrder],
    );
  }
  console.log(`[dev-db] 신학원교수 ${fseed.length}명 seed`);
} else {
  console.log("[dev-db] 신학원교수 이미 존재");
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
