import { requireAdmin } from "@/server/auth/current-user";
import { createHeroSlide } from "@/server/actions/hero";
import NewForm from "../NewForm";

export default async function NewHeroPage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 540, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 히어로 슬라이드</h1>
      <NewForm action={createHeroSlide} />
    </main>
  );
}
