import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

import { getArtworkOrFallback, formatArtworkDescription } from "../../lib/gallery";
import { resolveAppLang } from "../../lib/lang";
import { watchGallery } from "../../lib/live-gallery";
import type { CommentRow as DBCommentRow, PositionRow as DBPosRow } from "../../../shared/gallery-types";
import { writeApi } from "../../lib/api";

async function upsertPosition(row: DBPosRow): Promise<void> {
  await writeApi("/api/positions", "PUT", row);
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
  const topPct = 4 + h1 * 94;   // 4% ~ 96%
  const leftPct = 4 + h2 * 94;  // 4% ~ 96%
  return { top: `${topPct.toFixed(2)}%`, left: `${leftPct.toFixed(2)}%` };
}

export default function HostPicture() {
  const [params] = useSearchParams();
  const artwork = getArtworkOrFallback(params.get("photo") ?? "l1");
  const photoId = artwork.id;
  const src = artwork.imageUrl;
  const label = artwork.title.ja;
  const [items, setItems] = useState<DBCommentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [positionError, setPositionError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const dragIdRef = useRef<string | null>(null);

  const [positions, setPositions] = useState<Record<string, { top: number; left: number }>>({});
  const [zOrder, setZOrder] = useState<Record<string, number>>({});
  const zCounterRef = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // コメント登録順（作成日時の昇順）に基づいて色決定用のランクを作る
  const rankById = useMemo<Record<string, number>>(() => {
    if (!items || items.length === 0) return {};
    const asc = [...items].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const map: Record<string, number> = {};
    asc.forEach((row, idx) => {
      map[row.id] = idx; // 0,1,2,3,... (登録順)
    });
    return map;
  }, [items]);

  const iconForRank = (rank?: number) => {
    const order = ["/pink.png", "/yellow.png", "/green.png", "/blue.png"] as const;
    if (rank === undefined || rank === null || Number.isNaN(rank)) return order[0];
    return order[rank % order.length];
  };

  const bgForRank = (rank?: number): React.CSSProperties => {
    const palette = [
      { rgb: [255, 105, 180] },  // pink
      { rgb: [255, 215, 0] },    // yellow
      { rgb: [76, 175, 80] },    // green
      { rgb: [33, 150, 243] },   // blue
    ] as const;
    const pick = (rank === undefined || rank === null || Number.isNaN(rank)) ? palette[0] : palette[rank % palette.length];
    const [r, g, b] = pick.rgb;
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.16)`,
      border: `1px solid rgba(${r}, ${g}, ${b}, 0.45)`,
    };
  };

const pillBase: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 9999,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  backdropFilter: "saturate(120%)",
  transform: "translateX(40%)",
};

  const paramString = params.toString();
  const uiLang = useMemo(() => resolveAppLang(`?${paramString}`), [paramString]);
  const descriptionText = formatArtworkDescription(artwork, uiLang);

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
    setLoading(true);
    setItems([]);
    setPositions({});
    setZOrder({});
    setLoadError(false);
    setPositionError(false);
    return watchGallery(photoId, ({ comments, positions: saved }) => {
      setItems(comments);
      setPositions(prev => {
        const next: Record<string, { top: number; left: number }> = {};
        for (const comment of comments) {
          const stored = saved.find(row => row.comment_id === comment.id);
          const fallback = positionFor(comment.id);
          next[comment.id] = comment.id === dragIdRef.current && prev[comment.id]
            ? prev[comment.id]
            : stored ? { top: stored.top_pct, left: stored.left_pct }
              : { top: parseFloat(fallback.top), left: parseFloat(fallback.left) };
        }
        return next;
      });
      setLoading(false);
      setLoadError(false);
    }, () => { setLoading(false); setLoadError(true); });
  }, [photoId]);

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>みんなのコメント — {descriptionText}</h2>
        <Link to={`/host?lang=${uiLang}`} style={{ textDecoration: "none", fontSize: 14 }}>← 一覧に戻る</Link>
      </header>

      {loadError && <p role="status">{uiLang === "en"
        ? "Comments could not be refreshed. Reconnecting…"
        : "コメントを更新できませんでした。再接続しています…"}</p>}

      {positionError && <p role="alert">{uiLang === "en"
        ? "The position could not be saved. Please wait a moment and try again."
        : "位置を保存できませんでした。少し待ってから、もう一度お試しください。"}</p>}

      <section style={imgWrap}>
        <img src={src} alt={label} style={img} />
      </section>

      <section style={commentsWrap}>
        {/* コメント配置ステージ（少し内側に縮小） */}
        <div style={commentStage} ref={containerRef}>
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
                  if (e.button !== 0) return;
                  e.preventDefault();
                  bringToFront(c.id);
                  dragIdRef.current = c.id;
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
                    dragIdRef.current = null;
                    setDragId(null);
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    const p = positions[c.id];
                    if (p) {
                      setPositionError(false);
                      void upsertPosition({
                        comment_id: c.id,
                        photo_id: photoId,
                        top_pct: p.top,
                        left_pct: p.left,
                      }).catch(() => setPositionError(true));
                    }
                  }
                }}
                onDragStart={(e) => e.preventDefault()}
                onPointerCancel={() => { dragIdRef.current = null; setDragId(null); }}
                onLostPointerCapture={() => { dragIdRef.current = null; setDragId(null); }}
                onClick={() => bringToFront(c.id)}
              >
                <div style={{ ...pillBase, ...bgForRank(rankById[c.id]) }}>
                  <img
                    src={iconForRank(rankById[c.id])}
                    alt="comment marker"
                    draggable={false}
                    style={{ width: 43, height: 43, display: "block", flex: "0 0 auto", marginTop: -13 }}
                  />
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 17, color: "#222" }}>{c.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 写真の説明 */}
      {descriptionText && (
        <section style={descWrap}>
          <p style={descText}>
            広島平和記念資料館所蔵 {" / "}
            {descriptionText}
          </p>
        </section>
      )}
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

const commentsWrap: React.CSSProperties = {
  position: "relative",
  border: "1px dashed #FFF",
  borderRadius: 12,
  overflow: "hidden",
  backgroundImage: 'url("/image.png")',
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  minHeight: 0,
  aspectRatio: "4 / 4",
  marginTop: 12,
};

const commentStage: React.CSSProperties = {
  position: "absolute",
  inset: "12%",
  pointerEvents: "auto",
};

const img: React.CSSProperties = {
  width: "100%",
  display: "block",
  objectFit: "contain",
};

// const overlayLayer: React.CSSProperties = {
//   position: "absolute",
//   inset: 0,
//   pointerEvents: "auto",
// };

const bubble: React.CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  maxWidth: "40%",
  padding: 0,
  borderRadius: 12,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  backdropFilter: "none",
  userSelect: "none",
  touchAction: "none",
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

const descWrap: React.CSSProperties = {
  marginTop: 12,
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
