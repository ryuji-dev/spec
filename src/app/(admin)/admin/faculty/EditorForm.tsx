"use client";
import { useActionState } from "react";
import { FACULTY_DEPT_META } from "@/lib/faculty";
import type { FacultyFormState } from "@/server/actions/faculty";

const TONES = ["forest", "olive", "pine", "sage"] as const;

type Initial = {
  name?: string;
  title?: string;
  en?: string;
  degree?: string;
  dept?: string;
  tone?: string;
  field?: string;
  teaches?: string;
  quote?: string;
  years?: number;
  papers?: number;
  office?: string;
  hours?: string;
  isCover?: boolean;
  sortOrder?: number;
  about?: string;
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;
const labelStyle = { fontSize: 13, color: "#444", display: "grid", gap: 4 } as const;

const DEPT_IDS = Object.keys(FACULTY_DEPT_META) as Array<keyof typeof FACULTY_DEPT_META>;

export default function EditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: FacultyFormState, formData: FormData) => Promise<FacultyFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <label style={labelStyle}>
        이름
        <input name="name" defaultValue={initial?.name ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        직함
        <input name="title" defaultValue={initial?.title ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        영문 표기
        <input name="en" defaultValue={initial?.en ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        학위
        <input name="degree" defaultValue={initial?.degree ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        부서
        <select name="dept" defaultValue={initial?.dept ?? DEPT_IDS[0]} style={inputStyle}>
          {DEPT_IDS.map((id) => (
            <option key={id} value={id}>
              {FACULTY_DEPT_META[id].ko} ({id})
            </option>
          ))}
        </select>
      </label>
      <label style={labelStyle}>
        아바타 색조(tone)
        <select name="tone" defaultValue={initial?.tone ?? TONES[0]} style={inputStyle}>
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label style={labelStyle}>
        전공 분야
        <input name="field" defaultValue={initial?.field ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        담당 강좌 (줄바꿈으로 구분)
        <textarea name="teaches" defaultValue={initial?.teaches ?? ""} rows={4} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        한 줄 인용
        <input name="quote" defaultValue={initial?.quote ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        강의 연차
        <input type="number" name="years" defaultValue={initial?.years ?? 0} min={0} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        저서·논문 수
        <input type="number" name="papers" defaultValue={initial?.papers ?? 0} min={0} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        연구실
        <input name="office" defaultValue={initial?.office ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        면담 시간
        <input name="hours" defaultValue={initial?.hours ?? ""} required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} min={0} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        커버 소개 (커버 교수일 때만 사용)
        <textarea name="about" defaultValue={initial?.about ?? ""} rows={4} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isCover" defaultChecked={initial?.isCover ?? false} /> 커버 스토리 교수로 지정
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
