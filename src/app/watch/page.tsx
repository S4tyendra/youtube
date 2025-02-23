"use client"

import { useCallback, useEffect, useState, useRef } from "react"
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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastSyncTime = useRef<number>(0)
  const isBuffering = useRef<boolean>(false)
  const isSeeking = useRef<boolean>(false)

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

  // Handle video-audio synchronization
  useEffect(() => {
    const videoElement = videoRef.current
    const audioElement = audioRef.current

    if (!videoElement || !audioElement) return

    const syncAudioWithVideo = () => {
      const now = Date.now()
      // Only sync if enough time has passed since last sync (prevent too frequent syncs)
      if (now - lastSyncTime.current > 1000) {
        const timeDiff = Math.abs(videoElement.currentTime - audioElement.currentTime)
        if (timeDiff > 0.3) {
          audioElement.currentTime = videoElement.currentTime
          lastSyncTime.current = now
        }
      }
    }

    const handlePlay = () => {
      if (!isBuffering.current) {
        audioElement.play().catch(() => {
          // Handle play promise rejection
        })
      }
    }

    const handlePause = () => {
      audioElement.pause()
    }

    const handleSeeking = () => {
      isSeeking.current = true
      audioElement.pause()
    }

    const handleSeeked = () => {
      isSeeking.current = false
      audioElement.currentTime = videoElement.currentTime
      if (!videoElement.paused) {
        audioElement.play().catch(() => {
          // Handle play promise rejection
        })
      }
    }

    const handleWaiting = () => {
      isBuffering.current = true
      audioElement.pause()
    }

    const handlePlaying = () => {
      isBuffering.current = false
      if (!videoElement.paused) {
        syncAudioWithVideo()
        audioElement.play().catch(() => {
          // Handle play promise rejection
        })
      }
    }

    const handleVolumeChange = () => {
      audioElement.volume = videoElement.volume
    }

    const handleTimeUpdate = () => {
      if (!isSeeking.current && !isBuffering.current) {
        syncAudioWithVideo()
      }
    }

    const handleEnded = () => {
      audioElement.pause()
      audioElement.currentTime = 0
    }

    videoElement.addEventListener("play", handlePlay)
    videoElement.addEventListener("pause", handlePause)
    videoElement.addEventListener("seeking", handleSeeking)
    videoElement.addEventListener("seeked", handleSeeked)
    videoElement.addEventListener("waiting", handleWaiting)
    videoElement.addEventListener("playing", handlePlaying)
    videoElement.addEventListener("volumechange", handleVolumeChange)
    videoElement.addEventListener("timeupdate", handleTimeUpdate)
    videoElement.addEventListener("ended", handleEnded)

    // Set initial volume
    audioElement.volume = videoElement.volume

    return () => {
      videoElement.removeEventListener("play", handlePlay)
      videoElement.removeEventListener("pause", handlePause)
      videoElement.removeEventListener("seeking", handleSeeking)
      videoElement.removeEventListener("seeked", handleSeeked)
      videoElement.removeEventListener("waiting", handleWaiting)
      videoElement.removeEventListener("playing", handlePlaying)
      videoElement.removeEventListener("volumechange", handleVolumeChange)
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      videoElement.removeEventListener("ended", handleEnded)
    }
  }, [videoData])

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

  // Get best quality video (acodec: "none") and audio streams
  const videoStream = data.formats
    .filter(format => format.acodec === "none" && format.ext === "mp4")
    .sort((a, b) => (b.height || 0) - (a.height || 0))[0]

  const audioStream = data.formats
    .filter(format => format.vcodec === "none")
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0]

  // Fallback to a format with both audio and video if separate streams aren't available
  const fallbackFormat = data.formats
    .filter(format => format.acodec !== "none" && format.vcodec !== "none")
    .sort((a, b) => (b.height || 0) - (a.height || 0))[0]

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              {(videoStream || fallbackFormat) && (
                <>
                  <video
                    ref={videoRef}
                    controls
                    poster={maxResThumbnail}
                    className="w-full h-full object-cover"
                    src={videoStream?.url || fallbackFormat.url}
                    preload="auto"
                  />
                  {videoStream && audioStream && (
                    <audio
                      ref={audioRef}
                      src={audioStream.url}
                      preload="auto"
                      style={{ display: 'none' }}
                    />
                  )}
                </>
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