import { useNavigate } from "react-router-dom";

import { useAppLang } from "../../hooks/useAppLang";
import { galleryCopy, guestGalleries } from "../../lib/gallery";
import { buildSearchWithLang } from "../../lib/lang";

export default function HostPage() {
  const navigate = useNavigate();
  const { lang } = useAppLang();

  const handleSelect = (photoId: string) => {
    navigate({
      pathname: "/host/picture",
      search: buildSearchWithLang(lang, { photo: photoId }),
    });
  };

  return (
    <main style={main}>
      <h1 style={{ marginTop: 0 }}>{galleryCopy.hostUi.gallery[lang]}</h1>
      <p style={{ color: "#555" }}>{galleryCopy.hostUi.description[lang]}</p>

      {guestGalleries.map((gallery, index) => (
        <section key={gallery.id} style={{ marginTop: index === 0 ? 0 : 24 }}>
          <h3 style={{ margin: "16px 0 8px" }}>{gallery.heading[lang]}</h3>
          <div style={grid}>
            {gallery.artworks.map((artwork) => (
              <button
                key={artwork.id}
                type="button"
                style={thumbBtn}
                onClick={() => handleSelect(artwork.id)}
                aria-label={
                  lang === "en"
                    ? `Select ${artwork.title.en} by ${artwork.author.en}`
                    : `${artwork.title.ja}（${artwork.author.ja}）を選択`
                }
              >
                <img src={artwork.thumbUrl} alt={artwork.title[lang]} style={thumbImg} loading="lazy" />
                <span style={thumbTitle}>{lang === "ja" ? `「${artwork.title.ja}」` : artwork.title.en}</span>
                <span style={thumbAuthor}>{artwork.author[lang]}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

const main: React.CSSProperties = {
  padding: 24,
  maxWidth: 1200,
  margin: "0 auto",
};

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
