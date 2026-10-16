import { FinalCta } from '@/components/landing/FinalCta';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Nav } from '@/components/landing/Nav';

export default function Home() {
  return (
    <main className="bg-bg min-h-screen">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  );
}
