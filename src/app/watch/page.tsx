"use client"

import { useCallback, useEffect, useState } from "react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { Separator } from "@/components/ui/separator"

interface VideoData {
  data: {
    title: string
    description: string
    thumbnail: string
    duration: number
    view_count: number
    like_count: number
    comment_count: number
    webpage_url: string
    tags: string[]
    categories: string[]
    playable_in_embed: boolean
    upload_date: string
    fulltitle: string
    is_live: boolean
    was_live: boolean
    channel: string
    channel_id: string
    channel_url: string
    channel_follower_count: number
    uploader: string
    uploader_id: string
    uploader_url: string
    thumbnails: Array<{
      id: string
      url: string
    }>
    formats: Array<{
      format_id: string
      format_note: string
      ext: string
      resolution: string
      vcodec: string
      acodec: string
      filesize: number
      url: string
      tbr: number
      abr: number
      vbr: number
      width: number
      height: number
      http_headers: {
        "User-Agent": string
      }
    }>
  }
}

export default function WatchPage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("v")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [videoData, setVideoData] = useState<VideoData | null>(null)

  const fetchVideoData = useCallback(async () => {
    if (!videoId) return

    try {
      setLoading(true)
      const userId = localStorage.getItem("youtube_user_id")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/watch?v=${videoId}`,
        {
          headers: {
            login: userId || ""
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("youtube_user_id")
          throw new Error("Unauthorized")
        }
        throw new Error("Failed to fetch video data")
      }

      const data = await response.json()
      setVideoData(data)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    fetchVideoData()
  }, [fetchVideoData])

  if (!videoId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">No video ID provided</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="animate-pulse">
          <div className="w-full bg-muted rounded-lg aspect-video mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchVideoData} variant="outline">
          Try again
        </Button>
      </div>
    )
  }

  if (!videoData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive">No video data available</p>
      </div>
    )
  }

  const { data } = videoData
  const maxResThumbnail = data.thumbnails.find(thumb => thumb.id === "40")?.url || data.thumbnail
  const bestFormat = data.formats.find(format => format.ext === "mp4" && format.height === 720) || data.formats[0]

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              {bestFormat && (
                <video
                  controls
                  poster={maxResThumbnail}
                  className="w-full h-full object-cover"
                  src={bestFormat.url}
                />
              )}
            </AspectRatio>
          </Card>

          <div className="mt-4 space-y-4">
            <h1 className="text-2xl font-bold">{data.title}</h1>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href={data.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-medium"
                >
                  {data.channel}
                </a>
                <span className="text-sm text-muted-foreground">
                  {data.channel_follower_count?.toLocaleString()} subscribers
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm">
                  {data.view_count?.toLocaleString()} views
                </span>
                <span className="text-sm">
                  {data.like_count?.toLocaleString()} likes
                </span>
              </div>
            </div>

            <Separator />

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{data.description}</pre>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Video Information</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Upload Date:</span>{" "}
              {new Date(data.upload_date).toLocaleDateString()}
            </p>
            <p className="text-sm">
              <span className="font-medium">Duration:</span>{" "}
              {Math.floor(data.duration / 60)}:{String(data.duration % 60).padStart(2, "0")}
            </p>
            {data.categories?.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">Categories:</span>{" "}
                {data.categories.join(", ")}
              </p>
            )}
            {data.tags?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}