import { useNavigate } from "react-router-dom";

type Photo = {
  id: string;
  url: string;
  label: string;
};

const PHOTOS: Photo[] = [
  { id: "k1", url: "/K_1_L.png", label: "絵 1" },
  { id: "k2", url: "/K_2_L.png", label: "絵 2" },
  { id: "k3", url: "/K_3_L.png", label: "絵 3" },
  { id: "k4", url: "/K_4_L.png", label: "絵 4" },
  { id: "k5", url: "/K_5_L.png", label: "絵 5" },
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
        あなたが想いを重ねたい絵を一つ選んでください。
      </p>

      <section style={grid}>
        {PHOTOS.map((p) => (
          <button
            key={p.id}
            style={thumbBtn}
            onClick={() => handleSelect(p.id)}
            aria-label={`${p.label}を選択`}
          >
            <img src={p.url} alt={p.label} style={thumbImg} />
            <span style={thumbLabel}>{p.label}</span>
          </button>
        ))}
      </section>
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

const thumbLabel: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 14,
  color: "#333",
};