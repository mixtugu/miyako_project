import { useNavigate } from "react-router-dom";


type Photo = {
  id: string;
  url: string;
  title: string;
  author: string;
};

// 📄 各作品メタ情報（タイトル / 作家）—日本語のみ
const META: Record<string, { title: string; author: string }> = {
  k1: { title: "「倒壊校舎からの脱出」", author: "花岡美優" },
  k2: { title: "「プールサイドの惨劇」", author: "室星理歩" },
  k3: { title: "「『友達を助けてくれ！』『火が廻って来たぞ、逃げろ！』」", author: "宮本陽菜" },
  k4: { title: "「人間襤褸（らんる）の群れの中に」", author: "津村果奈" },
  k5: { title: "「忘れられない　〜あの眼」", author: "富田葵天" },
};

const PHOTOS: Photo[] = [
  { id: "k1", url: "/K_1_L.png", title: META.k1.title, author: META.k1.author },
  { id: "k2", url: "/K_2_L.png", title: META.k2.title, author: META.k2.author },
  { id: "k3", url: "/K_3_L.png", title: META.k3.title, author: META.k3.author },
  { id: "k4", url: "/K_4_L.png", title: META.k4.title, author: META.k4.author },
  { id: "k5", url: "/K_5_L.png", title: META.k5.title, author: META.k5.author },
];

export default function GuestPageB() {
  const navigate = useNavigate();

  const handleSelect = (photoId: string) => {
    navigate(`/guest/b2?photo=${photoId}`);
  };

  return (
    <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>兒玉光雄さん</h1>

      {/* Instruction */}
      <p style={{ color: "#666", marginTop: 8 }}>
        絵画を一つ選んでください。
      </p>

      <section style={grid}>
        {PHOTOS.map((p) => (
          <button
            key={p.id}
            style={thumbBtn}
            onClick={() => handleSelect(p.id)}
            aria-label={`${p.title}（${p.author}）を選択`}
          >
            <img src={p.url} alt={p.title} style={thumbImg} />
            <span style={thumbTitle}>{p.title}</span>
            <span style={thumbAuthor}>{p.author}</span>
          </button>
        ))}
      </section>
      <p>全ての作品は、広島平和記念資料館所蔵です。</p>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <a
          href="https://arcg.is/0finmS"
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
          兒玉光雄さんストーリーマップ
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
                      至近距離被爆者・兒玉光雄　ー「人間」として生き抜いた「光」の記憶 ー
                    </h2>
                    <p style={{ margin: 0, color: "#333", lineHeight: 1.7, fontSize: 14 }}>
                      中学１年生（12歳）の時、爆心地から約870メートル地点で被爆し、還暦（60歳）を過ぎてから重複癌と闘ってきた兒玉光雄さん。そのライフストーリーから、私たちが学べることは何でしょうか？
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