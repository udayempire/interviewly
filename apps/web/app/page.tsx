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
    <>
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

      {/*
        Temporary standalone launch screen, retained for later if needed.
        <main className="landing-page relative grid min-h-screen place-items-center overflow-hidden bg-[#e9e7df] px-5 py-10 text-[#20201e] sm:px-8">
          <div className="landing-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="pointer-events-none absolute -left-24 top-[12%] h-64 w-64 rounded-full border border-[#b5a24c]" />
          <div className="pointer-events-none absolute -right-20 bottom-[8%] h-80 w-80 rounded-full border border-[#b5a24c]" />

          <section className="relative w-full max-w-4xl border border-[#252522] bg-[#f4cf4b] p-6 shadow-[10px_10px_0_#20201e] sm:p-10 md:p-14">
            <div className="landing-grid pointer-events-none absolute inset-0 opacity-[0.15]" />
            <div className="relative flex items-center justify-between border-b border-[#8c792d] pb-6">
              <div className="flex items-center gap-2.5 font-bold tracking-[-0.06em]">
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] text-[13px] leading-none">i.</span>
                <span className="text-xl">interviewlyy</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#62552b]">Launching soon</p>
            </div>
            <div className="relative py-16 sm:py-24">
              <p className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#62552b]"><span className="h-1.5 w-1.5 rounded-full bg-[#20201e]" />Preparing the first conversation</p>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.88] tracking-[-0.08em] sm:text-7xl md:text-8xl">Your work deserves better questions.</h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed tracking-[-0.02em] text-[#4f472d] sm:text-xl">Interviewlyy is nearly ready: a voice interview experience that understands your background before it starts asking.</p>
            </div>
            <div className="relative flex flex-col gap-4 border-t border-[#8c792d] pt-6 text-sm sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-sm font-medium leading-relaxed text-[#5a4e2c]">Practice the conversation, not the script. We&apos;ll be opening the doors shortly.</p>
              <p className="-rotate-3 font-serif text-lg italic text-[#66562b]">worth the wait.</p>
            </div>
          </section>
        </main>
      */}
    </>
  );
}
