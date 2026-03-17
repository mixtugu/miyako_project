import { Link } from "react-router-dom";

import { guestGalleryById } from "../lib/gallery";
import { buildSearchWithLang } from "../lib/lang";
import { useAppLang } from "../hooks/useAppLang";

export default function Nav() {
  // ----- styles -----
  const link: React.CSSProperties = {
    padding: 'clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 12px)', // responsive padding
    borderRadius: 8,
    textDecoration: "none",
    border: "1px solid #e5e5e5",
    fontSize: 'clamp(5px, 2vw, 18px)', // responsive link text
  };
  const wrap: React.CSSProperties = {
    display: "flex",
    gap: 8,
    padding: 12,
    borderBottom: "1px solid #f0f0f0",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 10,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: 'wrap', // allow wrapping on smaller screens
  };
  const leftGroup: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
  const rightGroup: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginTop: 'clamp(4px, 1vw, 8px)' };

  const pillBase: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e5e5",
    cursor: "pointer",
    background: "#fff",
    fontSize: 'clamp(10px, 2.5vw, 13px)', // responsive font size for mobile
  };
  const pillActive: React.CSSProperties = {
    ...pillBase,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
  };

  // ----- lang state -----
  const { lang, setLang } = useAppLang({ syncUrl: true });

  return (
    <nav style={wrap}>
      <div style={leftGroup}>
        <Link
          to={{ pathname: guestGalleryById.a.guestListPath, search: buildSearchWithLang(lang) }}
          style={link}
        >
          {guestGalleryById.a.heading.ja}
        </Link>
        <Link
          to={{ pathname: guestGalleryById.b.guestListPath, search: buildSearchWithLang(lang) }}
          style={link}
        >
          {guestGalleryById.b.heading.ja}
        </Link>
        <Link to={{ pathname: "/host", search: buildSearchWithLang(lang) }} style={link}>
          Gallery
        </Link>
        <a href="https://careful-wrinkle-de0.notion.site/HOME-2956e1cc4225801085a1e4d485e1e07b?pvs=143" style={link}>HOME</a>
      </div>

      {/* Lang switcher */}
      <div style={rightGroup}>
        <button
          type="button"
          onClick={() => setLang("ja")}
          style={lang === "ja" ? pillActive : pillBase}
          aria-pressed={lang === "ja"}
          aria-label="言語を日本語に設定"
        >
          日本語
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          style={lang === "en" ? pillActive : pillBase}
          aria-pressed={lang === "en"}
          aria-label="Set language to English"
        >
          English
        </button>
      </div>
    </nav>
  );
}
