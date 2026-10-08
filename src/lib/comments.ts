import { writeApi } from "./api";
import { readGallery } from "./live-gallery";

export type CommentItem = {
  id: string;
  photoId: string;
  text: string;
  createdAt: string;
};

export async function addCommentToDB(photoId: string, text: string) {
  await writeApi("/api/comments", "POST", { photoId, text });
}

export async function deleteCommentFromDB(commentId: string, password: string) {
  await writeApi(`/api/comments/${encodeURIComponent(commentId)}`, "DELETE", undefined, password);
}

export async function listCommentsByPhoto(photoId: string) {
  const { comments } = await readGallery(photoId);
  return comments.map((row) => ({
    id: row.id,
    photoId: row.photo_id,
    text: row.text,
    createdAt: row.created_at,
  })) as CommentItem[];
}
