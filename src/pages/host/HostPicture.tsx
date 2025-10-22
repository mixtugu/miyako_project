import { useEffect, useMemo, useRef, useState } from "react";
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
    return `絵 ${n + 5}`;
  }
  return "絵";
}

type DBCommentRow = {
  id: string;
  photo_id: string;
  text: string;
  created_at: string;
};

type DBPosRow = {
  comment_id: string;
  photo_id: string;
  top_pct: number;
  left_pct: number;
  updated_at?: string;
};

async function listPositionsByPhoto(photoId: string): Promise<DBPosRow[]> {
  const { data, error } = await supabase
    .from("comment_positions")
    .select("comment_id, photo_id, top_pct, left_pct, updated_at")
    .eq("photo_id", photoId);

  if (error) {
    console.warn("listPositionsByPhoto error:", error.message);
    return [];
  }
  return (data ?? []) as DBPosRow[];
}

async function upsertPosition(row: DBPosRow): Promise<void> {
  const { error } = await supabase
    .from("comment_positions")
    .upsert(
      {
        comment_id: row.comment_id,
        photo_id: row.photo_id,
        top_pct: row.top_pct,
        left_pct: row.left_pct,
      },
      { onConflict: "comment_id" }
    );
  if (error) {
    console.warn("upsertPosition error:", error.message);
  }
}

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
  const topPct = 4 + h1 * 92;   // 4% ~ 96%
  const leftPct = 4 + h2 * 92;  // 4% ~ 96%
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

  const [positions, setPositions] = useState<Record<string, { top: number; left: number }>>({});
  const [zOrder, setZOrder] = useState<Record<string, number>>({});
  const zCounterRef = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);

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
    if (!items || items.length === 0) return;
    setPositions((prev) => {
      const next = { ...prev };
      items.forEach((c) => {
        if (!next[c.id]) {
          const pos = positionFor(c.id);
          next[c.id] = {
            top: parseFloat(pos.top),
            left: parseFloat(pos.left),
          };
        }
      });
      return next;
    });
    setZOrder((prev) => {
      const next = { ...prev };
      items.forEach((c) => {
        if (!next[c.id]) {
          zCounterRef.current += 1;
          next[c.id] = zCounterRef.current;
        }
      });
      return next;
    });
  }, [items]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const getStyleFor = (id: string): React.CSSProperties => {
    const p = positions[id];
    const top = p ? `${p.top}%` : positionFor(id).top;
    const left = p ? `${p.left}%` : positionFor(id).left;
    const z = zOrder[id] ?? 1;
    const h = hashToUnit(id);
    const delay = `${(h * 4).toFixed(2)}s`;       // 0s ~ 4s
    const duration = `${(5 + h * 3).toFixed(2)}s`; // 5s ~ 8s
    return {
      ...bubble,
      top,
      left,
      zIndex: z,
      cursor: dragId === id ? "grabbing" : "grab",
      pointerEvents: "auto",
      animation: `floatY ${duration} ease-in-out ${delay} infinite alternate`,
      animationFillMode: "both",
      animationPlayState: dragId === id ? "paused" : "running",
    };
  };

  const bringToFront = (id: string) => {
    setZOrder((prev) => {
      const next = { ...prev };
      zCounterRef.current += 1;
      next[id] = zCounterRef.current;
      return next;
    });
  };

  const updatePosFromPointer = (id: string, clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const topPct = ((clientY - rect.top) / rect.height) * 100;
    const leftPct = ((clientX - rect.left) / rect.width) * 100;
    setPositions((prev) => ({
      ...prev,
      [id]: { top: clamp(topPct, 4, 96), left: clamp(leftPct, 4, 96) },
    }));
  };
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
    (async () => {
      // fetch saved positions for this photo and merge into state
      const rows = await listPositionsByPhoto(photoId);
      if (rows.length === 0) return;
      setPositions((prev) => {
        const next = { ...prev };
        rows.forEach((r) => {
          next[r.comment_id] = { top: r.top_pct, left: r.left_pct };
        });
        return next;
      });
    })();
  }, [photoId, items.length]);

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
        <h2 style={{ margin: 0 }}>みんなのコメント — {label}</h2>
        <Link to="/host" style={{ textDecoration: "none", fontSize: 14 }}>← 一覧に戻る</Link>
      </header>

      <section style={imgWrap} ref={containerRef}>
        <img src={src} alt={label} style={img} />

        {/* Floating comment bubbles overlay */}
        <div style={overlayLayer}>
          {loading ? (
            <div style={loadingBadge}>読み込み中...</div>
          ) : items.length === 0 ? (
            <div style={emptyBadge}>コメントはまだありません</div>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                style={getStyleFor(c.id)}
                onPointerDown={(e) => {
                  bringToFront(c.id);
                  setDragId(c.id);
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  updatePosFromPointer(c.id, e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (dragId === c.id) {
                    updatePosFromPointer(c.id, e.clientX, e.clientY);
                  }
                }}
                onPointerUp={(e) => {
                  if (dragId === c.id) {
                    setDragId(null);
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    // persist current position
                    const p = positions[c.id];
                    if (p) {
                      upsertPosition({
                        comment_id: c.id,
                        photo_id: photoId,
                        top_pct: p.top,
                        left_pct: p.left,
                      });
                    }
                  }
                }}
                onClick={() => bringToFront(c.id)}
              >
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                  {dtf.format(new Date(c.created_at))}
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{c.text}</div>
              </div>
            ))
          )}
        </div>
      </section>
      <style>{`
        @keyframes floatY {
          0%   { transform: translate(-50%, -50%) translateY(0); }
          50%  { transform: translate(-50%, -50%) translateY(-6px); }
          100% { transform: translate(-50%, -50%) translateY(0); }
        }
      `}</style>
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
  pointerEvents: "auto",
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
  userSelect: "none",
  willChange: "transform",
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