"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { VideoCard } from "@/components/video-card"
import { AuthCheckDialog } from "@/components/auth-check-dialog"
import { VideoSkeleton } from "@/components/video-skeleton"
import { Video } from "@/types/video"

interface ClientFeedProps {
  initialPage: number
}

export function ClientFeed({ initialPage }: ClientFeedProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem("youtube_user_id")
    if (userId) {
      setIsAuthenticated(true)
      fetchFeed(userId)
    } else {
      setLoading(false)
    }
  }, [initialPage])

  const fetchFeed = async (userId: string) => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feed/recommendations?page=${initialPage}`,
        {
          headers: {
            login: userId
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("youtube_user_id")
          setIsAuthenticated(false)
          throw new Error("Unauthorized")
        }
        throw new Error("Failed to fetch feed")
      }

      const data = await response.json()
      setVideos(data.videos)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    const userId = localStorage.getItem("youtube_user_id")
    if (userId) {
      fetchFeed(userId)
    }
  }

  if (!isAuthenticated) {
    return <AuthCheckDialog onAuthSuccess={handleAuthSuccess} />
  }

  if (loading) {
    return <VideoSkeleton count={12} />
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => {
            const userId = localStorage.getItem("youtube_user_id")
            if (userId) fetchFeed(userId)
          }}
          className="mt-4 text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-3 px-4">
        {initialPage > 1 && (
          <button
            onClick={() => router.push(`/feed?page=${initialPage - 1}`)}
            className="px-4 py-2 border rounded-md hover:bg-accent transition-colors w-24"
          >
            Previous
          </button>
        )}
        <button
          onClick={() => router.push(`/feed?page=${initialPage + 1}`)}
          className="px-4 py-2 border rounded-md hover:bg-accent transition-colors w-24"
        >
          Next
        </button>
      </div>
    </>
  )
}