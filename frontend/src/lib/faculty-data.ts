/**
 * 신학원교수소개 페이지 mock 데이터.
 * 백엔드 연동 전까지 사용. 디자인 원본 `_design/.../faculty.jsx` 와 구조·필드 동일.
 * 단, 한글/영문 이름은 실제 교수진과 혼동을 막기 위해 가명으로 교체했다.
 */

export type FacultyDept = "all" | "ot" | "nt" | "st" | "pt" | "ch" | "mn";

export type FacultyTone = "forest" | "olive" | "pine" | "sage";

export type FacultyDeptItem = {
  id: FacultyDept;
  ko: string;
  en: string;
  count: number;
};

export const FACULTY_DEPTS: ReadonlyArray<FacultyDeptItem> = [
  { id: "all", ko: "전체", en: "ALL", count: 14 },
  { id: "ot", ko: "구약학", en: "OLD TESTAMENT", count: 3 },
  { id: "nt", ko: "신약학", en: "NEW TESTAMENT", count: 3 },
  { id: "st", ko: "조직신학", en: "SYSTEMATIC", count: 2 },
  { id: "pt", ko: "실천신학", en: "PRACTICAL", count: 3 },
  { id: "ch", ko: "교회사", en: "CHURCH HISTORY", count: 2 },
  { id: "mn", ko: "선교/디아스포라", en: "MISSIONS", count: 1 },
];

export type FacultyCoverStat = { k: string; l: string };

export type FacultyCover = {
  id: string;
  name: string;
  title: string;
  en: string;
  init: string;
  yearsKo: string;
  tag: string;
  quote: string;
  about: string;
  stats: ReadonlyArray<FacultyCoverStat>;
  current: ReadonlyArray<string>;
};

// 이번 학기 커버스토리 — 학장
export const FACULTY_COVER: FacultyCover = {
  id: "cover",
  name: "강민준",
  title: "학장 / 조직신학 교수",
  en: "KANG, MIN-JUN · TH.D",
  init: "강",
  yearsKo: "24년차",
  tag: "커버 스토리 · 2026 봄",
  quote:
    "신학은 교회의 삶을 향해 열려 있어야 합니다. 강의실의 텍스트가 한 가정의 식탁에 닿을 때까지 — 그 거리를 좁히는 일이 우리의 사명이라 생각합니다.",
  about:
    "하이델베르크 대학에서 칼 바르트 후기 신학으로 박사 학위를 받았다. 노회 신학원 학장으로 봉사한 지 8년째이며, 매학기 〈교회론과 공동체〉 〈성령과 교회〉 두 강좌를 직접 강의한다.",
  stats: [
    { k: "24", l: "강의 연차" },
    { k: "11", l: "저서·논문" },
    { k: "8", l: "학장 봉사" },
  ],
  current: ["교회론과 공동체", "성령과 교회", "신학원 모더레이션"],
};

export type FacultyMember = {
  id: number;
  dept: Exclude<FacultyDept, "all">;
  name: string;
  title: string;
  en: string;
  degree: string;
  init: string;
  tone: FacultyTone;
  field: string;
  teaches: ReadonlyArray<string>;
  quote: string;
  years: number;
  papers: number;
  office: string;
  hours: string;
};

export const FACULTY_MEMBERS: ReadonlyArray<FacultyMember> = [
  {
    id: 1,
    dept: "ot",
    name: "문성재",
    title: "구약학 교수",
    en: "MOON, SEONG-JAE",
    degree: "Ph.D · Princeton Theological Seminary",
    init: "문",
    tone: "forest",
    field: "예언서·시편 신학",
    teaches: ["예언서 강해", "시편의 신학", "히브리어 강독 II"],
    quote: "본문이 입을 다물 때까지 끈질기게 듣는 일 — 그것이 강단의 시작입니다.",
    years: 14,
    papers: 23,
    office: "본관 207호",
    hours: "월·수 14:00–17:00",
  },
  {
    id: 2,
    dept: "nt",
    name: "한도윤",
    title: "신약학 교수",
    en: "HAN, DO-YOON",
    degree: "D.Phil · University of Oxford",
    init: "한",
    tone: "olive",
    field: "바울서신·역사적 예수",
    teaches: ["로마서 강해", "예수의 비유", "헬라어 강독 I"],
    quote: "바울이 빌립보에 보낸 안부가 오늘 우리에게도 같은 무게로 도착합니다.",
    years: 18,
    papers: 31,
    office: "본관 312호",
    hours: "화·목 10:00–13:00",
  },
  {
    id: 3,
    dept: "pt",
    name: "정아라",
    title: "실천신학 부교수",
    en: "JUNG, A-RA",
    degree: "Ph.D · Fuller Theological Seminary",
    init: "정",
    tone: "sage",
    field: "예배학·기독교교육",
    teaches: ["예배학 개론", "주일학교 커리큘럼 설계", "청년 사역의 신학"],
    quote: "예배는 텍스트가 아니라 시간 속에 짜이는 옷감입니다.",
    years: 11,
    papers: 18,
    office: "교육관 105호",
    hours: "월·금 09:00–12:00",
  },
  {
    id: 4,
    dept: "st",
    name: "윤주환",
    title: "조직신학 교수",
    en: "YOON, JU-HWAN",
    degree: "Th.D · Yale Divinity School",
    init: "윤",
    tone: "pine",
    field: "삼위일체론·창조론",
    teaches: ["삼위일체론", "창조와 종말", "현대신학 사조"],
    quote: "교리는 박물관이 아니라, 우리가 매일 호흡하는 공기여야 합니다.",
    years: 22,
    papers: 38,
    office: "본관 401호",
    hours: "수·금 14:00–17:00",
  },
  {
    id: 5,
    dept: "ch",
    name: "이혜성",
    title: "교회사 부교수",
    en: "LEE, HYE-SUNG",
    degree: "Ph.D · University of Edinburgh",
    init: "이",
    tone: "forest",
    field: "한국교회사·종교개혁사",
    teaches: ["한국교회사", "종교개혁사", "청교도 영성"],
    quote: "잊혀진 이름들 사이에서 오늘의 길이 자라납니다.",
    years: 9,
    papers: 14,
    office: "본관 215호",
    hours: "화·목 13:00–16:00",
  },
  {
    id: 6,
    dept: "pt",
    name: "김찬우",
    title: "실천신학 교수",
    en: "KIM, CHAN-WOO",
    degree: "D.Min · Princeton Theological Seminary",
    init: "김",
    tone: "olive",
    field: "설교학·목회상담",
    teaches: ["설교학 개론", "강해설교 워크숍", "목회상담의 기초"],
    quote: "설교는 광야에서 길어 올린 한 컵의 물처럼 정직해야 합니다.",
    years: 16,
    papers: 21,
    office: "본관 308호",
    hours: "월·수 10:00–12:00",
  },
  {
    id: 7,
    dept: "nt",
    name: "박지수",
    title: "신약학 부교수",
    en: "PARK, JI-SOO",
    degree: "Ph.D · Duke Divinity School",
    init: "박",
    tone: "sage",
    field: "복음서·내러티브 비평",
    teaches: ["요한복음 강해", "공관복음서 신학", "신약 헬라어 II"],
    quote: "복음서는 사건이며, 우리는 그 안에 들어가 살도록 초대받습니다.",
    years: 8,
    papers: 12,
    office: "본관 314호",
    hours: "화·목 14:00–17:00",
  },
  {
    id: 8,
    dept: "ot",
    name: "오나래",
    title: "구약학 부교수",
    en: "OH, NA-RAE",
    degree: "Ph.D · 장로회신학대학교",
    init: "오",
    tone: "pine",
    field: "오경·구약신학",
    teaches: ["오경 신학", "구약 개론", "히브리어 강독 I"],
    quote: "율법은 거리가 아니라, 오히려 가까이 다가오시는 사랑의 형태입니다.",
    years: 7,
    papers: 9,
    office: "본관 209호",
    hours: "월·수 09:00–12:00",
  },
  {
    id: 9,
    dept: "st",
    name: "한태경",
    title: "조직신학 부교수",
    en: "HAN, TAE-KYUNG",
    degree: "Ph.D · 칼빈신학교 (Calvin Theological Seminary)",
    init: "한",
    tone: "olive",
    field: "개혁신학·기독론",
    teaches: ["기독론", "개혁신학 사조", "신앙고백 강독"],
    quote: "고백은 닫힌 결론이 아니라, 매일 다시 시작되는 응답입니다.",
    years: 6,
    papers: 8,
    office: "본관 405호",
    hours: "화·금 10:00–13:00",
  },
  {
    id: 10,
    dept: "mn",
    name: "정현우",
    title: "선교학 교수",
    en: "JUNG, HYUN-WOO",
    degree: "Ph.D · Trinity Evangelical Divinity School",
    init: "정",
    tone: "forest",
    field: "디아스포라 선교·문화신학",
    teaches: ["선교신학 개론", "디아스포라와 교회", "비교종교론"],
    quote: "복음은 언제나 길 위에서 자랐습니다. 정착이 아닌 보냄의 신학.",
    years: 19,
    papers: 27,
    office: "국제관 202호",
    hours: "수·금 13:00–16:00",
  },
  {
    id: 11,
    dept: "pt",
    name: "윤소은",
    title: "기독교교육 부교수",
    en: "YOON, SO-EUN",
    degree: "Ed.D · Boston University",
    init: "윤",
    tone: "sage",
    field: "아동·청소년 교육신학",
    teaches: ["기독교교육 개론", "발달과 신앙", "교회학교 운영론"],
    quote: "아이들은 신학의 부록이 아니라, 우리가 다시 배워야 할 본문입니다.",
    years: 12,
    papers: 16,
    office: "교육관 208호",
    hours: "월·목 14:00–17:00",
  },
  {
    id: 12,
    dept: "ch",
    name: "박정근",
    title: "교회사 교수",
    en: "PARK, JEONG-GEUN",
    degree: "Ph.D · 서울대학교",
    init: "박",
    tone: "pine",
    field: "초대교회사·교부학",
    teaches: ["초대교회사", "교부신학 입문", "아우구스티누스 강독"],
    quote: "아주 오래된 목소리가 가장 새롭게 들리는 순간이 있습니다.",
    years: 21,
    papers: 33,
    office: "본관 219호",
    hours: "화·목 10:00–12:00",
  },
  {
    id: 13,
    dept: "ot",
    name: "김유리",
    title: "구약학 조교수",
    en: "KIM, YU-RI",
    degree: "Ph.D · 총신대학교",
    init: "김",
    tone: "forest",
    field: "지혜문학·시편",
    teaches: ["지혜문학 강해", "시편 강독", "히브리어 입문"],
    quote: "잠언의 한 구절이 한 학기를 떠받칠 때가 있습니다.",
    years: 4,
    papers: 6,
    office: "본관 211호",
    hours: "수·금 09:00–12:00",
  },
  {
    id: 14,
    dept: "nt",
    name: "서한결",
    title: "신약학 조교수",
    en: "SEO, HAN-GYEOL",
    degree: "Th.D · Westminster Theological Seminary",
    init: "서",
    tone: "olive",
    field: "바울신학·종말론",
    teaches: ["데살로니가서 강해", "바울의 종말론", "신약 본문비평"],
    quote: "본문 앞에서 침묵하는 시간이 결국 가장 큰 강의가 됩니다.",
    years: 5,
    papers: 7,
    office: "본관 316호",
    hours: "월·수 13:00–15:00",
  },
];

export type FacultyTimetableItem = {
  day: string;
  time: string;
  course: string;
  prof: string;
  room: string;
  host?: boolean;
};

// 이번 학기 강의 시간표 발췌 — prof 는 FACULTY_MEMBERS / FACULTY_COVER 의 name 과 일치
export const FACULTY_TIMETABLE: ReadonlyArray<FacultyTimetableItem> = [
  { day: "월", time: "10:00", course: "설교학 개론", prof: "김찬우", room: "대강당" },
  { day: "월", time: "14:00", course: "예언서 강해", prof: "문성재", room: "301호" },
  { day: "화", time: "10:00", course: "로마서 강해", prof: "한도윤", room: "대강당" },
  { day: "수", time: "14:00", course: "삼위일체론", prof: "윤주환", room: "402호" },
  { day: "수", time: "14:00", course: "교회론과 공동체", prof: "강민준", host: true, room: "대강당" },
  { day: "목", time: "13:00", course: "한국교회사", prof: "이혜성", room: "215호" },
  { day: "금", time: "10:00", course: "예배학 개론", prof: "정아라", room: "교육관 102" },
];

export type FacultyQuote = { name: string; q: string };

// 인터뷰 인용 스트립 — name 은 FACULTY_MEMBERS 의 name 과 일치
export const FACULTY_QUOTES: ReadonlyArray<FacultyQuote> = [
  { name: "문성재", q: "본문이 입을 다물 때까지 끈질기게 듣는 일" },
  { name: "한도윤", q: "바울이 빌립보에 보낸 안부가 오늘 우리에게도" },
  { name: "정현우", q: "복음은 언제나 길 위에서 자랐습니다" },
  { name: "정아라", q: "예배는 시간 속에 짜이는 옷감입니다" },
];
