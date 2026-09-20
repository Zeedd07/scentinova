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
    // Load enough frames before unlock so early scrub never looks soft/missing
    priorityCount: isMobile ? 48 : 72,
    batchSize: isMobile ? 10 : 20,
    preferSharp: !isMobile,
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
