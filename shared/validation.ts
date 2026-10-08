export const MAX_COMMENT_LENGTH = 2000;
export const MAX_BODY_BYTES = 12_288;

export function isPhotoId(value: unknown): value is string {
  return typeof value === "string" && /^[lk][1-5]$/.test(value);
}

export function isCommentId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

export function isCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 4 && value <= 96;
}
