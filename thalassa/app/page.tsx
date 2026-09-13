import ScrollHero from './components/ScrollHero'
import ExperienceSection from './components/ExperienceSection'
import MenuSection from './components/MenuSection'
import StorySection from './components/StorySection'
import ClosingCTA from './components/ClosingCTA'

export default function Page() {
  return (
    <main style={{ background: '#F4EFE7' }}>
      <ScrollHero />
      <ExperienceSection />
      <MenuSection />
      <StorySection />
      <ClosingCTA />
    </main>
  )
}
