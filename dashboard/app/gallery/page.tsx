import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { PROJECT_ROOT } from '@/lib/paths'
import GalleryClient from '@/components/GalleryClient'

interface ImageMeta {
  scene_id: string
  chapter_file: string
  characters: string[]
  emotion: string
  location: string
  positive_prompt: string
  generated_at: string
}

function getImages(): { file: string; meta: ImageMeta | null }[] {
  const imagesDir = join(PROJECT_ROOT, 'assets', 'images')
  if (!existsSync(imagesDir)) return []
  return readdirSync(imagesDir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map(f => {
      const metaPath = join(imagesDir, f.replace(/\.(png|jpg|jpeg|webp)$/i, '.json'))
      let meta: ImageMeta | null = null
      if (existsSync(metaPath)) {
        try { meta = JSON.parse(readFileSync(metaPath, 'utf-8')) } catch { /* ignore */ }
      }
      return { file: f, meta }
    })
}

export default function GalleryPage() {
  const images = getImages()
  return <GalleryClient initialImages={images} />
}
