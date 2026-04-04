export interface Env {
  GAME_ROOM: DurableObjectNamespace
  PHOTOS_BUCKET: R2Bucket
}

export interface RateLimitEntry {
  count: number
  resetAt: number
}
