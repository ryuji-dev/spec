// Supabase 시드 — auth 사용자(admin·member) + 콘텐츠. 멱등.
// auth.admin.createUser → on_auth_user_created 트리거가 profiles 생성.
// 콘텐츠는 service-role 클라이언트로 RLS 우회 삽입.
//   실행: node --env-file=.env.local scripts/seed-supabase.mjs
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey) {
  console.error("seed: NEXT_PUBLIC_SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// ── 1. auth 사용자 (멱등) ───────────────────────────────
async function ensureUser(email, password, meta) {
  const { data: list } = await db.auth.admin.listUsers();
  const found = list.users.find((u) => u.email === email);
  if (found) {
    console.log(`skip user: ${email}`);
    return found.id;
  }
  const { data, error } = await db.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: meta,
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  console.log(`created user: ${email}`);
  return data.user.id;
}

const adminId = await ensureUser("admin@seogyeong.kr", "admin1234", {
  name: "관리자", title: "교육위원회", church: "교육위원회", role: "admin",
});
const memberId = await ensureUser("member@seogyeong.kr", "member1234", {
  name: "이수민", title: "전도사", church: "은혜로교회", role: "member",
});

// ── 2. 콘텐츠 (섹션별 멱등) ─────────────────────────────
async function hasSection(section) {
  const { count } = await db.from("posts").select("id", { count: "exact", head: true }).eq("section", section);
  return (count ?? 0) > 0;
}
async function insertPosts(rows) {
  // PostgREST 다중행 insert는 키 합집합을 쓰므로, NOT NULL 기본값 컬럼을 행마다 명시(누락 시 NULL→위반).
  const normalized = rows.map((r) => ({
    is_published: true, view_count: 0, is_pinned: false, ...r,
  }));
  const { data, error } = await db.from("posts").insert(normalized).select("id");
  if (error) throw new Error(`insert posts: ${error.message}`);
  return data;
}
async function insertAttachment(postId, section, originalName, mime, sizeBytes) {
  const storedName = `${section}/${postId}/${randomUUID()}.${originalName.split(".").pop()}`;
  const { error } = await db.from("attachments").insert({
    post_id: postId, original_name: originalName, stored_name: storedName, mime, size_bytes: sizeBytes,
  });
  if (error) throw new Error(`insert attachment: ${error.message}`);
}

// committee
if (!(await hasSection("committee"))) {
  await insertPosts([
    { section: "committee", category: "공지", title: "2026년 상반기 교육위원회 정기총회 안내", excerpt: "5월 24일 주일 오후 2시, 서경교회 본당. 안건과 일정 안내.", body: "정기총회 안내\n\n(본문 예시)", author_id: adminId, is_pinned: true },
    { section: "committee", category: "회의록", title: "제 4차 임원회의 회의록 (2026.04.18)", excerpt: "교사 수련회 일정 확정, 성경고사 본선 진행 안내.", body: "회의록\n\n(본문 예시)", author_id: adminId },
    { section: "committee", category: "수련회", title: "2026 봄 교사 수련회 — 사전 신청 마감 안내", excerpt: "4월 30일까지 각 교회별 명단 제출 바랍니다.", body: "수련회 안내\n\n(본문 예시)", author_id: adminId },
    { section: "committee", category: "자료실", title: "주일학교 봄학기 공과 PDF 일괄 다운로드", excerpt: "유년부·초등부·중고등부 공과 일괄 제공.", body: "자료 안내\n\n(본문 예시)", author_id: adminId },
    { section: "committee", category: "나눔", title: "주일학교 부서 운영, 작은 교회의 한 사례", excerpt: "학생 9명 교회의 1년 통합 운영 사례를 나눕니다.", body: "나눔\n\n(본문 예시)", author_id: adminId },
  ]);
  console.log("seeded committee 5");
} else console.log("skip committee");

// resource (+attachments)
if (!(await hasSection("resource"))) {
  const rseed = [
    ["설교PPT", "봄 부흥회 둘째 날 — 다시, 광야로 (PPT)", "40슬라이드 · 16:9 · 본문 막 1:12-13", "sample.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", 13002342, 142],
    ["교안", "주일학교 봄학기 초등부 공과 (1-13과)", "인쇄용 · A4 · 학생용 + 교사용", "sample.pdf", "application/pdf", 9122611, 384],
    ["악보", "“주의 인자하심이” — 4부 합창 + 피아노", "원곡 G장조 · MR 2분 38초", "score.pdf", "application/pdf", 25272320, 612],
    ["문서", "교사 양육 매뉴얼 v3 — 신임 교사 6주 과정", "한글 + PDF 2종 · 평가지 포함", "manual.pdf", "application/pdf", 3355443, 218],
    ["영상", "제27회 성경고사 본선 — 진행 가이드 영상", "4분 22초 · 1080p · 자막", "guide.mp4", "video/mp4", 148897792, 96],
    ["디자인", "여름 수련회 포스터 · SNS 카드", "인쇄용 + 인스타 1080² 일괄", "poster.zip", "application/zip", 195035136, 174],
  ];
  for (const [cat, title, sub, oname, mime, sizeBytes, dl] of rseed) {
    const [{ id }] = await insertPosts([{ section: "resource", category: cat, title, excerpt: sub, body: "", author_id: adminId, view_count: dl }]);
    await insertAttachment(id, "resource", oname, mime, sizeBytes);
  }
  console.log("seeded resource 6 (+attachments)");
} else console.log("skip resource");

// board
if (!(await hasSection("board"))) {
  const bseed = [
    ["나눔", "아이가 처음 “기도해도 돼요?”라고 물었던 날", memberId],
    ["Q&A", "중고등부 큐티 교재, 요즘 뭐 쓰시나요?", memberId],
    ["기도", "봄학기 새가족을 위해 기도 부탁드립니다", adminId],
    ["토론", "주일학교 출석 감소, 우리 교회만의 문제일까요?", adminId],
    ["소식", "청년부 봄 워십나잇 — 4월 27일", memberId],
  ];
  await insertPosts(bseed.map(([category, title, author_id]) => ({
    section: "board", category, title, excerpt: title + " (요약)", body: title + "\n\n(본문 예시)", author_id,
  })));
  console.log("seeded board 5");
} else console.log("skip board");

// training (+1 attachment)
if (!(await hasSection("training"))) {
  const tseed = [
    ["신청", "2026 봄 교역자 수련회 신청 — 변경/취소 절차 안내", null],
    ["후기", "광야 한복판에서, 다시 일어설 힘을 받다", null],
    ["Q&A", "봄 수련회 — 가족 동반(아이 포함) 가능한가요?", null],
    ["강의자료", "2025 가을 수련회 — 이정훈 교수 강의안 PDF (3편 일괄)", "lecture.pdf"],
  ];
  for (const [cat, title, attachName] of tseed) {
    const [{ id }] = await insertPosts([{ section: "training", category: cat, title, excerpt: title + " (요약)", body: title + "\n\n(본문 예시)", author_id: adminId }]);
    if (attachName) await insertAttachment(id, "training", attachName, "application/pdf", 9122611);
  }
  console.log("seeded training 4 (+attachment)");
} else console.log("skip training");

// webzine
if (!(await hasSection("webzine"))) {
  const longBody = "광야로 보내심을 다시 묵상하며, 교사의 자리를 지탱하는 것이 무엇인지 돌아봅니다.\n\n".repeat(20);
  const wseed = [
    ["신학산책", "말씀을 가르친다는 것 — 칼뱅의 교사론 다시 읽기", "제네바의 작은 강의실에서 시작된 가르침의 신학.", true],
    ["현장에서", "시골 작은 교회의 주일학교, 무엇이 가능한가", "학생 일곱 명, 교사 두 명. 그 자리의 작은 사건들.", false],
    ["북리뷰", "『가르치는 자의 영성』 — 파머의 오래된 질문", "“우리는 누구인가”가 어떻게 가르침의 본질이 되는가.", false],
    ["에세이", "아이의 한 마디가 나를 다시 세웁니다", "교사로 십이 년, 한 아이의 짧은 기도가 가르쳐 준 것.", false],
    ["교회사", "한국교회 주일학교의 한 세기", "1907년 평양에서 시작된 작은 모임이 오늘에 이르기까지.", false],
    ["대담", "두 세대의 교사, 같은 자리에서 만나다", "삼십 년 전 교사였던 어머니와 오늘의 교사 딸이 마주 앉았다.", false],
  ];
  await insertPosts(wseed.map(([category, title, excerpt, is_pinned]) => ({
    section: "webzine", category, title, excerpt, body: longBody, author_id: adminId, is_pinned,
  })));
  console.log("seeded webzine 6");
} else console.log("skip webzine");

// faculty
{
  const { count } = await db.from("faculty").select("id", { count: "exact", head: true });
  if ((count ?? 0) === 0) {
    const fseed = [
      ["st", "강민준", "학장 / 조직신학 교수", "KANG, MIN-JUN · TH.D", "Th.D · Universität Heidelberg", "pine", "조직신학·교회론", ["교회론과 공동체", "성령과 교회", "신학원 모더레이션"], "신학은 교회의 삶을 향해 열려 있어야 합니다. 강의실의 텍스트가 한 가정의 식탁에 닿을 때까지.", 24, 11, "본관 401호", "수 14:00–17:00", true, "하이델베르크 대학에서 칼 바르트 후기 신학으로 박사 학위를 받았다. 노회 신학원 학장으로 봉사한 지 8년째이며, 매학기 두 강좌를 직접 강의한다.", 0],
      ["ot", "문성재", "구약학 교수", "MOON, SEONG-JAE", "Ph.D · Princeton Theological Seminary", "forest", "예언서·시편 신학", ["예언서 강해", "시편의 신학", "히브리어 강독 II"], "본문이 입을 다물 때까지 끈질기게 듣는 일.", 14, 23, "본관 207호", "월·수 14:00–17:00", false, null, 1],
      ["nt", "한도윤", "신약학 교수", "HAN, DO-YOON", "D.Phil · University of Oxford", "olive", "바울서신·역사적 예수", ["로마서 강해", "예수의 비유", "헬라어 강독 I"], "바울이 빌립보에 보낸 안부가 오늘 우리에게도 같은 무게로 도착합니다.", 18, 31, "본관 312호", "화·목 10:00–13:00", false, null, 2],
      ["pt", "정아라", "실천신학 부교수", "JUNG, A-RA", "Ph.D · Fuller Theological Seminary", "sage", "예배학·기독교교육", ["예배학 개론", "주일학교 커리큘럼 설계", "청년 사역의 신학"], "예배는 텍스트가 아니라 시간 속에 짜이는 옷감입니다.", 11, 18, "교육관 105호", "월·금 09:00–12:00", false, null, 3],
      ["ch", "이혜성", "교회사 부교수", "LEE, HYE-SUNG", "Ph.D · University of Edinburgh", "forest", "한국교회사·종교개혁사", ["한국교회사", "종교개혁사", "청교도 영성"], "잊혀진 이름들 사이에서 오늘의 길이 자라납니다.", 9, 14, "본관 215호", "화·목 13:00–16:00", false, null, 4],
      ["mn", "정현우", "선교학 교수", "JUNG, HYUN-WOO", "Ph.D · Trinity Evangelical Divinity School", "forest", "디아스포라 선교·문화신학", ["선교신학 개론", "디아스포라와 교회", "비교종교론"], "복음은 언제나 길 위에서 자랐습니다. 정착이 아닌 보냄의 신학.", 19, 27, "국제관 202호", "수·금 13:00–16:00", false, null, 5],
    ];
    const rows = fseed.map(([dept, name, title, en, degree, tone, field, teaches, quote, years, papers, office, hours, is_cover, about, sort_order]) => ({
      dept, name, title, en, degree, tone, field, teaches, quote, years, papers, office, hours, is_cover, about, sort_order,
    }));
    const { error } = await db.from("faculty").insert(rows);
    if (error) throw new Error(`insert faculty: ${error.message}`);
    console.log("seeded faculty 6");
  } else console.log("skip faculty");
}

// ── 3. 훅 검증 — admin 로그인 토큰에 user_role 클레임이 있는가 ──
if (anonKey) {
  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await authClient.auth.signInWithPassword({ email: "admin@seogyeong.kr", password: "admin1234" });
  if (error) {
    console.error(`훅 검증 로그인 실패: ${error.message}`);
  } else {
    const payload = JSON.parse(Buffer.from(data.session.access_token.split(".")[1], "base64").toString());
    console.log(`훅 검증: admin user_role 클레임 = ${JSON.stringify(payload.user_role)} (기대: "admin")`);
  }
}

console.log("seed 완료");
