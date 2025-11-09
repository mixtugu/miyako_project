import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type Photo = {
  id: string;
  url: string;
  title: string;
  author: string;
};

// 📄 各作品メタ情報（タイトル / 作家）—日本語のみ
const META: Record<string, { title: { ja: string; en: string }; author: { ja: string; en: string } }> = {
  k1: {
    title: { ja: "倒壊校舎からの脱出", en: "Escaping from the Debris of a Collapsed School Building" },
    author: { ja: "花岡美優", en: "Miyu Hanaoka" },
  },
  k2: {
    title: { ja: "プールサイドの惨劇", en: "Poolside Tragedy" },
    author: { ja: "室星理歩", en: "Riho Muroboshi" },
  },
  k3: {
    title: { ja: "『友達を助けてくれ！』『火が廻って来たぞ、逃げろ！』", en: "'Give Your Hand to Rescue him!' 'Fire is Approaching!' " },
    author: { ja: "宮本陽菜", en: "Hina Miyamoto" },
  },
  k4: {
    title: { ja: "人間襤褸（らんる）の群れの中に", en: "Amid a Throng of Wounded People Who Looked Like Rags" },
    author: { ja: "津村果奈", en: "Kana Tsumura" },
  },
  k5: {
    title: { ja: "忘れられない　〜あの眼", en: "Eyes that cannot be forgotten" },
    author: { ja: "富田葵天", en: "Sora Tomita" },
  },
};

export default function GuestPageB() {
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

  const PHOTOS: Photo[] = Object.entries(META).map(([id, data]) => {
    const n = id.replace(/^k/i, "");
    return {
      id,
      url: `/K_${n}_L.png`,
      title: data.title[lang],
      author: data.author[lang],
    };
  });

  const TEXT = {
    ja: {
      heading: "兒玉光雄さん",
      instruction: "絵画を一つ選んでください。",
      collection: "全ての作品は、広島平和記念資料館所蔵です。",
      mapButton: "兒玉光雄さんストーリーマップ",
      storyTitle: "至近距離被爆者・兒玉光雄　ー「人間」として生き抜いた「光」の記憶 ー",
      storyDesc: "中学１年生（12歳）の時、爆心地から約870メートル地点で被爆し、還暦（60歳）を過ぎてから重複癌と闘ってきた兒玉光雄さん。そのライフストーリーから、私たちが学べることは何でしょうか？",
    },
    en: {
      heading: "Kodama Mitsuo",
      instruction: "Please select one artwork.",
      collection: "All artworks are in the collection of the Hiroshima Peace Memorial Museum.",
      mapButton: "Story Map of Mr. Mitsuo Kodama",
      storyTitle: "A-Bomb Survivor at Close Range – The Memory of 'Light' as a Human Being",
      storyDesc: "Mr. Mitsuo Kodama was a first-year middle school student (12 years old) when he was exposed to the atomic bomb about 870 meters from the hypocenter. After the age of 60, he battled multiple cancers. What can we learn from his life story?",
    },
  };

  const handleSelect = (photoId: string) => {
    navigate(`/guest/b2?photo=${photoId}&lang=${lang}`);
  };

  return (
    <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>{TEXT[lang].heading}</h1>

      {/* Instruction */}
      <p style={{ color: "#666", marginTop: 8 }}>
        {TEXT[lang].instruction}
      </p>

      <section style={grid}>
        {PHOTOS.map((p) => (
          <button
            key={p.id}
            style={thumbBtn}
            onClick={() => handleSelect(p.id)}
            aria-label={lang === "en" ? `Select ${p.title} by ${p.author}` : `${p.title}（${p.author}）を選択`}
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
          href="https://arcg.is/qLLLX2"
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
                    src={"/K.png"}
                    alt={lang === "en" ? "Thumbnail" : "サムネイル"}
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
  padding: "0 10px 10px",
  fontSize: 12,
  color: "#666",
  lineHeight: 1.4,
  display: "block",
};