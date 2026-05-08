import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyMember } from "@/lib/faculty-data";
import FacCard from "./FacCard";

type Props = {
  profs: ReadonlyArray<FacultyMember>;
  palette: Palette;
};

export default function FacultyGrid({ profs, palette }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 24,
      }}
    >
      {profs.map((p) => (
        <FacCard key={p.id} prof={p} palette={palette} />
      ))}
    </div>
  );
}
