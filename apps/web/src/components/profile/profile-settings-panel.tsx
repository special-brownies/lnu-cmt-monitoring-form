"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CropIcon, ImageIcon, ImageUpIcon, SaveIcon, ZoomInIcon } from "lucide-react"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { notifySuccess } from "@/lib/activity-toast"
import { uploadMyProfileImage, updateMyProfile } from "@/lib/api/profile"
import type { CurrentUser } from "@/types/auth"

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
])
const CROP_FRAME_SIZE = 280
const CROPPED_OUTPUT_SIZE = 512
const MIN_CROP_ZOOM = 1
const MAX_CROP_ZOOM = 4

type ProfileFormState = {
  name: string
  email: string
}

type CropDraft = {
  file: File
  objectUrl: string
  imageWidth: number
  imageHeight: number
  zoom: number
  offsetXPercent: number
  offsetYPercent: number
}

type CropMetrics = {
  displayedWidth: number
  displayedHeight: number
  imageLeft: number
  imageTop: number
  maxOffsetX: number
  maxOffsetY: number
  scale: number
}

type ProfileSettingsPanelProps = {
  title?: string
  subtitle?: string
  widerLayout?: boolean
}

function normalizeProfileValues(user: CurrentUser | undefined, form: ProfileFormState) {
  if (!user) {
    return null
  }

  if (user.role === "SUPER_ADMIN") {
    return {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
    }
  }

  return {
    name: form.name.trim(),
  }
}

function mapUserToProfileForm(user: CurrentUser): ProfileFormState {
  return {
    name: user.name,
    email: user.email ?? "",
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildCropMetrics(draft: CropDraft): CropMetrics {
  const baseScale = Math.max(CROP_FRAME_SIZE / draft.imageWidth, CROP_FRAME_SIZE / draft.imageHeight)
  const scale = baseScale * draft.zoom
  const displayedWidth = draft.imageWidth * scale
  const displayedHeight = draft.imageHeight * scale
  const maxOffsetX = Math.max((displayedWidth - CROP_FRAME_SIZE) / 2, 0)
  const maxOffsetY = Math.max((displayedHeight - CROP_FRAME_SIZE) / 2, 0)
  const offsetX = (draft.offsetXPercent / 100) * maxOffsetX
  const offsetY = (draft.offsetYPercent / 100) * maxOffsetY

  return {
    displayedWidth,
    displayedHeight,
    imageLeft: (CROP_FRAME_SIZE - displayedWidth) / 2 + offsetX,
    imageTop: (CROP_FRAME_SIZE - displayedHeight) / 2 + offsetY,
    maxOffsetX,
    maxOffsetY,
    scale,
  }
}

function resolveOutputMimeType(fileType: string) {
  const normalized = fileType.trim().toLowerCase()

  if (normalized === "image/png") {
    return "image/png"
  }

  if (normalized === "image/jpg" || normalized === "image/jpeg") {
    return "image/jpeg"
  }

  if (normalized === "image/webp") {
    return "image/webp"
  }

  return "image/png"
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg"
  }

  if (mimeType === "image/webp") {
    return "webp"
  }

  return "png"
}

function validateImagePreview(
  file: File,
): Promise<{ ok: boolean; previewUrl?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      resolve({
        ok: true,
        previewUrl: objectUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ ok: false })
    }

    image.src = objectUrl
  })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Unable to load image for cropping."))
    image.src = url
  })
}

async function createCroppedImageFile(draft: CropDraft): Promise<File> {
  const image = await loadImage(draft.objectUrl)
  const metrics = buildCropMetrics(draft)
  const sourceX = clamp((-metrics.imageLeft) / metrics.scale, 0, image.naturalWidth)
  const sourceY = clamp((-metrics.imageTop) / metrics.scale, 0, image.naturalHeight)
  const sourceSize = CROP_FRAME_SIZE / metrics.scale
  const safeSourceSize = Math.min(
    sourceSize,
    image.naturalWidth - sourceX,
    image.naturalHeight - sourceY,
  )

  if (safeSourceSize <= 0) {
    throw new Error("Unable to crop image with the selected area.")
  }

  const canvas = document.createElement("canvas")
  canvas.width = CROPPED_OUTPUT_SIZE
  canvas.height = CROPPED_OUTPUT_SIZE
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Unable to initialize image cropper.")
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    safeSourceSize,
    safeSourceSize,
    0,
    0,
    CROPPED_OUTPUT_SIZE,
    CROPPED_OUTPUT_SIZE,
  )

  const preferredType = resolveOutputMimeType(draft.file.type)
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, preferredType, 0.92),
  )

  if (!blob && preferredType !== "image/png") {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  }

  if (!blob) {
    throw new Error("Unable to generate cropped image.")
  }

  const outputType = blob.type || preferredType
  const baseFilename = draft.file.name.replace(/\.[^/.]+$/, "")
  const outputExtension = extensionFromMimeType(outputType)
  const outputFilename = `${baseFilename}-avatar.${outputExtension}`

  return new File([blob], outputFilename, {
    type: outputType,
    lastModified: Date.now(),
  })
}

export function ProfileSettingsPanel({
  title = "Settings",
  subtitle = "Manage your account details and profile picture.",
  widerLayout = false,
}: ProfileSettingsPanelProps) {
  const queryClient = useQueryClient()
  const { data: currentUser, isLoading, isError, refetch } = useCurrentUser()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [draftName, setDraftName] = useState<string | null>(null)
  const [draftEmail, setDraftEmail] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null)
  const [isApplyingCrop, setIsApplyingCrop] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (cropDraft?.objectUrl) {
        URL.revokeObjectURL(cropDraft.objectUrl)
      }
    }
  }, [cropDraft])

  const isAdmin = currentUser?.role === "SUPER_ADMIN"
  const cropMetrics = useMemo(() => {
    if (!cropDraft) {
      return null
    }

    return buildCropMetrics(cropDraft)
  }, [cropDraft])

  const profileForm = useMemo(() => {
    const baseForm = currentUser ? mapUserToProfileForm(currentUser) : { name: "", email: "" }

    return {
      name: draftName ?? baseForm.name,
      email: draftEmail ?? baseForm.email,
    }
  }, [currentUser, draftEmail, draftName])

  const hasProfileChanges = useMemo(() => {
    const normalizedCurrent = normalizeProfileValues(currentUser, profileForm)
    const normalizedInitial = normalizeProfileValues(
      currentUser,
      currentUser ? mapUserToProfileForm(currentUser) : { name: "", email: "" },
    )

    if (!normalizedCurrent || !normalizedInitial) {
      return false
    }

    return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitial)
  }, [currentUser, profileForm])

  const profileMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<CurrentUser>(["auth", "me"], updatedProfile)
      setDraftName(null)
      setDraftEmail(null)
      setProfileError(null)
      notifySuccess("Profile updated successfully.")
    },
    onError: (error) => {
      setProfileError(error instanceof Error ? error.message : "Unable to update profile")
    },
  })

  const uploadMutation = useMutation({
    mutationFn: uploadMyProfileImage,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<CurrentUser>(["auth", "me"], updatedProfile)
      setUploadError(null)
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      notifySuccess("Profile picture updated.")
    },
    onError: (error) => {
      setUploadError(
        error instanceof Error ? error.message : "Unable to upload profile picture",
      )
    },
  })

  const handleClearImageSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(null)
    setSelectedFile(null)
    setUploadError(null)
  }

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileError(null)

    if (!currentUser) {
      return
    }

    const name = profileForm.name.trim()
    const email = profileForm.email.trim().toLowerCase()

    if (name.length < 2) {
      setProfileError("Name must be at least 2 characters.")
      return
    }

    if (isAdmin && !isValidEmail(email)) {
      setProfileError("Please enter a valid email address.")
      return
    }

    try {
      await profileMutation.mutateAsync({
        name,
        email: isAdmin ? email : undefined,
      })
    } catch {
      // Error handling is managed in mutation callbacks.
    }
  }

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    setUploadError(null)

    if (!file) {
      return
    }

    const normalizedType = file.type.trim().toLowerCase()

    if (!ALLOWED_IMAGE_TYPES.has(normalizedType)) {
      setUploadError("Only PNG, JPG, JPEG, and WEBP images are supported.")
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setUploadError("Image file must be 2MB or smaller.")
      return
    }

    const previewValidation = await validateImagePreview(file)

    if (
      !previewValidation.ok ||
      !previewValidation.previewUrl ||
      !previewValidation.width ||
      !previewValidation.height
    ) {
      setUploadError("Selected file appears to be corrupted. Please choose another image.")
      return
    }

    setCropDraft({
      file,
      objectUrl: previewValidation.previewUrl,
      imageWidth: previewValidation.width,
      imageHeight: previewValidation.height,
      zoom: 1,
      offsetXPercent: 0,
      offsetYPercent: 0,
    })
  }

  const handleApplyCrop = async () => {
    if (!cropDraft) {
      return
    }

    setIsApplyingCrop(true)
    setUploadError(null)

    try {
      const croppedFile = await createCroppedImageFile(cropDraft)

      if (croppedFile.size > MAX_PROFILE_IMAGE_BYTES) {
        setUploadError("Cropped image must be 2MB or smaller.")
        return
      }

      const previewValidation = await validateImagePreview(croppedFile)

      if (!previewValidation.ok || !previewValidation.previewUrl) {
        setUploadError("Unable to process cropped image. Please try another image.")
        return
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setSelectedFile(croppedFile)
      setPreviewUrl(previewValidation.previewUrl)
      setCropDraft(null)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to crop selected image.")
    } finally {
      setIsApplyingCrop(false)
    }
  }

  const handleUploadProfileImage = async () => {
    setUploadError(null)

    if (!selectedFile) {
      return
    }

    try {
      await uploadMutation.mutateAsync(selectedFile)
    } catch {
      // Error handling is managed in mutation callbacks.
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (isError || !currentUser) {
    return (
      <Card className="border-rose-200">
        <CardHeader>
          <CardTitle className="text-rose-700">Unable to load settings</CardTitle>
          <CardDescription>There was a problem fetching your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 md:text-base">{subtitle}</p>
      </section>

      <section
        className={
          widerLayout
            ? "grid gap-4 xl:grid-cols-[minmax(0,2.5fr)_minmax(360px,1.2fr)]"
            : "grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        }
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSaveProfile}>
              <div className="space-y-1">
                <label htmlFor="settings-name" className="text-sm font-medium text-slate-700">
                  Name
                </label>
                <Input
                  id="settings-name"
                  value={profileForm.name}
                  onChange={(event) => setDraftName(event.target.value)}
                  required
                  minLength={2}
                />
              </div>

              {isAdmin ? (
                <div className="space-y-1">
                  <label htmlFor="settings-email" className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setDraftEmail(event.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label htmlFor="settings-email" className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <Input id="settings-email" type="email" value={currentUser.email ?? "-"} disabled />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="settings-employee-id" className="text-sm font-medium text-slate-700">
                      Employee ID
                    </label>
                    <Input id="settings-employee-id" value={currentUser.employeeId ?? "-"} disabled />
                  </div>
                </>
              )}

              {profileError && (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {profileError}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!hasProfileChanges || profileMutation.isPending}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SaveIcon className="size-4" />
                  {profileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a new avatar image for your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <UserAvatar
                name={currentUser.name}
                profileImagePath={currentUser.profileImagePath}
                imageSrc={previewUrl}
                className="size-16 text-xl"
                loading="eager"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {previewUrl ? "Preview ready" : "Current profile picture"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {selectedFile
                    ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`
                    : "PNG, JPG, JPEG, WEBP up to 2MB"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Upload Image</label>
              <input
                ref={fileInputRef}
                id="profile-image-upload"
                type="file"
                className="sr-only"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={(event) => void handleFileSelection(event)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadMutation.isPending || isApplyingCrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="size-4" />
                Browse Image
              </Button>
              <p className="text-xs text-slate-500">PNG, JPG, JPEG, WEBP up to 2MB</p>
            </div>

            {uploadError && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {uploadError}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={(!selectedFile && !previewUrl) || uploadMutation.isPending || isApplyingCrop}
                onClick={handleClearImageSelection}
              >
                Clear
              </Button>
              <Button
                type="button"
                disabled={!selectedFile || uploadMutation.isPending || isApplyingCrop}
                className="disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleUploadProfileImage()}
              >
                <ImageUpIcon className="size-4" />
                {uploadMutation.isPending ? "Uploading..." : "Save Picture"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={Boolean(cropDraft)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isApplyingCrop) {
            setCropDraft(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust zoom and position so your avatar fits the square frame.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
            <div className="mx-auto">
              <div
                className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-100"
                style={{ width: `${CROP_FRAME_SIZE}px`, height: `${CROP_FRAME_SIZE}px` }}
              >
                {cropDraft && cropMetrics ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cropDraft.objectUrl}
                      alt="Crop preview"
                      className="absolute max-w-none select-none"
                      style={{
                        width: `${cropMetrics.displayedWidth}px`,
                        height: `${cropMetrics.displayedHeight}px`,
                        left: `${cropMetrics.imageLeft}px`,
                        top: `${cropMetrics.imageTop}px`,
                      }}
                      draggable={false}
                    />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-white/80" />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                    Preparing crop preview...
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ZoomInIcon className="size-4" />
                  Zoom
                </label>
                <input
                  type="range"
                  min={MIN_CROP_ZOOM}
                  max={MAX_CROP_ZOOM}
                  step={0.01}
                  value={cropDraft?.zoom ?? MIN_CROP_ZOOM}
                  onChange={(event) => {
                    const value = Number(event.target.value)

                    setCropDraft((current) => {
                      if (!current) {
                        return current
                      }

                      return {
                        ...current,
                        zoom: clamp(value, MIN_CROP_ZOOM, MAX_CROP_ZOOM),
                      }
                    })
                  }}
                  className="w-full accent-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Horizontal Position</label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={cropDraft?.offsetXPercent ?? 0}
                  disabled={!cropMetrics || cropMetrics.maxOffsetX === 0}
                  onChange={(event) => {
                    const value = Number(event.target.value)

                    setCropDraft((current) => {
                      if (!current) {
                        return current
                      }

                      return {
                        ...current,
                        offsetXPercent: clamp(value, -100, 100),
                      }
                    })
                  }}
                  className="w-full accent-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Vertical Position</label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={cropDraft?.offsetYPercent ?? 0}
                  disabled={!cropMetrics || cropMetrics.maxOffsetY === 0}
                  onChange={(event) => {
                    const value = Number(event.target.value)

                    setCropDraft((current) => {
                      if (!current) {
                        return current
                      }

                      return {
                        ...current,
                        offsetYPercent: clamp(value, -100, 100),
                      }
                    })
                  }}
                  className="w-full accent-slate-900"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isApplyingCrop}
              onClick={() => setCropDraft(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!cropDraft || isApplyingCrop}
              onClick={() => void handleApplyCrop()}
            >
              <CropIcon className="size-4" />
              {isApplyingCrop ? "Applying..." : "Apply Crop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
