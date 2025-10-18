import { useEffect, useMemo, useState } from "react";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { useSearchParams, Link } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";

function urlFromId(id: string): string {
  if (id.startsWith("l")) {
    const n = Number(id.slice(1)) || 1;
    return `/L_${n}.jpg`;
    }
  if (id.startsWith("k")) {
    const n = Number(id.slice(1)) || 1;
    return `/K_${n}.jpg`;
  }
  return "/L_1.jpg";
}

function labelFromId(id: string): string {
  if (id.startsWith("l")) {
    const n = Number(id.slice(1)) || 1;
    return `絵 ${n}`;
  }
  if (id.startsWith("k")) {
    const n = Number(id.slice(1)) || 1;
    return `絵 ${n + 6}`;
  }
  return "絵";
}

type DBCommentRow = {
  id: string;
  photo_id: string;
  text: string;
  created_at: string;
};

function hashToUnit(s: string): number {
  // deterministic hash -> [0,1)
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return (h >>> 0) / 0xffffffff;
}

function positionFor(id: string): { top: string; left: string } {
  // spread comments within safe margins (5%~85%) to avoid edges
  const h1 = hashToUnit(id);
  const h2 = hashToUnit(id + "x");
  const topPct = 8 + h1 * 74;   // 8% ~ 82%
  const leftPct = 8 + h2 * 74;  // 8% ~ 82%
  return { top: `${topPct.toFixed(2)}%`, left: `${leftPct.toFixed(2)}%` };
}

async function listCommentsByPhoto(photoId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, photo_id, text, created_at")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: false }) as { data: DBCommentRow[] | null; error: any };

  if (error) throw error;
  return (data ?? []);
}

export default function HostPicture() {
  const [params] = useSearchParams();
  const photoId = params.get("photo") ?? "l1";

  const src = useMemo(() => urlFromId(photoId), [photoId]);
  const label = useMemo(() => labelFromId(photoId), [photoId]);
  const [items, setItems] = useState<DBCommentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await listCommentsByPhoto(photoId);
        if (alive) setItems(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [photoId]);

  useEffect(() => {
    const channel = supabase
      .channel(`comments_${photoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `photo_id=eq.${photoId}` },
        (payload: RealtimePostgresInsertPayload<DBCommentRow>) => {
          const r = payload.new as DBCommentRow;
          setItems((prev: DBCommentRow[]) => [r, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId]);

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>みんなのコメント — {label}</h1>
        <Link to="/host" style={{ textDecoration: "none", fontSize: 14 }}>← 一覧に戻る</Link>
      </header>

      <section style={imgWrap}>
        <img src={src} alt={label} style={img} />

        {/* Floating comment bubbles overlay */}
        <div style={overlayLayer}>
          {loading ? (
            <div style={loadingBadge}>読み込み中...</div>
          ) : items.length === 0 ? (
            <div style={emptyBadge}>コメントはまだありません</div>
          ) : (
            items.map((c) => {
              const pos = positionFor(c.id);
              return (
                <div key={c.id} style={{ ...bubble, top: pos.top, left: pos.left }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    {dtf.format(new Date(c.created_at))}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{c.text}</div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

const imgWrap: React.CSSProperties = {
  position: "relative",
  border: "1px solid #eee",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fafafa",
  minHeight: 240,
};

const img: React.CSSProperties = {
  width: "100%",
  display: "block",
  objectFit: "contain",
};

const overlayLayer: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

const bubble: React.CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  maxWidth: "40%",
  padding: 10,
  borderRadius: 12,
  background: "rgba(255,255,255,0.88)",
  border: "1px solid #eaeaea",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  backdropFilter: "blur(2px)",
};

const loadingBadge: React.CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  fontSize: 13,
  color: "#555",
  background: "rgba(255,255,255,0.9)",
  border: "1px solid #eaeaea",
  borderRadius: 10,
  padding: "6px 10px",
};

const emptyBadge: React.CSSProperties = {
  position: "absolute",
  bottom: 12,
  right: 12,
  fontSize: 13,
  color: "#777",
  background: "rgba(255,255,255,0.9)",
  border: "1px solid #eaeaea",
  borderRadius: 10,
  padding: "6px 10px",
};