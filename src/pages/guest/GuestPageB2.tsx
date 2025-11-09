import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

type CommentItem = {
  id: string;
  photoId: string;
  text: string;
  createdAt: string; // ISO timestamp
};

type DBCommentRow = {
  id: string;
  photo_id: string;
  text: string;
  created_at: string;
};

async function addCommentToDB(photoId: string, text: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ photo_id: photoId, text })
    .select()
    .single<DBCommentRow>();

  if (error) throw error;
  return data;
}

async function listCommentsByPhoto(photoId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: false }) as { data: DBCommentRow[] | null; error: any };

  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    photoId: r.photo_id,
    text: r.text,
    createdAt: r.created_at,
  })) as CommentItem[];
}

// 📷 GuestPageAの写真セットと同じく k1〜k5 に変更
const PHOTOS = {
  k1: "/K_1.jpg",
  k2: "/K_2.jpg",
  k3: "/K_3.jpg",
  k4: "/K_4.jpg",
  k5: "/K_5.jpg",
} as const;

// 入力パラメータの写真IDを正規化（例: k1 → k1、未知は k1）
function normalizePhotoId(id: string): keyof typeof PHOTOS {
  const m = id.toLowerCase().match(/^k([1-5])$/);
  if (m) return (`k${m[1]}` as keyof typeof PHOTOS);
  const key = id as keyof typeof PHOTOS;
  return PHOTOS[key] ? key : 'k1';
}

// 📄 写真別の説明文（ja/en）—必要に応じて編集してください
const DESCRIPTIONS: Record<string, { ja: string; en: string }> = {
  k1: { ja: "作品名「倒壊校舎からの脱出」花岡美優", en: "作品名「倒壊校舎からの脱出」花岡美優" },
  k2: { ja: "作品名「プールサイドの惨劇」室星理歩", en: "作品名「プールサイドの惨劇」室星理歩" },
  k3: { ja: "作品名「『友達を助けてくれ！』『火が廻って来たぞ、逃げろ！』」宮本陽菜", en: "作品名「『友達を助けてくれ！』『火が廻って来たぞ、逃げろ！』」宮本陽菜" },
  k4: { ja: "作品名「人間襤褸（らんる）の群れの中に」津村果奈", en: "作品名「人間襤褸（らんる）の群れの中に」津村果奈" },
  k5: { ja: "作品名「忘れられない　〜あの眼」富田葵天", en: "作品名「忘れられない　〜あの眼」富田葵天" },
};

export default function GuestPageB2() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const rawId = params.get("photo") ?? "k1";
  const photoId = normalizePhotoId(rawId);
  const photoUrl = PHOTOS[photoId];

  // ----- Language resolution: URL ?lang= → localStorage(app_lang) → browser -----
  const [lang, setLang] = useState<"ja" | "en">("ja");

  useEffect(() => {
    const q = params.get("lang");
    if (q === "ja" || q === "en") {
      setLang(q);
      try { localStorage.setItem("app_lang", q); } catch {}
      try { document.documentElement.lang = q; } catch {}
      return;
    }
    try {
      const saved = localStorage.getItem("app_lang");
      if (saved === "ja" || saved === "en") {
        setLang(saved);
        try { document.documentElement.lang = saved; } catch {}
        return;
      }
    } catch {}
    const browserIsJa = (navigator.language || navigator.languages?.[0] || "ja").toLowerCase().startsWith("ja");
    const fallback = browserIsJa ? "ja" : "en";
    setLang(fallback);
    try { document.documentElement.lang = fallback; } catch {}
  }, [params]);

  // locale / formatter derived from lang
  const locale = useMemo(() => (lang === "ja" ? "ja-JP" : "en-US"), [lang]);
  const dtf = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
    [locale]
  );

  const uiLang = lang;
  const descriptionText = (DESCRIPTIONS[photoId]?.[uiLang] ?? "").trim();

  const TEXT = {
    ja: {
      guidance1: "この作品を鑑賞してあなたが感じたことをコメント欄に入力してください。",
      guidance2: "思いやりと敬意をもってご感想をお寄せください。",
      guidance3: "この空間は共感と創造を大切にしています。誹謗中傷や他者を傷つける内容はお控えください。",
      labelComment: "コメント",
      placeholder: "あなたの想い",
      save: "コメントを保存",
      saving: "保存中...",
      goHost: "想いが重ねられた作品をご覧になりたい方はこちらへ",
      commentList: "コメント一覧",
      noComment: "まだコメントがありません。",
    },
    en: {
      guidance1: "Please share your thoughts and feelings about this artwork in the comment box below.",
      guidance2: "We kindly ask that you write with compassion and respect.",
      guidance3: "This space values empathy and creativity — please refrain from posting any hurtful or disrespectful comments.",
      labelComment: "Comment",
      placeholder: "Your thoughts and feelings",
      save: "Save",
      saving: "Saving...",
      goHost: "See works with shared comments here",
      commentList: "Comments",
      noComment: "No comments yet.",
    },
  } as const;

  const [text, setText] = useState("");
  const [items, setItems] = useState<CommentItem[]>([]);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    //const order = ["k1", "k2", "k3", "k4", "k5"] as const;
    //const idx = order.indexOf(photoId) + 1;
    return descriptionText;
  }, [photoId]);

  useEffect(() => {
    (async () => {
      try {
        const list = await listCommentsByPhoto(photoId);
        setItems(list);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [photoId]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      await addCommentToDB(photoId, trimmed);
      setText("");
      const list = await listCommentsByPhoto(photoId);
      setItems(list);
    } catch (e) {
      console.error(e);
      alert("コメントの保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <p style={{ color: "#666" }}>
        {TEXT[uiLang].guidance1}
        <br />
        <br />
        {TEXT[uiLang].guidance2}
        <br />
        {TEXT[uiLang].guidance3}
      </p>

      {/* 선택한 사진 표시 */}
      <section style={imgWrap}>
        <img src={photoUrl} alt={uiLang === "en" ? "Selected photo" : "選択した写真"} style={img} />
      </section>

      {/* 写真の説明 */}
      {descriptionText && (
        <section style={descWrap}>
          <p style={descText}>
            広島平和記念資料館所蔵　
            {' 　'}
            {descriptionText}
          </p>
        </section>
      )}

      {/* 댓글 입력 */}
      <section style={form}>
        <label htmlFor="comment" style={label}>{TEXT[uiLang].labelComment}</label>
        <textarea
          id="comment"
          placeholder={TEXT[uiLang].placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={textarea}
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={saving || !text.trim()}
          style={primaryBtn}
          aria-label={uiLang === "en" ? "Save comment" : "コメントを保存"}
        >
          {saving ? TEXT[uiLang].saving : TEXT[uiLang].save}
        </button>
        <button
          type="button"
          onClick={() => {
            const outId = /^k[1-5]$/i.test(rawId) ? rawId.toLowerCase() : photoId.replace(/^k/, "k");
            navigate(`/host/picture?photo=${outId}&lang=${lang}`);
          }}
          style={secondaryBtn}
          aria-label={uiLang === "en" ? `Show ${photoId} in host screen` : `ホスト画面で ${photoId} を表示`}
        >
          {TEXT[uiLang].goHost}
        </button>
      </section>

      {/* 댓글 목록 */}
      <section style={{ marginTop: 20 }}>
        <h3 style={{ margin: "12px 0" }}>{TEXT[uiLang].commentList}</h3>
        {items.length === 0 ? (
          <p style={{ color: "#888" }}>{TEXT[uiLang].noComment}</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {items.map((c) => (
              <li key={c.id} style={commentItem}>
                <div style={{ fontSize: 13, color: "#777" }}>
                  {dtf.format(new Date(c.createdAt))}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{c.text}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// 🎨 스타일 정의
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

const commentItem: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #eee",
  background: "#fff",
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