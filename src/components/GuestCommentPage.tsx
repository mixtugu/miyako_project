import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { addCommentToDB, deleteCommentFromDB, listCommentsByPhoto, type CommentItem } from "../lib/comments";
import { formatArtworkDescription, galleryCopy, getArtworkOrFallback } from "../lib/gallery";
import { buildSearchWithLang, type AppLang } from "../lib/lang";

type GuestCommentPageProps = {
  photoId: string;
  lang: AppLang;
};

const deletePassword = import.meta.env.VITE_COMMENT_DELETE_PASSWORD;

export default function GuestCommentPage({ photoId, lang }: GuestCommentPageProps) {
  const navigate = useNavigate();
  const artwork = getArtworkOrFallback(photoId);
  const descriptionText = formatArtworkDescription(artwork, lang);
  const locale = lang === "ja" ? "ja-JP" : "en-US";
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const [text, setText] = useState("");
  const [items, setItems] = useState<CommentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const nextItems = await listCommentsByPhoto(artwork.id);
        if (alive) {
          setItems(nextItems);
        }
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      alive = false;
    };
  }, [artwork.id]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    try {
      setSaving(true);
      await addCommentToDB(artwork.id, trimmed);
      setText("");
      setItems(await listCommentsByPhoto(artwork.id));
    } catch (error) {
      console.error(error);
      alert(galleryCopy.commentUi.saveError[lang]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!deletePassword) {
      alert(galleryCopy.commentUi.passwordNotConfigured[lang]);
      return;
    }

    const inputPassword = window.prompt(galleryCopy.commentUi.passwordPrompt[lang]);
    if (inputPassword === null) {
      return;
    }

    if (inputPassword !== deletePassword) {
      alert(galleryCopy.commentUi.passwordMismatch[lang]);
      return;
    }

    if (!window.confirm(galleryCopy.commentUi.confirmDelete[lang])) {
      return;
    }

    try {
      setDeletingId(commentId);
      await deleteCommentFromDB(commentId);
      setItems((prev) => prev.filter((item) => item.id !== commentId));
    } catch (error) {
      console.error(error);
      alert(galleryCopy.commentUi.deleteError[lang]);
    } finally {
      setDeletingId(null);
    }
  };

  const introLines = galleryCopy.commentIntro[lang].split("\n");

  return (
    <main style={main}>
      <h1 style={{ marginTop: 0 }}>{descriptionText}</h1>
      <p style={{ color: "#666" }}>
        {introLines.map((line, index) => (
          <span key={`${artwork.id}-${index}`}>
            {line}
            <br />
          </span>
        ))}
      </p>

      <section style={imgWrap}>
        <img src={artwork.imageUrl} alt={artwork.title[lang]} style={img} />
      </section>

      <section style={descWrap}>
        <p style={descText}>
          広島平和記念資料館所蔵
          {" 　"}
          {descriptionText}
        </p>
      </section>

      <section style={form}>
        <label htmlFor="comment" style={label}>
          {galleryCopy.commentUi.label[lang]}
        </label>
        <textarea
          id="comment"
          placeholder={galleryCopy.commentUi.placeholder[lang]}
          value={text}
          onChange={(event) => setText(event.target.value)}
          style={textarea}
          rows={3}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !text.trim()}
          style={primaryBtn}
          aria-label={lang === "en" ? "Save comment" : "コメントを保存"}
        >
          {saving ? galleryCopy.commentUi.saving[lang] : galleryCopy.commentUi.save[lang]}
        </button>
        <button
          type="button"
          onClick={() =>
            navigate({
              pathname: "/host/picture",
              search: buildSearchWithLang(lang, { photo: artwork.id }),
            })
          }
          style={secondaryBtn}
          aria-label={
            lang === "en" ? `Show ${artwork.id} in host screen` : `ホスト画面で ${artwork.id} を表示`
          }
        >
          {galleryCopy.commentUi.hostButton[lang]}
        </button>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ margin: "12px 0" }}>{galleryCopy.commentUi.heading[lang]}</h3>
        {items.length === 0 ? (
          <p style={{ color: "#888" }}>{galleryCopy.commentUi.noComment[lang]}</p>
        ) : (
          <ul style={commentList}>
            {items.map((item) => (
              <li key={item.id} style={commentItem}>
                <div style={commentMetaRow}>
                  <div style={{ fontSize: 13, color: "#777" }}>{dtf.format(new Date(item.createdAt))}</div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={deleteBtn}
                    aria-label={lang === "en" ? "Delete comment" : "コメントを削除"}
                  >
                    {deletingId === item.id
                      ? galleryCopy.commentUi.deleting[lang]
                      : galleryCopy.commentUi.delete[lang]}
                  </button>
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{item.text}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

const main: React.CSSProperties = {
  padding: 16,
  maxWidth: 720,
  margin: "0 auto",
};

const imgWrap: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fafafa",
};

const img: React.CSSProperties = {
  width: "100%",
  display: "block",
  objectFit: "cover",
};

const form: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gap: 10,
};

const label: React.CSSProperties = {
  fontWeight: 600,
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 16,
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "black",
  color: "white",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid black",
  background: "white",
  color: "black",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};

const commentList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 10,
};

const commentItem: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #eee",
  background: "#fff",
};

const commentMetaRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 8,
};

const deleteBtn: React.CSSProperties = {
  border: "1px solid #d0d0d0",
  background: "#fff",
  color: "#444",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
  flexShrink: 0,
};

const descWrap: React.CSSProperties = {
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 10,
  background: "#f6f7f8",
  border: "1px solid #eee",
};

const descText: React.CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  color: "#333",
  fontSize: 14,
  lineHeight: 1.6,
};
