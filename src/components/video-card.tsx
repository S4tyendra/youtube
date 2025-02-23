"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnails: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  url: string;
  _type: string;
  ie_key: string;
  // Video specific properties
  description?: string;
  duration?: number;
  channel_id?: string;
  channel?: string;
  channel_url?: string;
  uploader?: string;
  uploader_id?: string;
  uploader_url?: string;
  view_count?: number;
  live_status?: string | null;
  channel_is_verified?: boolean | null;
  // Legacy properties for compatibility
  thumbnail?: string;
  viewCount?: string;
  uploadDate?: string;
}

export function VideoCard({
  id,
  title,
  thumbnails,
  url,
  channel,
  uploader,
  channel_url,
  channel_is_verified,
  duration,
  live_status,
  view_count
}: VideoCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Mix"; // For playlists with no duration
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Determine if it's a playlist based on URL
  const isPlaylist = url.includes("playlist");
  const linkPath = isPlaylist ? `/playlist?list=${id}` : `/watch?v=${id}`;

  // Use the highest quality thumbnail available
  const bestThumbnail = thumbnails[thumbnails.length - 1]?.url;

  // For playlists, use the channel name or a default
  const displayUploader = isPlaylist ? (channel || "Various Artists") : (uploader || channel || "Unknown Creator");

  return (
    <Card className="overflow-hidden group hover:bg-accent transition-colors border-0 h-[330px]">
      <Link href={linkPath} className="h-full">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="relative">
            <AspectRatio ratio={16/9}>
              <Image
                src={bestThumbnail || '/placeholder-thumbnail.jpg'}
                alt={title}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized // Since these are external YouTube thumbnails
              />
            </AspectRatio>
            {live_status === 'live' ? (
              <div className="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded">
                LIVE
              </div>
            ) : (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 text-xs rounded">
                {isPlaylist ? "Playlist" : formatDuration(duration)}
              </div>
            )}
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <h3 className="font-medium text-sm line-clamp-2 mb-2">
              {title}
              {isPlaylist && " (Playlist)"}
            </h3>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayUploader)}`} />
                <AvatarFallback>{displayUploader[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {channel_url ? (
                  <Link 
                    href={channel_url} 
                    className="text-sm text-muted-foreground hover:text-primary flex"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {displayUploader}
                    {channel_is_verified && (
                      <span className="ml-1 mt-1" title="Verified"><BadgeCheck className="text-blue-600 size-4"/></span>
                    )}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {displayUploader}
                  </span>
                )}
                {view_count !== undefined && !isPlaylist && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(view_count)} views
                  </p>
                )}
                {isPlaylist && (
                  <p className="text-xs text-muted-foreground mt-1">
                    YouTube Playlist
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