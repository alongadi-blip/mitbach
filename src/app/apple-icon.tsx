import { ImageResponse } from 'next/og'

import { PotMark } from '@/lib/icon-mark'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * iOS ignores the manifest icons for home-screen shortcuts and wants an
 * apple-touch-icon instead. Without this it screenshots the page.
 */
export default function AppleIcon() {
  return new ImageResponse(<PotMark scale={180 / 512} />, size)
}
