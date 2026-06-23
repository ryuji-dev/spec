"use client";
import { useActionState, useState } from "react";
import type { EventFormState } from "@/server/actions/events";
import { COVER_KINDS } from "@/lib/training";

type Speaker = { name: string; role: string; affiliation: string; talks: number };
type ScheduleItem = {
  time: string;
  what: string;
  place: string;
  tag: string;
  highlight?: boolean;
};
type ScheduleDay = { day: string; date: string; items: ScheduleItem[] };

type Initial = {
  title?: string;
  subtitle?: string;
  theme?: string;
  category?: string;
  badge?: string;
  startsAt?: string;
  endsAt?: string;
  place?: string;
  note?: string;
  cover?: string;
  capacity?: string;
  registered?: string;
  participants?: string;
  fee?: string;
  deadline?: string;
  isPublished?: boolean;
  speakers?: Speaker[];
  schedule?: ScheduleDay[];
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;
const smallInput = { padding: 8, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;
const sectionStyle = { border: "1px solid #e2e2e2", borderRadius: 8, padding: 16, display: "grid", gap: 10 } as const;
const removeBtn = { padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", color: "#c00", fontSize: 13 } as const;
const addBtn = { padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, width: "fit-content" } as const;
const fieldLabel = { fontSize: 13, color: "#666", display: "grid", gap: 4 } as const;

export default function EditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [speakers, setSpeakers] = useState<Speaker[]>(initial?.speakers ?? []);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(initial?.schedule ?? []);

  const addSpeaker = () =>
    setSpeakers((s) => [...s, { name: "", role: "", affiliation: "", talks: 0 }]);
  const updateSpeaker = (i: number, patch: Partial<Speaker>) =>
    setSpeakers((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeSpeaker = (i: number) => setSpeakers((s) => s.filter((_, idx) => idx !== i));

  const addDay = () => setSchedule((d) => [...d, { day: "", date: "", items: [] }]);
  const updateDay = (i: number, patch: Partial<Omit<ScheduleDay, "items">>) =>
    setSchedule((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeDay = (i: number) => setSchedule((d) => d.filter((_, idx) => idx !== i));
  const addItem = (di: number) =>
    setSchedule((d) =>
      d.map((x, idx) =>
        idx === di
          ? { ...x, items: [...x.items, { time: "", what: "", place: "", tag: "" }] }
          : x,
      ),
    );
  const updateItem = (di: number, ii: number, patch: Partial<ScheduleItem>) =>
    setSchedule((d) =>
      d.map((x, idx) =>
        idx === di
          ? { ...x, items: x.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
          : x,
      ),
    );
  const removeItem = (di: number, ii: number) =>
    setSchedule((d) =>
      d.map((x, idx) =>
        idx === di ? { ...x, items: x.items.filter((_, j) => j !== ii) } : x,
      ),
    );

  return (
    <form action={formAction} style={{ display: "grid", gap: 14, maxWidth: 760 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="제목" style={inputStyle} />
      <input name="subtitle" defaultValue={initial?.subtitle ?? ""} placeholder="부제 (선택)" style={inputStyle} />
      <input name="theme" defaultValue={initial?.theme ?? ""} placeholder="테마 (선택)" style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="category" defaultValue={initial?.category ?? ""} placeholder="분류 (예: 봄 정기수련회)" style={inputStyle} />
        <input name="badge" defaultValue={initial?.badge ?? ""} placeholder="배지 (예: 모집중)" style={inputStyle} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <label style={fieldLabel}>
          시작일
          <input type="date" name="startsAt" defaultValue={initial?.startsAt ?? ""} required style={inputStyle} />
        </label>
        <label style={fieldLabel}>
          종료일
          <input type="date" name="endsAt" defaultValue={initial?.endsAt ?? ""} required style={inputStyle} />
        </label>
        <label style={fieldLabel}>
          신청 마감 (선택)
          <input type="date" name="deadline" defaultValue={initial?.deadline ?? ""} style={inputStyle} />
        </label>
      </div>
      <input name="place" defaultValue={initial?.place ?? ""} placeholder="장소 (선택)" style={inputStyle} />
      <input name="note" defaultValue={initial?.note ?? ""} placeholder="비고 (후속 일정 카드용, 선택)" style={inputStyle} />
      <label style={fieldLabel}>
        커버 이미지
        <select name="cover" defaultValue={initial?.cover ?? COVER_KINDS[0]} style={inputStyle}>
          {COVER_KINDS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <label style={fieldLabel}>
          정원 (선택)
          <input type="number" name="capacity" min={0} defaultValue={initial?.capacity ?? ""} style={inputStyle} />
        </label>
        <label style={fieldLabel}>
          신청자수 (선택)
          <input type="number" name="registered" min={0} defaultValue={initial?.registered ?? ""} style={inputStyle} />
        </label>
        <label style={fieldLabel}>
          참석자수 (지난 행사, 선택)
          <input type="number" name="participants" min={0} defaultValue={initial?.participants ?? ""} style={inputStyle} />
        </label>
      </div>
      <input name="fee" defaultValue={initial?.fee ?? ""} placeholder="회비 (예: 5만원, 선택)" style={inputStyle} />
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>

      {/* 강사 */}
      <div style={sectionStyle}>
        <strong style={{ fontSize: 14 }}>강사</strong>
        {speakers.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px 40px", gap: 8, alignItems: "center" }}>
            <input value={s.name} onChange={(e) => updateSpeaker(i, { name: e.target.value })} placeholder="이름" style={smallInput} />
            <input value={s.role} onChange={(e) => updateSpeaker(i, { role: e.target.value })} placeholder="역할" style={smallInput} />
            <input value={s.affiliation} onChange={(e) => updateSpeaker(i, { affiliation: e.target.value })} placeholder="소속" style={smallInput} />
            <input type="number" min={0} value={s.talks} onChange={(e) => updateSpeaker(i, { talks: Number(e.target.value) || 0 })} placeholder="강의수" style={smallInput} />
            <button type="button" onClick={() => removeSpeaker(i)} style={removeBtn}>×</button>
          </div>
        ))}
        <button type="button" onClick={addSpeaker} style={addBtn}>+ 강사 추가</button>
      </div>

      {/* 일정표 */}
      <div style={sectionStyle}>
        <strong style={{ fontSize: 14 }}>일정표</strong>
        {schedule.map((d, di) => (
          <div key={di} style={{ border: "1px solid #eee", borderRadius: 6, padding: 12, display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8, alignItems: "center" }}>
              <input value={d.day} onChange={(e) => updateDay(di, { day: e.target.value })} placeholder="일자 (예: 1일차)" style={smallInput} />
              <input value={d.date} onChange={(e) => updateDay(di, { date: e.target.value })} placeholder="날짜 (예: 5.18 月)" style={smallInput} />
              <button type="button" onClick={() => removeDay(di)} style={removeBtn}>×</button>
            </div>
            {d.items.map((it, ii) => (
              <div key={ii} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 90px 60px 40px", gap: 6, alignItems: "center", paddingLeft: 12 }}>
                <input value={it.time} onChange={(e) => updateItem(di, ii, { time: e.target.value })} placeholder="시간" style={smallInput} />
                <input value={it.what} onChange={(e) => updateItem(di, ii, { what: e.target.value })} placeholder="내용" style={smallInput} />
                <input value={it.place} onChange={(e) => updateItem(di, ii, { place: e.target.value })} placeholder="장소" style={smallInput} />
                <input value={it.tag} onChange={(e) => updateItem(di, ii, { tag: e.target.value })} placeholder="태그" style={smallInput} />
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="checkbox" checked={it.highlight ?? false} onChange={(e) => updateItem(di, ii, { highlight: e.target.checked })} /> 강조
                </label>
                <button type="button" onClick={() => removeItem(di, ii)} style={removeBtn}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => addItem(di)} style={{ ...addBtn, marginLeft: 12 }}>+ 세션 추가</button>
          </div>
        ))}
        <button type="button" onClick={addDay} style={addBtn}>+ 일자 추가</button>
      </div>

      <input type="hidden" name="speakers" value={JSON.stringify(speakers)} />
      <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />

      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
