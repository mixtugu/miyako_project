import { useNavigate } from "react-router-dom";

type Photo = { id: string; url: string; label: string };

const L_PHOTOS: Photo[] = Array.from({ length: 5 }).map((_, i) => {
  const n = i + 1;
  return { id: `l${n}`, url: `/L_${n}_L.png`, label: `絵_${n}` };
});

const K_PHOTOS: Photo[] = Array.from({ length: 5 }).map((_, i) => {
  const n = i + 1;
  return { id: `k${n}`, url: `/K_${n}_L.png`, label: `絵_${n}` };
});

export default function HostPage() {
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    // 이동: 호스트 그림 페이지로, 선택한 photo id를 전달
    navigate(`/host/picture?photo=${id}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Gallery</h1>
      <p style={{ color: "#555" }}>
        あなたは原爆の絵を見て何を感じましたか？その想いを重ねてみませんか？
      </p>

      <h3 style={{ margin: "16px 0 8px" }}>李鍾根さん</h3>
      <div style={grid}>
        {L_PHOTOS.map((p) => {
          return (
            <button key={p.id} style={thumbBtn} onClick={() => handleSelect(p.id)} aria-label={`${p.label}を選択`}>
              <img
                src={p.url + "?w=400"}
                alt={p.label}
                style={thumbImg}
                loading="lazy"
              />
              <span style={thumbLabel}>{p.label}</span>
            </button>
          );
        })}
      </div>

      <h3 style={{ margin: "24px 0 8px" }}>兒玉光雄さん</h3>
      <div style={grid}>
        {K_PHOTOS.map((p) => {
          return (
            <button key={p.id} style={thumbBtn} onClick={() => handleSelect(p.id)} aria-label={`${p.label}を選択`}>
              <img
                src={p.url + "?w=400"}
                alt={p.label}
                style={thumbImg}
                loading="lazy"
              />
              <span style={thumbLabel}>{p.label}</span>
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

const thumbLabel: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 14,
  color: "#333",
};