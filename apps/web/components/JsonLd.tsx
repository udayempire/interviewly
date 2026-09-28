export function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Interviewlyy",
    url: "https://interviewlyy.xyz",
    description:
      "AI-powered voice interview platform for candidates and hiring teams. Practice personalized interviews from your resume and GitHub, or screen candidates with structured AI conversations and detailed interview reports.",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Recruitment & Interview Preparation",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI-powered voice interviews",
      "Resume & GitHub-based personalized questions",
      "Candidate screening and assessment",
      "Structured interview reports for hiring teams",
      "Technical and behavioral interview practice",
    ],
    audience: {
      "@type": "Audience",
      audienceType:
        "Job seekers, candidates, hiring managers, recruiters, HR teams",
    },
    creator: {
      "@type": "Organization",
      name: "Interviewlyy",
      url: "https://interviewlyy.xyz",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

