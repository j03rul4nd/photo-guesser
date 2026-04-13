export interface Env {
  GAME_ROOM: DurableObjectNamespace
  PHOTOS_BUCKET: R2Bucket
  /** Secret para firmar tokens de upload (Cloudflare Worker secret). Si no está
   *  definido, la validación de tokens se omite (modo dev sin wrangler secret). */
  UPLOAD_SECRET?: string
}

export interface RateLimitEntry {
  count: number
  resetAt: number
}
