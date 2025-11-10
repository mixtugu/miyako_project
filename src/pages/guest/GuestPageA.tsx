import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

// 📄 各作品タイトルと作家
const META: Record<string, { title: { ja: string; en: string }; author: { ja: string; en: string } }> = {
  l1: {
    title: { ja: "閃光", en: "A Flash of Light" },
    author: { ja: "曽根沙也佳", en: "Sayaka Sone" },
  },
  l2: {
    title: { ja: "閃光ののち伏せた場面", en: "Lying Face Down Immediately After a Flash of Light" },
    author: { ja: "倉重侑季", en: "Yuki Kurashige" },
  },
  l3: {
    title: {
      ja: "被爆後に立ち上がったところ（荒神橋から見た爆風によってなぎ倒された家々）",
      en: "When I Stood Up After the Bombing - A Scene Near the Kojin Bridge Where Buildings Were Devastated by the Blast",
    },
    author: { ja: "富田真衣", en: "Mai Tomita" },
  },
  l4: {
    title: { ja: "橋のたもとの被爆者が私を見つめている", en: "A-bomb Victims at the Foot of a Bridge Watching Me" },
    author: { ja: "倉重侑季", en: "Yuki Kurashige" },
  },
  l5: {
    title: { ja: "熱線で火傷し機関車のオイルを塗っている", en: "They Put Steam Locomotive Oil on My Burns Caused by Heat Rays" },
    author: { ja: "富田真衣", en: "Mai Tomita" },
  },
};

type Photo = {
  id: string;
  url: string;
  title: string;
  author: string;
};

export default function GuestPageA() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // ----- Language resolution: URL ?lang= → localStorage('app_lang') → browser -----
  const [lang, setLang] = useState<"ja" | "en">("ja");

  useEffect(() => {
    const q = params.get("lang");
    if (q === "ja" || q === "en") {
      setLang(q);
      try { localStorage.setItem("app_lang", q); } catch {}
      try { document.documentElement.lang = q; } catch {}
      return;
    }
    try {
      const saved = localStorage.getItem("app_lang");
      if (saved === "ja" || saved === "en") {
        setLang(saved);
        try { document.documentElement.lang = saved; } catch {}
        return;
      }
    } catch {}
    const browserIsJa = (navigator.language || navigator.languages?.[0] || "ja").toLowerCase().startsWith("ja");
    const fallback = browserIsJa ? "ja" : "en";
    setLang(fallback);
    try { document.documentElement.lang = fallback; } catch {}
  }, [params]);

  const PHOTOS: Photo[] = Array.from({ length: 5 }).map((_, i) => {
    const n = i + 1;
    const key = `l${n}` as const;
    const meta = META[key];
    return {
      id: key,
      url: `/L_${n}_L.png`,
      title: meta?.title[lang] ?? `絵 ${n}`,
      author: meta?.author[lang] ?? "",
    };
  });

  const handleSelect = (photoId: string) => {
    navigate(`/guest/a2?photo=${photoId}&lang=${lang}`);
  };

  const TEXT = {
    ja: {
      heading: "李鍾根さん",
      instruction: "絵画を一つ選んでください。",
      collection: "全ての作品は、広島平和記念資料館所蔵です。",
      mapButton: "李鍾根さんストーリーマップ",
      storyTitle: "在日韓国人被爆者 李鍾根　(ｲ・ｼﾞｮﾝｸﾞﾝ)　人生ストーリー",
      storyDesc: "83歳まで「江川政市」という日本名を名乗ってきた在日韓国人の李鍾根さん。 なぜ、日本名を名乗のり、日本で被爆しなければならなかったのでしょう。そして、どのような人生を送り、どのようなメッセージを後世に伝えたのでしょうか。",
    },
    en: {
      heading: "Lee Jong-keun",
      instruction: "Please select one artwork.",
      collection: "All artworks are in the collection of the Hiroshima Peace Memorial Museum.",
      mapButton: "Story Map of Mr. Lee Jong-geun",
      storyTitle: "A Life Story of Korean A-bomb Survivor Lee Jong-geun",
      storyDesc: "Mr. Lee Jong-geun, a Korean A-bomb survivor who lived under the Japanese name 'Egawa Masaichi' until the age of 83. Why did he use a Japanese name and suffer the atomic bombing in Japan? What kind of life did he live, and what message does he leave for future generations?",
    },
  };

  return (
    <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>{TEXT[lang].heading}</h1>
      <p style={{ color: "#666" }}>{TEXT[lang].instruction}</p>

      <section style={grid}>
        {PHOTOS.map((p) => (
          <button
            key={p.id}
            style={thumbBtn}
            onClick={() => handleSelect(p.id)}
            aria-label={lang === 'en' ? `Select ${p.title}` : `${p.title}を選択`}
          >
            <img src={p.url} alt={p.title} style={thumbImg} />
            <span style={thumbTitle}>{p.title}</span>
            <span style={thumbAuthor}>{p.author}</span>
          </button>
        ))}
      </section>
      <p>{TEXT[lang].collection}</p>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <a
          href="https://arcg.is/Oy1D00"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            borderRadius: 8,
            backgroundColor: "#f5f5f5",
            color: "#333",
            textDecoration: "none",
            fontSize: 15,
          }}
        >
          {TEXT[lang].mapButton}
                {/* Thumbnail + Story lead */}
                <section
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    marginTop: 8,
                    marginBottom: 12,
                  }}
                >
                  <img
                    src={"/L.png"}
                    alt={lang === 'en' ? 'Thumbnail' : 'サムネイル'}
                    style={{
                      width: 160,
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid #eee",
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: 18,
                        lineHeight: 1.5,
                        color: "#222",
                        fontWeight: 800,
                      }}
                    >
                      {TEXT[lang].storyTitle}
                    </h2>
                    <p style={{ margin: 0, color: "#333", lineHeight: 1.7, fontSize: 14 }}>
                      {TEXT[lang].storyDesc}
                    </p>
                  </div>
                </section>
        </a>
      </div>
    </main>
  );
}

const grid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 12,
};

const thumbBtn: React.CSSProperties = {
  padding: 0,
  border: "1px solid #eee",
  borderRadius: 12,
  background: "#fff",
  overflow: "hidden",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
};

const thumbImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4 / 3",
  objectFit: "cover",
  display: "block",
};

const thumbTitle: React.CSSProperties = {
  padding: "8px 10px 2px",
  fontSize: 14,
  fontWeight: 700,
  color: "#222",
  lineHeight: 1.35,
  display: "block",
};

const thumbAuthor: React.CSSProperties = {
  padding: "0 10px 8px",
  fontSize: 13,
  color: "#666",
  lineHeight: 1.4,
  display: "block",
};