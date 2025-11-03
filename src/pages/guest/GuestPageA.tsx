import { useNavigate } from "react-router-dom";

// 📄 各作品タイトルと作家
const META: Record<string, { title: string; author: string }> = {
  l1: { title: "閃光", author: "曽根沙也佳" },
  l2: { title: "閃光ののち伏せた場面", author: "倉重侑季" },
  l3: { title: "被爆後に立ち上がったところ（荒神橋から見た爆風によってなぎ倒された家々）", author: "富田真衣" },
  l4: { title: "橋のたもとの被爆者が私を見つめている", author: "倉重侑季" },
  l5: { title: "熱線で火傷し機関車のオイルを塗っている", author: "富田真衣" },
};

type Photo = {
  id: string;
  url: string;
  title: string;
  author: string;
};

const PHOTOS: Photo[] = Array.from({ length: 5 }).map((_, i) => {
  const n = i + 1;
  const key = `l${n}` as const;
  const meta = META[key];
  return {
    id: key,
    url: `/L_${n}_L.png`,
    title: meta?.title ?? `絵 ${n}`,
    author: meta?.author ?? "",
  };
});

export default function GuestPageA() {
  const navigate = useNavigate();

  const handleSelect = (photoId: string) => {
    navigate(`/guest/a2?photo=${photoId}`);
  };

  return (
    <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>李鍾根さん</h1>
      <p style={{ color: "#666" }}>
        絵画を一つ選んでください。
      </p>

      <section style={grid}>
        {PHOTOS.map((p) => (
          <button
            key={p.id}
            style={thumbBtn}
            onClick={() => handleSelect(p.id)}
            aria-label={`${p.title}を選択`}
          >
            <img src={p.url} alt={p.title} style={thumbImg} />
            <span style={thumbTitle}>作品名「{p.title}」</span>
            <span style={thumbAuthor}>{p.author}</span>
          </button>
        ))}
      </section>
      <p>全ての作品は、広島平和記念資料館所蔵です。</p>
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
          李鍾根さんストーリーマップ
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
                    alt="サムネイル"
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
                      在日韓国人被爆者 李鍾根　(ｲ・ｼﾞｮﾝｸﾞﾝ)　人生ストーリー
                    </h2>
                    <p style={{ margin: 0, color: "#333", lineHeight: 1.7, fontSize: 14 }}>
                      83歳まで「江川政市」という日本名を名乗ってきた在日韓国人の李鍾根さん。 なぜ、日本名を名乗のり、日本で被爆しなければならなかったのでしょう。そして、どのような人生を送り、どのようなメッセージを後世に伝えたのでしょうか。
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