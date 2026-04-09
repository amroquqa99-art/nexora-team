import Navbar from "@/components/shared/Navbar";
import HeroSection from "@/features/marketing/components/HeroSection";
import PortfolioSection from "@/features/marketing/components/PortfolioSection";
import AboutSection from "@/features/marketing/components/AboutSection";
import TeamSection from "@/features/marketing/components/TeamSection";
import ContactCTA from "@/features/marketing/components/ContactCTA";
import Footer from "@/components/shared/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { teamVisible, joinTeamVisible } = useSiteSettings();

  return (
    <div className="min-h-screen bg-transparent relative selection:bg-orange-500/30">
      <Navbar teamVisible={teamVisible} joinVisible={joinTeamVisible} />

      <main className="relative z-10 w-full overflow-x-hidden">
        <HeroSection />
        <AboutSection />
        <PortfolioSection />
        <TeamSection teamVisible={teamVisible} joinVisible={joinTeamVisible} />
        <ContactCTA />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
