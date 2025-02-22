import { Suspense } from "react"
import { ClientFeed } from "@/components/feed-client"
import { VideoSkeleton } from "@/components/video-skeleton"

export default function FeedPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Number(searchParams.page) || 1

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <Suspense fallback={<VideoSkeleton />}>
        <ClientFeed initialPage={page} />
      </Suspense>
    </div>
  )
}
