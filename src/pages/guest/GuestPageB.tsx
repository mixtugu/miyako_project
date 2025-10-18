import { useNavigate } from "react-router-dom";

type Photo = {
  id: string;
  url: string;
  label: string;
};

const PHOTOS: Photo[] = [
  { id: "k1", url: "/K_1.jpg", label: "絵 1" },
  { id: "k2", url: "/K_2.jpg", label: "絵 2" },
  { id: "k3", url: "/K_3.jpg", label: "絵 3" },
  { id: "k4", url: "/K_4.jpg", label: "絵 4" },
  { id: "k5", url: "/K_5.jpg", label: "絵 5" },
];

export default function GuestPageB() {
  const navigate = useNavigate();

  const handleSelect = (photoId: string) => {
    navigate(`/guest/b2?photo=${photoId}`);
  };

  return (
    <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>兒玉光雄さん</h1>
      <p style={{ color: "#666" }}>
        以下の5枚の絵の中から1枚を選択してください。選択すると次のページでコメントを残すことができます。
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