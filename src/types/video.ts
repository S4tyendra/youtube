export interface Video {
  id: string
  title: string
  thumbnail: string
  thumbnails?: Array<{
    url: string
    height: number
    width: number
  }>
  uploader: string
  channel_url?: string
  channel_is_verified?: boolean
  duration: number
  view_count?: string
  upload_date?: string
  live_status?: string | null
}