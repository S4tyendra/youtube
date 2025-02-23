export interface Video {
  id: string
  title: string
  thumbnails: Array<{
    url: string
    height: number
    width: number
  }>
  url: string
  _type: string
  ie_key: string
  // Video specific properties
  description?: string
  duration?: number
  channel_id?: string
  channel?: string
  channel_url?: string
  uploader?: string
  uploader_id?: string
  uploader_url?: string
  view_count?: number
  live_status?: string | null
  channel_is_verified?: boolean | null
  // Legacy properties for compatibility
  thumbnail?: string
}