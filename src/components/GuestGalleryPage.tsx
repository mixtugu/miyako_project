import { useNavigate } from "react-router-dom";

import type { GuestGallery } from "../lib/gallery";
import { galleryCopy } from "../lib/gallery";
import { buildSearchWithLang, type AppLang } from "../lib/lang";

type GuestGalleryPageProps = {
  gallery: GuestGallery;
  lang: AppLang;
};

export default function GuestGalleryPage({ gallery, lang }: GuestGalleryPageProps) {
  const navigate = useNavigate();

  const handleSelect = (photoId: string) => {
    navigate({
      pathname: gallery.guestDetailPath,
      search: buildSearchWithLang(lang, { photo: photoId }),
    });
  };

  return (
    <main style={main}>
      <h1 style={{ marginTop: 0 }}>{gallery.heading[lang]}</h1>
      <p style={{ color: "#666" }}>{galleryCopy.guestInstruction[lang]}</p>

      <section style={grid}>
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
            <img src={artwork.thumbUrl} alt={artwork.title[lang]} style={thumbImg} />
            <span style={thumbTitle}>{artwork.title[lang]}</span>
            <span style={thumbAuthor}>{artwork.author[lang]}</span>
          </button>
        ))}
      </section>

      <p>{galleryCopy.collectionNotice[lang]}</p>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <a
          href={gallery.storyMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={storyLink}
        >
          <span style={storyLinkLabel}>{gallery.storyMapButton[lang]}</span>
          <section style={storySection}>
            <img
              src={gallery.storyImageUrl}
              alt={lang === "en" ? "Story map thumbnail" : "ストーリーマップのサムネイル"}
              style={storyImage}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={storyTitle}>{gallery.storyTitle[lang]}</h2>
              <p style={storyDescription}>{gallery.storyDescription[lang]}</p>
            </div>
          </section>
        </a>
      </div>
    </main>
  );
}

const main: React.CSSProperties = {
  padding: 16,
  maxWidth: 560,
  margin: "0 auto",
};

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

const storyLink: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: 8,
  backgroundColor: "#f5f5f5",
  color: "#333",
  textDecoration: "none",
  fontSize: 15,
};

const storyLinkLabel: React.CSSProperties = {
  display: "inline-block",
};

const storySection: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  marginTop: 8,
  marginBottom: 12,
};

const storyImage: React.CSSProperties = {
  width: 160,
  aspectRatio: "4 / 3",
  objectFit: "cover",
  borderRadius: 12,
  border: "1px solid #eee",
  display: "block",
  flexShrink: 0,
};

const storyTitle: React.CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: 18,
  lineHeight: 1.5,
  color: "#222",
  fontWeight: 800,
};

const storyDescription: React.CSSProperties = {
  margin: 0,
  color: "#333",
  lineHeight: 1.7,
  fontSize: 14,
};
