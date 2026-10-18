/**
 * Optional photos and videos for one bottle size. Empty means the shop shows the main bottle.
 */
import { useState } from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import AdminModal from './AdminModal'
import FileButton from './ui/FileButton'
import { uploadAdminImage, uploadAdminVideo } from '../../services/uploadApi'
import { ApiClientError } from '../../services/apiClient'
import {
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  IMAGE_SCALE_STEP,
  clampImageScale,
  imageScaleStyle,
} from '../../lib/imageScale'

const MAX_VIDEOS = 6
const MAX_VIDEO_MB = 100
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return ''
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function emptySizeMedia() {
  return { gallery: [], galleryPublicIds: [], galleryScales: [], videos: [] }
}

export default function SizeMediaEditor({ label, slug, media, onChange }) {
  const gallery = media.gallery || []
  const galleryPublicIds = media.galleryPublicIds || []
  const galleryScales = media.galleryScales || []
  const videos = media.videos || []
  const [imageProgress, setImageProgress] = useState(null)
  const [videoProgress, setVideoProgress] = useState(null)
  const [error, setError] = useState('')
  const [pendingRemove, setPendingRemove] = useState(null)

  const patch = (next) => onChange({ gallery, galleryPublicIds, galleryScales, videos, ...next })

  const onImages = async (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setError('')
    setImageProgress(0)
    try {
      const uploaded = []
      for (let i = 0; i < files.length; i++) {
        const asset = await uploadAdminImage(files[i], {
          slug,
          role: 'gallery',
          onProgress: (pct) => setImageProgress(Math.round(((i + pct / 100) / files.length) * 100)),
        })
        uploaded.push({
          url: asset.url || asset.delivery_url || asset.secure_url,
          publicId: asset.public_id || '',
        })
      }
      patch({
        gallery: [...gallery, ...uploaded.map((u) => u.url)],
        galleryPublicIds: [...galleryPublicIds, ...uploaded.map((u) => u.publicId)],
        galleryScales: [...galleryScales, ...uploaded.map(() => 1)],
      })
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Upload failed. Please try again.')
    } finally {
      setImageProgress(null)
    }
  }

  const onVideos = async (e) => {
    const picked = [...(e.target.files || [])]
    e.target.value = ''
    if (!picked.length) return
    setError('')
    const room = MAX_VIDEOS - videos.length
    if (room <= 0) {
      setError(`Up to ${MAX_VIDEOS} videos for this size.`)
      return
    }
    const bad = picked.find((f) => !VIDEO_TYPES.includes(f.type) || f.size > MAX_VIDEO_MB * 1024 * 1024)
    if (bad) {
      setError(
        VIDEO_TYPES.includes(bad.type)
          ? `“${bad.name}” is larger than ${MAX_VIDEO_MB} MB.`
          : `“${bad.name}” is not an MP4, MOV or WebM video.`,
      )
      return
    }
    const files = picked.slice(0, room)
    setVideoProgress(0)
    try {
      const added = []
      for (let i = 0; i < files.length; i++) {
        added.push(
          await uploadAdminVideo(files[i], {
            slug,
            onProgress: (pct) => setVideoProgress(Math.round(((i + pct / 100) / files.length) * 100)),
          }),
        )
      }
      patch({ videos: [...videos, ...added] })
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Video upload failed. Please try again.')
    } finally {
      setVideoProgress(null)
    }
  }

  const moveImage = (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= gallery.length) return
    const swap = (list) => {
      const copy = [...list]
      ;[copy[index], copy[next]] = [copy[next], copy[index]]
      return copy
    }
    patch({
      gallery: swap(gallery),
      galleryPublicIds: swap(galleryPublicIds),
      galleryScales: swap(galleryScales),
    })
  }

  const moveVideo = (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= videos.length) return
    const copy = [...videos]
    ;[copy[index], copy[next]] = [copy[next], copy[index]]
    patch({ videos: copy })
  }

  return (
    <div className="mt-3 space-y-3 border border-dashed border-[#e0d6c4] p-3">
      <div>
        <p className="text-[12px] font-medium text-[#4a4136]">Photos and videos for {label}</p>
        <p className="mt-1 text-[12px] admin-muted">
          Optional. Leave this empty and shoppers see the main bottle photos and videos.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FileButton
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={imageProgress != null}
          onChange={onImages}
        >
          {imageProgress != null ? `Uploading ${imageProgress}%` : 'Add images'}
        </FileButton>
        <FileButton
          accept="video/mp4,video/quicktime,video/webm"
          multiple
          disabled={videoProgress != null || videos.length >= MAX_VIDEOS}
          onChange={onVideos}
        >
          {videoProgress != null ? `Uploading ${videoProgress}%` : 'Add videos'}
        </FileButton>
        <span className="text-[12px] admin-muted">
          {gallery.length} {gallery.length === 1 ? 'image' : 'images'} · {videos.length}/{MAX_VIDEOS} videos
        </span>
      </div>

      {gallery.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {gallery.map((url, index) => {
            const scale = clampImageScale(galleryScales[index] ?? 1)
            return (
              <li key={`${url}-${index}`} className="border border-[#e0d6c4] bg-[#fffcf7] p-3">
                <div className="flex h-32 items-center justify-center overflow-hidden bg-[#f3eee4]">
                  <img
                    src={url}
                    alt={`${label} image ${index + 1}`}
                    className="max-h-full max-w-full object-contain"
                    style={imageScaleStyle(scale)}
                  />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon"
                    className="size-8"
                    disabled={scale <= IMAGE_SCALE_MIN}
                    aria-label={`Make ${label} image ${index + 1} smaller`}
                    onClick={() => {
                      const next = [...galleryScales]
                      next[index] = clampImageScale(scale - IMAGE_SCALE_STEP)
                      patch({ galleryScales: next })
                    }}
                  >
                    <MinusIcon />
                  </Button>
                  <Slider
                    min={IMAGE_SCALE_MIN}
                    max={IMAGE_SCALE_MAX}
                    step={IMAGE_SCALE_STEP}
                    value={[scale]}
                    onValueChange={([next]) => {
                      const scales = [...galleryScales]
                      scales[index] = clampImageScale(next)
                      patch({ galleryScales: scales })
                    }}
                    aria-label={`Size of ${label} image ${index + 1} on the website`}
                  />
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon"
                    className="size-8"
                    disabled={scale >= IMAGE_SCALE_MAX}
                    aria-label={`Make ${label} image ${index + 1} bigger`}
                    onClick={() => {
                      const next = [...galleryScales]
                      next[index] = clampImageScale(scale + IMAGE_SCALE_STEP)
                      patch({ galleryScales: next })
                    }}
                  >
                    <PlusIcon />
                  </Button>
                  <span className="w-10 text-right text-[12px] tabular-nums">{Math.round(scale * 100)}%</span>
                </div>
                <div className="mt-2 flex gap-3">
                  <Button type="button" variant="link" className="text-[12px]" disabled={index === 0} onClick={() => moveImage(index, -1)}>
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="text-[12px]"
                    disabled={index === gallery.length - 1}
                    onClick={() => moveImage(index, 1)}
                  >
                    →
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="ml-auto text-[12px] text-destructive"
                    onClick={() => setPendingRemove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {videos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {videos.map((video, index) => (
            <li key={video.publicId || index} className="border border-[#e0d6c4] bg-[#fffcf7] p-3">
              <div className="flex h-32 items-center justify-center overflow-hidden bg-[#f3eee4]">
                <video
                  src={video.url}
                  poster={video.posterUrl || undefined}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  className="max-h-full max-w-full"
                  aria-label={`${label} video ${index + 1}`}
                />
              </div>
              <p className="mt-2 truncate text-[11px] admin-muted">
                {video.publicId}
                {video.duration ? ` · ${formatDuration(video.duration)}` : ''}
              </p>
              <div className="mt-2 flex gap-3">
                <Button type="button" variant="link" className="text-[12px]" disabled={index === 0} onClick={() => moveVideo(index, -1)}>
                  ←
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-[12px]"
                  disabled={index === videos.length - 1}
                  onClick={() => moveVideo(index, 1)}
                >
                  →
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="ml-auto text-[12px] text-destructive"
                  onClick={() => patch({ videos: videos.filter((_, i) => i !== index) })}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-[12px] text-[#6e1118]">{error}</p>}

      <AdminModal
        open={pendingRemove != null}
        tone="danger"
        title={`Remove this ${label} image?`}
        message={
          gallery.length === 1
            ? `Shoppers will see the main bottle photos for ${label} once you save.`
            : `It will be taken off the ${label} photos when you save.`
        }
        confirmLabel="Remove image"
        cancelLabel="Keep image"
        onConfirm={() => {
          const index = pendingRemove
          setPendingRemove(null)
          if (index == null) return
          patch({
            gallery: gallery.filter((_, i) => i !== index),
            galleryPublicIds: galleryPublicIds.filter((_, i) => i !== index),
            galleryScales: galleryScales.filter((_, i) => i !== index),
          })
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}
