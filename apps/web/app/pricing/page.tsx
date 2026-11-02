import { LandingFooter } from "@/components/landing/footer";
import { LandingNavigation } from "@/components/landing/navigation";
import { Pricing } from "@/components/landing/pricing";

export default function PricingPage() {
  return (
    <main className="landing-page min-h-screen bg-[#e9e7df] text-[#20201e]">
      <div className="border-b border-[#242421] bg-[#f4cf4b]"><LandingNavigation /></div>
      <Pricing standalone />
      <LandingFooter />
    </main>
  );
}
