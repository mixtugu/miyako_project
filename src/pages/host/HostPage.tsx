import { useNavigate, useSearchParams } from "react-router-dom";

type Photo = { id: string; url: string; title: string; author: string };

// 📄 各作品のメタ情報（タイトル / 作家）
const META: Record<string, { title: string; author: string }> = {
  // L 系列
  l1: { title: "閃光", author: "曽根沙也佳" },
  l2: { title: "閃光ののち伏せた場面", author: "倉重侑季" },
  l3: { title: "被爆後に立ち上がったところ（荒神橋から見た爆風によってなぎ倒された家々）", author: "富田真衣" },
  l4: { title: "橋のたもとの被爆者が私を見つめている", author: "倉重侑季" },
  l5: { title: "熱線で火傷し機関車のオイルを塗っている", author: "富田真衣" },
  // K 系列
  k1: { title: "倒壊校舎からの脱出", author: "花岡美優" },
  k2: { title: "プールサイドの惨劇", author: "室星理歩" },
  k3: { title: "『友達を助けてくれ！』『火が廻って来たぞ、逃げろ！』", author: "宮本陽菜" },
  k4: { title: "人間襤褸（らんる）の群れの中に", author: "津村果奈" },
  k5: { title: "忘れられない　〜あの眼", author: "富田葵天" },
};

export default function HostPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lang = params.get("lang") === "en" ? "en" : "ja";

  const L_PHOTOS: Photo[] = Array.from({ length: 5 }).map((_, i) => {
    const n = i + 1;
    const key = `l${n}` as const;
    const meta = META[key];
    return {
      id: key,
      url: `/L_${n}_L.png`,
      title: lang === "ja" ? `「${meta?.title}」` : meta?.title,
      author: meta?.author ?? "",
    };
  });

  const K_PHOTOS: Photo[] = Array.from({ length: 5 }).map((_, i) => {
    const n = i + 1;
    const key = `k${n}` as const;
    const meta = META[key];
    return {
      id: key,
      url: `/K_${n}_L.png`,
      title: lang === "ja" ? `「${meta?.title}」` : meta?.title,
      author: meta?.author ?? "",
    };
  });

  const handleSelect = (id: string) => {
    // 이동: 호스트 그림 페이지로, 선택한 photo id를 전달
    navigate(`/host/picture?photo=${id}`);
  };

  const TEXT = {
    ja: {
      gallery: "Gallery",
      desc: "鑑賞者の想いが重ねられた作品をご覧ください。（ご覧になりたい作品をクリックしてください。）",
      lee: "李鍾根さん",
      kodama: "兒玉光雄さん",
    },
    en: {
      gallery: "Gallery",
      desc: "View artworks layered with the thoughts of their viewers. (Click on a work to explore.)",
      lee: "Mr. Lee Jong-geun",
      kodama: "Mr. Mitsuo Kodama",
    },
  } as const;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>{TEXT[lang].gallery}</h1>
      <p style={{ color: "#555" }}>
        {TEXT[lang].desc}
      </p>

      <h3 style={{ margin: "16px 0 8px" }}>{TEXT[lang].lee}</h3>
      <div style={grid}>
        {L_PHOTOS.map((p) => {
          return (
            <button key={p.id} style={thumbBtn} onClick={() => handleSelect(p.id)} aria-label={`${p.title}（${p.author}）を選択`}>
              <img
                src={p.url + "?w=400"}
                alt={p.title}
                style={thumbImg}
                loading="lazy"
              />
              <span style={thumbTitle}>{p.title}</span>
              <span style={thumbAuthor}>{p.author}</span>
            </button>
          );
        })}
      </div>

      <h3 style={{ margin: "24px 0 8px" }}>{TEXT[lang].kodama}</h3>
      <div style={grid}>
        {K_PHOTOS.map((p) => {
          return (
            <button key={p.id} style={thumbBtn} onClick={() => handleSelect(p.id)} aria-label={`${p.title}（${p.author}）を選択`}>
              <img
                src={p.url + "?w=400"}
                alt={p.title}
                style={thumbImg}
                loading="lazy"
              />
              <span style={thumbTitle}>{p.title}</span>
              <span style={thumbAuthor}>{p.author}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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