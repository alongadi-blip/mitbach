/**
 * The brand mark, as plain elements so the image renderer needs no font file.
 *
 * A place setting: plate in the middle, fork and knife laid beside it.
 * Shared by app/icon.tsx and app/apple-icon.tsx, which differ only in size.
 * `scale` keeps the proportions when the canvas changes.
 *
 * The whole setting stays inside the maskable safe zone (the middle 80% of the
 * canvas), so Android may crop it to any shape without cutting off cutlery.
 */
export function PlateMark({ scale = 1 }: { scale?: number }) {
  const px = (value: number) => Math.round(value * scale)

  // The cream from globals.css, as sRGB. Everything in the mark is this colour.
  const cream = '#fdf9f3'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: px(20),
        // The paprika primary from globals.css, as sRGB.
        background: '#c1440e',
      }}
    >
      {/* fork */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* tines */}
        <div style={{ display: 'flex', gap: px(7) }}>
          {[0, 1, 2].map((tine) => (
            <div
              key={tine}
              style={{
                width: px(9),
                height: px(60),
                borderTopLeftRadius: px(5),
                borderTopRightRadius: px(5),
                background: cream,
              }}
            />
          ))}
        </div>
        {/* neck, joining the tines to the handle */}
        <div
          style={{
            width: px(41),
            height: px(18),
            borderBottomLeftRadius: px(10),
            borderBottomRightRadius: px(10),
            background: cream,
          }}
        />
        {/* handle */}
        <div
          style={{
            width: px(13),
            height: px(146),
            borderBottomLeftRadius: px(7),
            borderBottomRightRadius: px(7),
            background: cream,
          }}
        />
      </div>

      {/* plate */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: px(212),
          height: px(212),
          borderRadius: px(106),
          background: cream,
        }}
      >
        {/* the rim, drawn as a ring so the plate reads as a plate at 32px */}
        <div
          style={{
            width: px(136),
            height: px(136),
            borderRadius: px(68),
            border: `${px(9)}px solid rgba(193, 68, 14, 0.24)`,
          }}
        />
      </div>

      {/* knife */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* blade */}
        <div
          style={{
            width: px(30),
            height: px(118),
            borderTopLeftRadius: px(15),
            borderTopRightRadius: px(15),
            borderBottomRightRadius: px(14),
            borderBottomLeftRadius: px(3),
            background: cream,
          }}
        />
        {/* handle */}
        <div
          style={{
            width: px(15),
            height: px(106),
            borderBottomLeftRadius: px(8),
            borderBottomRightRadius: px(8),
            background: cream,
          }}
        />
      </div>
    </div>
  )
}
