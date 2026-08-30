import { CallToAction } from "@/components/landing/call-to-action";
import { CandidateExperience } from "@/components/landing/candidate-experience";
import { CompaniesSection } from "@/components/landing/companies-section";
import { FeedbackSection } from "@/components/landing/feedback-section";
import { LandingFooter } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductShowcase } from "@/components/landing/product-showcase";

export default function Home() {
  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#e9e7df] text-[#20201e]">
      <Hero />
      <CandidateExperience />
      <ProductShowcase />
      <HowItWorks />
      <FeedbackSection />
      <CompaniesSection />
      <CallToAction />
      <LandingFooter />
    </main>
  );
}
