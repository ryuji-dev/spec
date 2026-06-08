import type { Palette } from "@/app/_components/shared/palette";
import type { ResourceFile } from "@/lib/resources-data";
import { fileTone } from "../fileTone";
import FileIcon from "../shared/FileIcon";
import LbCatLabel from "../shared/LbCatLabel";
import DownloadStat from "../shared/DownloadStat";
import DownloadBtn from "../shared/DownloadBtn";

type Props = {
  files: ReadonlyArray<ResourceFile>;
  palette: Palette;
  onOpen?: (id: string) => void;
};

/**
 * 자료 그리드 뷰 — 3열 카드. 디자인 원본 library.jsx 의 grid 분기 그대로.
 */
export default function FileGrid({ files, palette, onOpen }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 18,
      }}
    >
      {files.map((f) => {
        const ft = fileTone(f.type, palette);
        return (
          <article
            key={f.id}
            onClick={() => onOpen?.(f.id)}
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 4,
              padding: 22,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "relative",
            }}
          >
            {f.isNew && (
              <span
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: palette.primary,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "3px 7px",
                  borderRadius: 2,
                  fontFamily: "Inter, system-ui",
                }}
              >
                NEW
              </span>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <FileIcon type={f.type} palette={palette} size={48} />
              <div>
                <div
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.18em",
                    color: ft.color,
                    fontWeight: 700,
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  {ft.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: palette.muted,
                    marginTop: 3,
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  {f.size}
                </div>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <LbCatLabel cat={f.cat} palette={palette} />
              </div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontFamily: '"Noto Sans KR", system-ui',
                  fontSize: 15,
                  fontWeight: 700,
                  color: palette.ink,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {f.title}
              </h3>
              <div
                style={{
                  fontSize: 12,
                  color: palette.muted,
                  lineHeight: 1.55,
                  fontFamily: '"Noto Sans KR", system-ui',
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {f.sub}
              </div>
            </div>
            <div
              style={{
                paddingTop: 14,
                marginTop: "auto",
                borderTop: `1px solid ${palette.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: palette.muted,
                  fontFamily: "Inter, system-ui",
                }}
              >
                {f.date}
              </div>
              <DownloadStat count={f.downloads} palette={palette} />
            </div>
            <DownloadBtn palette={palette} size="sm" label="다운로드" />
          </article>
        );
      })}
    </div>
  );
}
