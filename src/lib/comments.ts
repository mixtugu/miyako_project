import { supabase } from "./supabaseClient";

export type CommentItem = {
  id: string;
  photoId: string;
  text: string;
  createdAt: string;
};

type DBCommentRow = {
  id: string;
  photo_id: string;
  text: string;
  created_at: string;
};

type SupabaseErrorLike = {
  message?: string;
};

export async function addCommentToDB(photoId: string, text: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ photo_id: photoId, text })
    .select()
    .single<DBCommentRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCommentFromDB(commentId: string) {
  const deleteComment = () =>
    supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

  const deletePositions = () =>
    supabase
      .from("comment_positions")
      .delete()
      .eq("comment_id", commentId);

  const { error: commentError } = await deleteComment();
  if (!commentError) {
    return;
  }

  const message = (commentError as SupabaseErrorLike)?.message?.toLowerCase() ?? "";
  const looksLikeForeignKeyFailure =
    message.includes("foreign key") || message.includes("violates") || message.includes("constraint");

  if (!looksLikeForeignKeyFailure) {
    throw commentError;
  }

  const { error: positionError } = await deletePositions();
  if (positionError) {
    throw positionError;
  }

  const { error: retryError } = await deleteComment();
  if (retryError) {
    throw retryError;
  }
}

export async function listCommentsByPhoto(photoId: string) {
  const { data, error } = (await supabase
    .from("comments")
    .select("*")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: false })) as {
    data: DBCommentRow[] | null;
    error: unknown;
  };

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    photoId: row.photo_id,
    text: row.text,
    createdAt: row.created_at,
  })) as CommentItem[];
}
