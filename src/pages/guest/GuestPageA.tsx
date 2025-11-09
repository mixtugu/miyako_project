import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

export default function Nav() {
  // ----- styles -----
  const link: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    textDecoration: "none",
    border: "1px solid #e5e5e5",
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
  };
  const leftGroup: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
  const rightGroup: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };

  const pillBase: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e5e5",
    cursor: "pointer",
    background: "#fff",
    fontSize: 13,
  };
  const pillActive: React.CSSProperties = {
    ...pillBase,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
  };

  // ----- lang state -----
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLang] = useState<"ja" | "en">("ja");

  // Determine initial language: URL ?lang=, else localStorage(app_lang), else browser
  const urlLang = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get("lang");
    return v === "ja" || v === "en" ? v : null;
  }, [location.search]);

  useEffect(() => {
    const stored = (localStorage.getItem("app_lang") as "ja" | "en" | null) ?? null;
    const browser: "ja" | "en" = navigator.language?.toLowerCase().startsWith("ja") ? "ja" : "en";
    setLang(urlLang ?? stored ?? browser);
  }, [urlLang]);

  // Keep URL and localStorage in sync when lang changes (preserve other params)
  useEffect(() => {
    // persist
    try { localStorage.setItem("app_lang", lang); } catch {}

    // update <html lang> for a11y/SEO
    try { document.documentElement.lang = lang; } catch {}

    // sync URL search params
    const sp = new URLSearchParams(location.search);
    if (sp.get("lang") !== lang) {
      sp.set("lang", lang);
      navigate({ pathname: location.pathname, search: `?${sp.toString()}` }, { replace: true });
    }
  }, [lang, location.pathname, location.search, navigate]);

  const withLang = (path: string) => ({ pathname: path, search: `?lang=${lang}` });

  // ----- localized labels -----
  const LABEL = {
    ja: {
      a: "李鍾根さん",
      b: "兒玉光雄さん",
      gallery: "ギャラリー",
      home: "ホーム",
    },
    en: {
      a: "Mr. Lee Jong-keun",
      b: "Mr. Mitsuo Kodama",
      gallery: "Gallery",
      home: "Home",
    },
  } as const;

  return (
    <nav style={wrap}>
      <div style={leftGroup}>
        <Link to={withLang("/guest/a")} style={link}>{LABEL[lang].a}</Link>
        <Link to={withLang("/guest/b")} style={link}>{LABEL[lang].b}</Link>
        <Link to={withLang("/host")} style={link}>{LABEL[lang].gallery}</Link>
        {/* 외부 링크는 서비스 성격상 lang 쿼리를 보장하지 않을 수 있음 */}
        <a
          href={`https://careful-wrinkle-de0.notion.site/HOME-2956e1cc4225801085a1e4d485e1e07b?pvs=143`}
          style={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {LABEL[lang].home}
        </a>
      </div>

      {/* Lang switcher */}
      <div style={rightGroup}>
        <button
          type="button"
          onClick={() => setLang("ja")}
          style={lang === "ja" ? pillActive : pillBase}
          aria-pressed={lang === "ja"}
          aria-label={lang === "en" ? "Switch language to Japanese" : "言語を日本語に設定"}
        >
          日本語
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          style={lang === "en" ? pillActive : pillBase}
          aria-pressed={lang === "en"}
          aria-label={lang === "en" ? "Language is set to English" : "言語を英語に設定"}
        >
          English
        </button>
      </div>
    </nav>
  );
}