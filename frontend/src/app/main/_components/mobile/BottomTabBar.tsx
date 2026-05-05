import { BOTTOM_TABS } from "@/lib/main-page-data";
import styles from "./BottomTabBar.module.css";

/**
 * 바텀 탭바 — Phase 1: active=0 고정, 클릭 인터랙션 X.
 */
export default function BottomTabBar() {
  const active = 0;

  return (
    <div className={styles.bar}>
      {BOTTOM_TABS.map((t, i) => (
        <button key={t.key} type="button" className={styles.tab} data-active={i === active ? "true" : "false"}>
          <TabIcon name={t.key} active={i === active} />
          <span className={styles.label}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--palette-primary)" : "var(--palette-muted)";
  const fill = active ? "var(--palette-primary)" : "none";
  const fillOpacity = active ? 0.12 : 0;

  if (name === "home") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9l8-6 8 6v10a1 1 0 01-1 1h-4v-6h-6v6H4a1 1 0 01-1-1V9z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill={fill}
          fillOpacity={fillOpacity}
        />
      </svg>
    );
  }
  if (name === "tent") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 4 L3 18 L19 18 Z M11 4 L11 18"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill={fill}
          fillOpacity={fillOpacity}
        />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 5 L11 7 L19 5 L19 17 L11 19 L3 17 Z M11 7 L11 19"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill={fill}
          fillOpacity={fillOpacity}
        />
      </svg>
    );
  }
  if (name === "photo") {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="6" width="16" height="12" rx="1.5" stroke={stroke} strokeWidth="1.5" fill={fill} fillOpacity={fillOpacity} />
        <circle cx="11" cy="12" r="3" stroke={stroke} strokeWidth="1.5" fill="none" />
        <rect x="8" y="4" width="6" height="2" rx="0.5" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (name === "menu") {
    const dotFill = active ? "var(--palette-primary)" : "var(--palette-muted)";
    const positions = [
      [6, 6], [11, 6], [16, 6],
      [6, 11], [11, 11], [16, 11],
      [6, 16], [11, 16], [16, 16],
    ];
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        {positions.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill={dotFill} />
        ))}
      </svg>
    );
  }
  return null;
}
