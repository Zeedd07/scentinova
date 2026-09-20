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
    // Slightly leaner priority gate on phones so scrub can start sooner
    priorityCount: isMobile ? 36 : 48,
    batchSize: isMobile ? 12 : 16,
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
