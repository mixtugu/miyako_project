export type CommentRow = {
  id: string;
  photo_id: string;
  text: string;
  created_at: string;
};

export type PositionRow = {
  comment_id: string;
  photo_id: string;
  top_pct: number;
  left_pct: number;
  updated_at?: string | null;
};

export type GallerySnapshot = { comments: CommentRow[]; positions: PositionRow[] };
export type GalleryPage = GallerySnapshot & { nextCursor: string | null };
