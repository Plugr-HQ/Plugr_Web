import { Navbar } from '@/src/components/Navbar'
import { Hero } from '@/src/components/Hero'
import { TrustBar } from '@/src/components/TrustBar'
import { HowItWorks } from '@/src/components/HowItWorks'
import { FeaturedPlugs } from '@/src/components/FeaturedPlugs'
import { ArtisanSection } from '@/src/components/ArtisanSection'
import { Footer } from '@/src/components/Footer'

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-bone">
      <Navbar />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <FeaturedPlugs />
      <ArtisanSection />
      <Footer />
    </main>
  );
}
