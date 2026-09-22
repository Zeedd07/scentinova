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
import { useLenis } from '../components/SmoothScroll'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const isMobile = useIsMobile()
  const lenis = useLenis()
  const { getFrame, progress, priorityReady, fullyLoaded } = useFrameSequence({
    enabled: true,
    // Mobile: every 2nd frame, but more priority frames so scrub past the start isn't empty
    priorityCount: isMobile ? 64 : 72,
    batchSize: isMobile ? 6 : 8,
    preferSharp: !isMobile,
    frameStep: isMobile ? 2 : 1,
    yieldMs: isMobile ? 8 : 0,
  })

  const appReady = priorityReady
  const [loaderVisible, setLoaderVisible] = useState(true)

  useEffect(() => {
    document.body.style.overflow = loaderVisible ? 'hidden' : ''
    document.documentElement.style.overflow = loaderVisible ? 'hidden' : ''
    if (lenis) {
      if (loaderVisible) lenis.stop()
      else lenis.start()
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
  }, [loaderVisible, lenis])

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
