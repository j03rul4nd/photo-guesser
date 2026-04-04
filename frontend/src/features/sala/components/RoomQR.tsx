import { PolaroidFrame } from '@/components/shared/PolaroidFrame'
import { getSalaUrl } from '@/lib/share'

interface RoomQRProps {
  codigo: string
}

/**
 * RoomQR — QR del link de sala dentro de un PolaroidFrame.
 * Genera el QR via api.qrserver.com (gratis, sin API key).
 */
export function RoomQR({ codigo }: RoomQRProps) {
  const url = getSalaUrl(codigo)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=FFFFFF&color=1A1714&margin=10`

  return (
    <PolaroidFrame caption={codigo} style={{ width: '180px' }}>
      <img
        src={qrSrc}
        alt={`Código QR para unirse a la sala ${codigo}`}
        width={156}
        height={156}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </PolaroidFrame>
  )
}
