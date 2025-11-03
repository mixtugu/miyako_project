import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

// 📷 GuestPageA의 사진 세트와 동일해야 함
const PHOTOS = {
  l1: "/L_1.jpg",
  l2: "/L_2.jpg",
  l3: "/L_3.jpg",
  l4: "/L_4.jpg",
  l5: "/L_5.jpg",
} as const;

// 📄 사진별 설명 (ja/en). 필요에 따라 문구를 수정하세요.
const DESCRIPTIONS: Record<string, { ja: string; en: string }> = {
  l1: { ja: "作品名「閃光」曽根沙也佳", en: "作品名「閃光」曽根沙也佳" },
  l2: { ja: "作品名「閃光ののち伏せた場面」倉重侑季", en: "作品名「閃光ののち伏せた場面」倉重侑季" },
  l3: { ja: "作品名「被爆後に立ち上がったところ（荒神橋から見た爆風によってなぎ倒された家々）」富田真衣", en: "作品名「被爆後に立ち上がったところ（荒神橋から見た爆風によってなぎ倒された家々）」富田真衣" },
  l4: { ja: "作品名「熱線で火傷し機関車のオイルを塗っている」富田真衣", en: "作品名「熱線で火傷し機関車のオイルを塗っている」富田真衣" },
  l5: { ja: "作品名「橋のたもとの被爆者が私を見つめている」倉重侑季", en: "作品名「橋のたもとの被爆者が私を見つめている」倉重侑季" },
};

export default function GuestPageA2() {
  const [params] = useSearchParams();
  const photoId = params.get("photo") ?? "l1";
  const photoUrl = (PHOTOS as Record<string, string>)[photoId] ?? PHOTOS.l1;

  // Locale: choose via ?lang=ja | ?lang=en, fallback to browser
  const langParam = params.get("lang");
  const locale = useMemo(() => {
    if (langParam === "ja") return "ja-JP";
    if (langParam === "en") return "en-US";
    return navigator.language?.startsWith("ja") ? "ja-JP" : "en-US";
  }, [langParam]);
  
  const dtf = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );

  const uiLang = locale.startsWith("ja") ? "ja" : "en";
  const descriptionText = (DESCRIPTIONS[photoId]?.[uiLang] ?? "").trim();

  const [text, setText] = useState("");
  const [items, setItems] = useState<CommentItem[]>([]);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    const order = ["l1", "l2", "l3", "l4", "l5", "l6"];
    const idx = order.indexOf(photoId) + 1;
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
        選択した写真を確認してコメントを残してください。
      </p>

      {/* 선택한 사진 표시 */}
      <section style={imgWrap}>
        <img src={photoUrl} alt="選択した写真" style={img} />
      </section>

      {/* 사진 설명 */}
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
        <label htmlFor="comment" style={label}>コメント</label>
        <textarea
          id="comment"
          placeholder="内容を入力してください"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={textarea}
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={saving || !text.trim()}
          style={primaryBtn}
        >
          {saving ? "保存中..." : "コメントを保存"}
        </button>
      </section>

      {/* 댓글 목록 */}
      <section style={{ marginTop: 20 }}>
        <h3 style={{ margin: "12px 0" }}>コメント一覧</h3>
        {items.length === 0 ? (
          <p style={{ color: "#888" }}>まだコメントがありません。</p>
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