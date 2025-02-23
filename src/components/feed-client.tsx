"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  // const lastVideoRef = useRef<HTMLDivElement | null>(null)

  const fetchFeed = async (userId: string, pageNum: number) => {
    if (loadingRef.current) return
    loadingRef.current = true

    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feed/recommendations?page=${pageNum}`,
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
        if (response.status === 500) {
          localStorage.removeItem("youtube_user_id")
          return
        }
        throw new Error("Failed to fetch feed")
      }

      const data = await response.json()
      if (data.data.entries.length === 0) {
        setHasMore(false)
        if (pageNum === 1) {
          setVideos([])
        }
      } else {
        setVideos(prev => [...prev, ...data.data.entries])
        setPage(pageNum)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred"
      setError(message)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const lastVideoCallback = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const userId = localStorage.getItem("youtube_user_id")
        if (userId) {
          fetchFeed(userId, page + 1)
        }
      }
    })

    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, page])

  useEffect(() => {
    const userId = localStorage.getItem("youtube_user_id")
    if (userId) {
      setIsAuthenticated(true)
      fetchFeed(userId, initialPage)
    } else {
      setLoading(false)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [initialPage])

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    const userId = localStorage.getItem("youtube_user_id")
    if (userId) {
      fetchFeed(userId, initialPage)
    }
  }

  if (!isAuthenticated) {
    return <AuthCheckDialog onAuthSuccess={handleAuthSuccess} />
  }

  if (loading && videos.length === 0) {
    return <VideoSkeleton count={12} />
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => {
            const userId = localStorage.getItem("youtube_user_id")
            if (userId) fetchFeed(userId, page)
          }}
          className="mt-4 text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-10">
        <p>No videos available in your feed</p>
      </div>
    )
  }

  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {videos.map((video, index) => (
        <div
          key={video.id}
          ref={index === videos.length - 1 ? lastVideoCallback : null}
        >
          <VideoCard {...video} />
        </div>
      ))}
    </div>
    {loading && hasMore && <div className="mt-7"><VideoSkeleton count={12} /></div>}
    </>
  )
}