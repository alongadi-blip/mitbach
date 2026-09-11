/**
 * The brand mark, as plain elements so the image renderer needs no font file.
 *
 * Shared by app/icon.tsx and app/apple-icon.tsx, which differ only in size.
 * `scale` keeps the proportions when the canvas changes.
 */
export function PotMark({ scale = 1 }: { scale?: number }) {
  const px = (value: number) => Math.round(value * scale)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // The paprika primary from globals.css, as sRGB.
        background: '#c1440e',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: px(18),
        }}
      >
        {/* lid */}
        <div
          style={{
            width: px(250),
            height: px(34),
            borderRadius: px(17),
            background: '#fdf9f3',
          }}
        />
        {/* pot */}
        <div
          style={{
            width: px(214),
            height: px(150),
            borderBottomLeftRadius: px(46),
            borderBottomRightRadius: px(46),
            borderTopLeftRadius: px(12),
            borderTopRightRadius: px(12),
            background: '#fdf9f3',
          }}
        />
      </div>
    </div>
  )
}
