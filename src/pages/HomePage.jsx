/**
 * SCENTINOVA homepage — Hero · Signature Collection · Fragrance Journey · Final CTA
 */
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Loader from '../components/Loader'
import Hero from '../components/Hero'
import SignatureCollection from '../components/SignatureCollection'
import FragranceJourney from '../components/FragranceJourney'
import FinalCTA from '../components/FinalCTA'
import { useFrameSequence } from '../hooks/useFrameSequence'
import { useIsMobile } from '../hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const isMobile = useIsMobile()
  const { getFrame, progress, priorityReady, fullyLoaded } = useFrameSequence({
    enabled: true,
    // Mobile: fewer priority frames + longer yields so scrub stays near 60fps while loading
    priorityCount: isMobile ? 32 : 72,
    batchSize: isMobile ? 6 : 20,
    preferSharp: !isMobile,
    yieldMs: isMobile ? 24 : 0,
  })

  const appReady = priorityReady
  const [loaderVisible, setLoaderVisible] = useState(true)

  useEffect(() => {
    document.body.style.overflow = loaderVisible ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [loaderVisible])

  useEffect(() => {
    if (!appReady) return undefined
    const t = setTimeout(() => setLoaderVisible(false), 700)
    return () => clearTimeout(t)
  }, [appReady])

  useEffect(() => {
    if (loaderVisible) return undefined
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [loaderVisible, fullyLoaded])

  return (
    <>
      <Loader
        progress={progress}
        priorityReady={appReady}
        visible={loaderVisible}
      />
      <div className="bg-ivory">
        <Hero
          getFrame={getFrame}
          priorityReady={appReady}
          isMobile={isMobile}
        />
        <SignatureCollection />
        <FragranceJourney />
        <FinalCTA />
      </div>
    </>
  )
}
