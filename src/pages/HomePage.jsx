/**
 * SCENTINOVA homepage: Hero, Signature Collection, Fragrance Journey, Final CTA
 */
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from '../components/Hero'
import SignatureCollection from '../components/SignatureCollection'
import FragranceJourney from '../components/FragranceJourney'
import FinalCTA from '../components/FinalCTA'
import { FRAME_SOURCES, useFrameSequence } from '../hooks/useFrameSequence'
import { useIsMobile } from '../hooks/useIsMobile'
import { useIsPortrait } from '../hooks/useIsPortrait'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()
  const source = isPortrait ? FRAME_SOURCES.portrait : FRAME_SOURCES.landscape
  const { getFrame, getExactFrame, priorityReady, fullyLoaded, total } = useFrameSequence({
    source,
    priorityCount: 60,
    batchSize: 12,
  })

  useEffect(() => {
    if (!priorityReady && !fullyLoaded) return undefined
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [priorityReady, fullyLoaded])

  return (
    <div className="bg-ivory">
      <Hero
        getFrame={getFrame}
        getExactFrame={getExactFrame}
        priorityReady={priorityReady}
        totalFrames={total}
        isMobile={isMobile}
      />
      <SignatureCollection />
      <FragranceJourney />
      <FinalCTA />
    </div>
  )
}
