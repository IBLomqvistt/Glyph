import { BrainCircuit, Cloud, Cpu, PanelsTopLeft, Zap } from 'lucide-react'
import type { LayerSlug } from '@/lib/layers'

export function LayerIcon({
  layer,
  size = 22,
}: {
  layer: LayerSlug
  size?: number
}): React.JSX.Element {
  const props = { 'aria-hidden': true, size, strokeWidth: 1.65 } as const
  if (layer === 'energy') return <Zap {...props} />
  if (layer === 'chips-compute') return <Cpu {...props} />
  if (layer === 'cloud-infrastructure') return <Cloud {...props} />
  if (layer === 'models') return <BrainCircuit {...props} />
  return <PanelsTopLeft {...props} />
}
