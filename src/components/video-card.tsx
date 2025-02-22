"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  uploader: string;
  channel_url?: string;
  channel_is_verified?: boolean;
  duration: number;
  viewCount?: string;
  uploadDate?: string;
  live_status?: string | null;
  thumbnails?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

export function VideoCard({ 
  id, 
  title, 
  thumbnail, 
  uploader,
  channel_url,
  channel_is_verified,
  duration,
  viewCount,
  uploadDate,
  live_status,
  thumbnails
}: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Use the highest quality thumbnail available
  const bestThumbnail = thumbnails ? thumbnails[thumbnails.length - 1].url : thumbnail;

  return (
    <Card className="overflow-hidden group hover:bg-accent transition-colors border-0">
      <Link href={`/watch?v=${id}`}>
        <CardContent className="p-0">
          <div className="relative">
            <AspectRatio ratio={16/9}>
              <Image
                src={bestThumbnail}
                alt={title}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </AspectRatio>
            {live_status === 'live' ? (
              <div className="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
                LIVE
              </div>
            ) : (
              duration && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 text-xs rounded">
                  {formatDuration(duration)}
                </div>
              )
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium text-sm line-clamp-2 mb-1">{title}</h3>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(uploader)}`} />
                <AvatarFallback>{uploader[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Link 
                  href={channel_url || "#"} 
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    if (channel_url) {
                      e.stopPropagation();
                    }
                  }}
                >
                  {uploader}
                  {channel_is_verified && (
                    <span className="ml-1" title="Verified">✓</span>
                  )}
                </Link>
                {viewCount && uploadDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {viewCount} views • {uploadDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}