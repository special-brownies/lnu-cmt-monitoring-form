"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

type UserAvatarProps = {
  name?: string | null
  profileImagePath?: string | null
  imageSrc?: string | null
  className?: string
  textClassName?: string
  loading?: "eager" | "lazy"
}

function resolveImageSource(input?: string | null) {
  if (!input) {
    return null
  }

  if (
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    input.startsWith("blob:") ||
    input.startsWith("data:")
  ) {
    return input
  }

  const normalizedPath = input.startsWith("/") ? input : `/${input}`
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")

  if (!apiBaseUrl) {
    return normalizedPath
  }

  return `${apiBaseUrl}${normalizedPath}`
}

function toInitial(name?: string | null) {
  const value = name?.trim()

  if (!value) {
    return "U"
  }

  return value.slice(0, 1).toUpperCase()
}

export function UserAvatar({
  name,
  profileImagePath,
  imageSrc,
  className,
  textClassName,
  loading = "lazy",
}: UserAvatarProps) {
  const resolvedSource = useMemo(() => {
    if (imageSrc) {
      return resolveImageSource(imageSrc)
    }

    return resolveImageSource(profileImagePath)
  }, [imageSrc, profileImagePath])

  const [failedSource, setFailedSource] = useState<string | null>(null)
  const hasImageError =
    Boolean(resolvedSource) && failedSource !== null && failedSource === resolvedSource

  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white",
        className,
      )}
    >
      {resolvedSource && !hasImageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSource}
          alt={name ? `${name} profile picture` : "Profile picture"}
          className="h-full w-full object-cover"
          loading={loading}
          decoding="async"
          onError={() => setFailedSource(resolvedSource)}
        />
      ) : (
        <span className={cn("leading-none", textClassName)}>{toInitial(name)}</span>
      )}
    </span>
  )
}
