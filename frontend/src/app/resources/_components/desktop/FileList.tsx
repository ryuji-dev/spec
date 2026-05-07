import type { Palette } from "@/app/_components/shared/palette";
import type { ResourceFile } from "@/lib/resources-data";
import FileIcon from "../shared/FileIcon";
import LbCatLabel from "../shared/LbCatLabel";
import DownloadStat from "../shared/DownloadStat";
import DownloadBtn from "../shared/DownloadBtn";

type Props = {
  files: ReadonlyArray<ResourceFile>;
  palette: Palette;
};

const COLS = "60px 1fr 110px 100px 100px 100px 110px";
const COL_LABELS = ["형식", "제목", "분류", "크기", "다운로드", "등록일", ""];

/**
 * 자료 리스트 뷰 — 7열 테이블. 디자인 원본 library.jsx 의 list 분기 그대로.
 */
export default function FileList({ files, palette }: Props) {
  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          padding: "14px 24px",
          gap: 16,
          fontSize: 11,
          fontWeight: 600,
          color: palette.muted,
          letterSpacing: "0.06em",
          fontFamily: "Inter, system-ui",
          borderBottom: `1px solid ${palette.line}`,
          background: palette.bg,
        }}
      >
        {COL_LABELS.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>
      {files.map((f, i) => (
        <div
          key={f.id}
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            padding: "16px 24px",
            gap: 16,
            alignItems: "center",
            borderBottom:
              i < files.length - 1 ? `1px solid ${palette.line}` : "none",
            cursor: "pointer",
          }}
        >
          <FileIcon type={f.type} palette={palette} size={36} />
          <div>
            <div
              style={{
                fontFamily: '"Noto Sans KR", system-ui',
                fontSize: 14,
                fontWeight: 600,
                color: palette.ink,
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              {f.title}
              {f.isNew && (
                <span
                  style={{
                    fontSize: 9,
                    color: palette.primary,
                    fontWeight: 700,
                    marginLeft: 4,
                    letterSpacing: "0.08em",
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  {" "}
                  NEW
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: palette.muted,
                fontFamily: '"Noto Sans KR", system-ui',
              }}
            >
              {f.by}
            </div>
          </div>
          <div>
            <LbCatLabel cat={f.cat} palette={palette} />
          </div>
          <div
            style={{
              fontSize: 12,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
            }}
          >
            {f.size}
          </div>
          <div>
            <DownloadStat count={f.downloads} palette={palette} size={12} />
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
            }}
          >
            {f.date}
          </div>
          <div>
            <DownloadBtn palette={palette} variant="ghost" size="sm" label="받기" />
          </div>
        </div>
      ))}
    </div>
  );
}
