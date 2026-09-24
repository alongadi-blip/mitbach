import { ImageResponse } from 'next/og'

import { PlateMark } from '@/lib/icon-mark'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

/** Generated at build time; referenced from app/manifest.ts. */
export default function Icon() {
  return new ImageResponse(<PlateMark />, size)
}
