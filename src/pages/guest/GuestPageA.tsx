import { useNavigate } from "react-router-dom";

type Photo = {
  id: string;
  url: string;
  label: string;
};

const PHOTOS: Photo[] = [
  { id: "l1", url: "/L_1_L.png", label: "絵 1" },
  { id: "l2", url: "/L_2_L.png", label: "絵 2" },
  { id: "l3", url: "/L_3_L.png", label: "絵 3" },
  { id: "l4", url: "/L_4_L.png", label: "絵 4" },
  { id: "l5", url: "/L_5_L.png", label: "絵 5" },
];

export default function GuestPageA() {
  const navigate = useNavigate();

  const handleSelect = (photoId: string) => {
    navigate(`/guest/a2?photo=${photoId}`);
  };

  return (
    <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>李鍾根さん</h1>
      <p style={{ color: "#666" }}>
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

const thumbLabel: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 14,
  color: "#333",
};