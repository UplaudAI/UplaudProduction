import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function FinanceLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const faqs = [
    {
      question: "What is Uplaud?",
      answer: "Uplaud is a specialized customer advocacy and growth platform for FinTech and financial services. We help B2B and B2C fintech platforms capture high-signal customer delight (demo bookings, reviews, testimonials) and transform them into automated, high-converting growth assets like personalized outreach campaigns and social content."
    },
    {
      question: "How is this different from Google or Trustpilot?",
      answer: "Generic review platforms are passive and often sit on third-party sites with no connection to your actual pipeline. Uplaud actively drives growth by converting reviews into targeted outreach campaigns, scroll-stopping social previews, and branded visual proof points, integrated directly into your marketing and sales stack."
    },
    {
      question: "Does this work for regulated industries?",
      answer: "Absolutely. FinTech operates under strict compliance. Uplaud is built with full moderation controls, allowing your legal or compliance team to approve every customer quote, testimonial, and visual campaign before it is ever published or used in outreach."
    },
    {
      question: "How do I get customers to actually leave reviews?",
      answer: "Uplaud automates review requests at the exact moments of highest customer delight (such as right after onboarding, or during successful ROI reviews). By providing a frictionless, single-click review and referral experience, we see up to a 3-4x increase in customer participation."
    },
    {
      question: "Do I need to run paid ads?",
      answer: "No, Uplaud is designed to leverage your existing customer base for organic, compounding word-of-mouth growth. However, if you do run paid ads, Uplaud makes them more efficient by providing real, compliance-approved customer proof to fuel your ad creatives, driving down CAC."
    },
    {
      question: "How soon do I see something?",
      answer: "You can set up your first customer voice capture campaigns in under 20 minutes, and typically see warm referred leads and compiled customer testimonials entering your pipeline within the first 7-14 days."
    },
    {
      question: "Who's behind Uplaud?",
      answer: "Uplaud is built by a team of experienced B2B SaaS and FinTech growth marketers who understand the critical role trust plays in financial decision-making and are dedicated to building modern growth flywheels."
    }
  ];

  return (
    <div className="App">
      <style>{`
        /* Custom styles for Finance Vertical Page */
        .mint-highlight {
          position: relative;
          display: inline-block;
        }
        .mint-highlight::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 4px;
          width: 100%;
          height: 12px;
          background-color: rgba(127, 234, 200, 0.4);
          z-index: -1;
          border-radius: 4px;
        }
        .mint-underline {
          position: relative;
        }
        .mint-underline::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 4px;
          background-color: #7FEAC8;
          border-radius: 2px;
        }
        /* Marquee styles */
        .marquee {
          overflow: hidden;
          position: relative;
          display: flex;
          gap: 1.5rem;
          user-select: none;
        }
        .marquee-content {
          display: flex;
          justify-content: space-around;
          min-width: 100%;
          gap: 1.5rem;
          animation: scroll 25s linear infinite;
        }
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        /* SVG diagram animations */
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          to { opacity: 1; transform: scale(1); }
        }
        .animate-circle {
          animation: dash 2.5s ease-out forwards;
        }
        .animate-node {
          animation: fadeIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Main Page HTML Restored */}
      <div className="landing-page bg-white relative">
<div className="fixed top-0 left-0 right-0 h-32 pointer-events-none z-40" style={{ background: "linear-gradient(rgba(67, 23, 113, 0.08) 0%, rgba(67, 23, 113, 0) 100%)" }}>
</div>
<header>
<nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white">
<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
<div className="flex items-center justify-between">
<div className="text-xl sm:text-2xl font-bold text-gray-900 flex-shrink-0">Uplaud</div>
<div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-mono">
<a href="#the-problem" className="text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap">The Problem</a>
<a href="#the-solution" className="text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap">The Solution</a>
<a href="#identifying-fit" className="text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap">Identifying Fit</a>
</div>
<div className="flex items-center gap-3">
<button className="sm:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors" aria-label="Toggle menu">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu" aria-hidden="true">
<path d="M4 12h16" />
<path d="M4 18h16" />
<path d="M4 6h16" />
</svg>
</button>
<button className="bg-[#4B2A85] text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full hover:bg-[#3d2269] transition-all hover:scale-[1.02] font-mono flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0 shadow-[0_4px_14px_0_rgba(75,42,133,0.39)]">
<span className="hidden sm:inline">Get Started</span>
<span className="sm:hidden">Get Started</span>
<span className="text-sm sm:text-base">↗</span>
</button>
</div>
</div>
<div className="hidden sm:flex lg:hidden items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs font-mono">
<a href="#the-problem" className="text-gray-700 hover:text-gray-900 transition-colors">Problem</a>
<span className="text-gray-300">·</span>
<a href="#the-solution" className="text-gray-700 hover:text-gray-900 transition-colors">Solution</a>
<span className="text-gray-300">·</span>
<a href="#identifying-fit" className="text-gray-700 hover:text-gray-900 transition-colors">Fit</a>
</div>
</div>
</nav>
</header>
<main>
<section className="pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 overflow-hidden">
<div className="max-w-7xl mx-auto">
<div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
<div className="flex-1 lg:flex-shrink-0 lg:w-1/2 text-left">
<div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6 md:mb-8">
<div className="w-2 h-2 bg-[#7FEAC8] rounded-full animate-pulse">
</div>
<span className="text-xs sm:text-sm text-gray-700">The trust powered growth engine for FinTech</span>
</div>
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 leading-tight">
<span className="mint-highlight">Nobody</span> moves their money because of an ad.</h1>
<p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed">FinTech platforms win customers through trusted recommendations, not cold advertising. Uplaud transforms customer trust into a measurable, scalable growth channel.</p>
<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
<button className="w-full sm:w-auto bg-[#4B2A85] text-white px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-[#3d2269] transition-all hover:scale-[1.02] font-mono flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(75,42,133,0.39)] text-sm sm:text-base">Get Started <span className="text-base sm:text-lg">↗</span>
</button>
<button className="w-full sm:w-auto border-2 border-gray-900 text-gray-900 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-gray-900 hover:text-white transition-all hover:scale-[1.02] font-mono flex items-center justify-center gap-2 shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] text-sm sm:text-base">Get a Demo <span className="text-base sm:text-lg">↗</span>
</button>
</div>
</div>
<div className="flex-1 lg:flex-shrink-0 lg:w-1/2 lg:min-w-0">
<div className="relative rounded-2xl lg:rounded-l-2xl lg:rounded-r-none overflow-hidden shadow-2xl aspect-video lg:w-[120%]">
<video className="w-full h-full object-cover" autoPlay={true} loop={true} playsInline={true} poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9'%3E%3Crect fill='%234B2A85' width='16' height='9'/%3E%3C/svg%3E">
<source src="https://customer-assets-lxgj4vgw.emergentagent.net/job_trust-into-channel/artifacts/6pauvhzx_finance-vertical-uplaud.mp4" type="video/mp4" />
</video>
</div>
</div>
</div>
</div>
</section>
<section className="px-4 sm:px-6 pb-8 sm:pb-12 md:pb-16 max-w-7xl mx-auto fade-in-section is-visible">
<div className="marquee py-3 sm:py-4 text-xs sm:text-sm font-mono text-gray-500 uppercase tracking-wider">
<div className="marquee-content">
<span>PAYMENTS</span>
<span>·</span>
<span>LENDING</span>
<span>·</span>
<span>ACCOUNTING</span>
<span>·</span>
<span>INSURANCE</span>
<span>·</span>
<span>FINTECH</span>
<span>·</span>
<span>PAYMENTS</span>
<span>·</span>
<span>LENDING</span>
<span>·</span>
<span>ACCOUNTING</span>
<span>·</span>
<span>INSURANCE</span>
<span>·</span>
<span>FINTECH</span>
</div>
<div className="marquee-content" aria-hidden="true">
<span>PAYMENTS</span>
<span>·</span>
<span>LENDING</span>
<span>·</span>
<span>ACCOUNTING</span>
<span>·</span>
<span>INSURANCE</span>
<span>·</span>
<span>FINTECH</span>
<span>·</span>
<span>PAYMENTS</span>
<span>·</span>
<span>LENDING</span>
<span>·</span>
<span>ACCOUNTING</span>
<span>·</span>
<span>INSURANCE</span>
<span>·</span>
<span>FINTECH</span>
</div>
</div>
</section>
<section id="the-problem" className="px-4 sm:px-6 py-16 sm:py-24 max-w-7xl mx-auto fade-in-section is-visible">
<div className="text-xs uppercase tracking-widest text-gray-500 mb-6 sm:mb-8 font-mono">THE PROOF</div>
<div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
<div>
<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">The math has stopped working for your marketing strategy.</h2>
<p className="text-sm sm:text-base text-gray-600 leading-relaxed">Customer acquisition costs in financial services continue rising. You're competing for the most expensive keywords in digital advertising to reach buyers who require trust before switching platforms.</p>
</div>
<div className="w-full">
<div className="lg:hidden w-full">
<div className="bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 rounded-2xl p-6">
<div className="space-y-4">
<div className="bg-white rounded-xl shadow-md p-4 relative">
<div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-mono">ADS MANAGER · SEARCH</div>
<div className="h-px bg-gray-200 mb-3">
</div>
<div className="text-xs text-gray-500 mb-1 font-mono">Cost Per Click</div>
<div className="text-3xl font-bold text-gray-900 mb-2">$4.20</div>
<div className="text-sm text-red-600 font-medium mb-3">▲ 34% <span className="text-gray-500">vs last year</span>
</div>
<svg className="w-full h-12" viewBox="0 0 200 60" preserveAspectRatio="none">
<polyline points="0,50 40,45 80,42 120,35 160,28 200,20" fill="none" stroke="#4B2A85" strokeWidth="2" />
<circle cx="200" cy="20" r="3" fill="#ef4444" />
</svg>
<div className="flex items-center justify-between mt-2">
<div className="text-xs text-gray-400 uppercase tracking-wider font-mono">LAST 6 QUARTERS</div>
</div>
</div>
<div className="bg-white rounded-xl shadow-md p-4 relative">
<div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-mono">ADS MANAGER · SOCIAL</div>
<div className="h-px bg-gray-200 mb-3">
</div>
<div className="text-xs text-gray-500 mb-1 font-mono">Cost Per 1,000 Impressions</div>
<div className="text-3xl font-bold text-gray-900 mb-2">$18.60</div>
<div className="text-sm text-red-600 font-medium mb-3">▲ 41% <span className="text-gray-500">vs last year</span>
</div>
<svg className="w-full h-12" viewBox="0 0 200 60" preserveAspectRatio="none">
<polyline points="0,50 40,45 80,42 120,35 160,28 200,20" fill="none" stroke="#4B2A85" strokeWidth="2" />
<circle cx="200" cy="20" r="3" fill="#ef4444" />
</svg>
<div className="flex items-center justify-between mt-2">
<div className="text-xs text-gray-400 uppercase tracking-wider font-mono">LAST 6 QUARTERS</div>
</div>
</div>
<div className="bg-white rounded-xl shadow-md p-4 relative">
<div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-mono">ADS MANAGER · DISPLAY</div>
<div className="h-px bg-gray-200 mb-3">
</div>
<div className="text-xs text-gray-500 mb-1 font-mono">Cost Per Acquisition</div>
<div className="text-3xl font-bold text-gray-900 mb-2">$410</div>
<div className="text-sm text-red-600 font-medium mb-3">▲ 38% <span className="text-gray-500">vs last year</span>
</div>
<svg className="w-full h-12" viewBox="0 0 200 60" preserveAspectRatio="none">
<polyline points="0,50 40,45 80,42 120,35 160,28 200,20" fill="none" stroke="#4B2A85" strokeWidth="2" />
<circle cx="200" cy="20" r="3" fill="#ef4444" />
</svg>
<div className="flex items-center justify-between mt-2">
<div className="text-xs text-gray-400 uppercase tracking-wider font-mono">LAST 6 QUARTERS</div>
<div className="bg-[#4B2A85] text-white px-2 py-1 rounded-full text-xs font-mono">BUDGET · 94% SPENT</div>
</div>
</div>
</div>
<p className="text-xs text-gray-400 mt-4 text-center font-mono">Illustrative data</p>
</div>
</div>
<div className="hidden lg:block w-full">
<div className="relative">
<div className="bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 rounded-3xl p-12 relative min-h-[500px] flex items-center justify-center">
<div className="relative w-full max-w-md h-96">
<div className="absolute inset-0 transition-all duration-700 ease-out cac-card opacity-100" style={{ transform: "rotate(-7deg) translateY(20px)", zIndex: 1, transformOrigin: "center center" }}>
<div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col justify-between relative">
<div>
<div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-mono">ADS MANAGER · SEARCH</div>
<div className="h-px bg-gray-200 mb-4">
</div>
<div className="text-xs text-gray-500 mb-2 font-mono">COST PER CLICK</div>
<div className="text-4xl font-bold text-gray-900 mb-3">$4.20</div>
<div className="text-sm text-red-600 font-medium mb-4">▲ 34% vs last year</div>
<svg className="w-full h-16" viewBox="0 0 200 60" preserveAspectRatio="none">
<polyline points="0,50 40,45 80,42 120,35 160,28 200,20" fill="none" stroke="#4B2A85" strokeWidth="2" />
<circle cx="200" cy="20" r="3" fill="#ef4444" />
</svg>
</div>
<div className="text-[9px] text-gray-400 uppercase tracking-wider font-mono">LAST 6 QUARTERS</div>
</div>
</div>
<div className="absolute inset-0 transition-all duration-700 ease-out cac-card opacity-100" style={{ transform: "rotate(4deg) translateY(10px)", zIndex: 2, transformOrigin: "center center" }}>
<div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col justify-between relative">
<div>
<div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-mono">ADS MANAGER · SOCIAL</div>
<div className="h-px bg-gray-200 mb-4">
</div>
<div className="text-xs text-gray-500 mb-2 font-mono">COST PER 1,000 IMPRESSIONS</div>
<div className="text-4xl font-bold text-gray-900 mb-3">$18.60</div>
<div className="text-sm text-red-600 font-medium mb-4">▲ 41% vs last year</div>
<svg className="w-full h-16" viewBox="0 0 200 60" preserveAspectRatio="none">
<polyline points="0,50 40,45 80,42 120,35 160,28 200,20" fill="none" stroke="#4B2A85" strokeWidth="2" />
<circle cx="200" cy="20" r="3" fill="#ef4444" />
</svg>
</div>
<div className="text-[9px] text-gray-400 uppercase tracking-wider font-mono">LAST 6 QUARTERS</div>
</div>
</div>
<div className="absolute inset-0 transition-all duration-700 ease-out cac-card opacity-100" style={{ transform: "rotate(-2deg) translateY(0px)", zIndex: 3, transformOrigin: "center center" }}>
<div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col justify-between relative">
<div className="absolute top-4 right-4">
<div className="bg-[#4B2A85] text-white px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider">BUDGET · 94% SPENT</div>
</div>
<div>
<div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-mono">ADS MANAGER · DISPLAY</div>
<div className="h-px bg-gray-200 mb-4">
</div>
<div className="text-xs text-gray-500 mb-2 font-mono">COST PER ACQUISITION</div>
<div className="text-4xl font-bold text-gray-900 mb-3">$410</div>
<div className="text-sm text-red-600 font-medium mb-4">▲ 38% vs last year</div>
<svg className="w-full h-16" viewBox="0 0 200 60" preserveAspectRatio="none">
<polyline points="0,50 40,45 80,42 120,35 160,28 200,20" fill="none" stroke="#4B2A85" strokeWidth="2" />
<circle cx="200" cy="20" r="3" fill="#ef4444" />
</svg>
</div>
<div className="text-[9px] text-gray-400 uppercase tracking-wider font-mono">LAST 6 QUARTERS</div>
</div>
</div>
</div>
</div>
<p className="text-xs text-gray-400 mt-3 text-center font-mono">Illustrative data</p>
</div>
</div>
</div>
</div>
</section>
<section id="the-solution" className="px-4 sm:px-6 lg:px-6 py-12 sm:py-16 md:py-20 max-w-7xl mx-auto fade-in-section">
<div className="text-center mb-12 sm:mb-16 md:mb-20">
<div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-3 sm:mb-4 transition-all duration-1000 opacity-0 -translate-x-20" style={{ transitionDelay: "0ms", fontFamily: "'Bricolage Grotesque', sans-serif" }}>People <span className="mint-highlight">Trust</span> People.</div>
<div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 transition-all duration-1000 opacity-0 translate-x-20" style={{ transitionDelay: "200ms", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Not Ads.</div>
</div>
<div className="text-xs uppercase tracking-widest text-gray-500 mb-6 sm:mb-8 font-mono">THE SOLUTION</div>
<div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-start">
<div>
<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 max-w-full break-words lg:break-normal px-0">Uplaud turns trust into a channel of qualified leads.</h2>
<p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">Transform positive customer experiences into referrals, qualified leads, and conversion-driving content. Systematic word-of-mouth for products where trust drives every decision. And when you're ready to run ads, Uplaud builds and runs them for you — creative made from real customer proof, targeted with your referral data.</p>
<div className="mb-6 sm:mb-8">
<p className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">The tangible change to your numbers:</p>
<div className="space-y-3">
<div className="flex items-center gap-3">
<div className="w-6 h-6 rounded-full bg-[#7FEAC8] flex items-center justify-center flex-shrink-0">
<svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
</svg>
</div>
<span className="text-sm sm:text-base text-gray-900">Lower Customer Acquisition Costs</span>
</div>
<div className="flex items-center gap-3">
<div className="w-6 h-6 rounded-full bg-[#7FEAC8] flex items-center justify-center flex-shrink-0">
<svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
</svg>
</div>
<span className="text-sm sm:text-base text-gray-900">Higher Conversion Rates</span>
</div>
<div className="flex items-center gap-3">
<div className="w-6 h-6 rounded-full bg-[#7FEAC8] flex items-center justify-center flex-shrink-0">
<svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
</svg>
</div>
<span className="text-sm sm:text-base text-gray-900">Compounding Growth</span>
</div>
</div>
</div>
<button className="bg-[#4B2A85] text-white px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-[#3d2269] transition-all hover:scale-[1.02] font-mono flex items-center gap-2 shadow-[0_4px_14px_0_rgba(75,42,133,0.39)] text-sm sm:text-base">Get Started <span className="text-base sm:text-lg">↗</span>
</button>
</div>
<div className="w-full">
<div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
<div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-3">
<span className="font-bold text-lg text-gray-900">Uplaud</span>
<div className="flex items-center gap-2">
<div className="w-2 h-2 bg-[#7FEAC8] rounded-full animate-pulse">
</div>
<span className="text-xs text-gray-600">Live</span>
</div>
</div>
<div className="bg-[#4B2A85] text-white px-3 py-1 rounded-full text-xs font-mono">THIS WEEK</div>
</div>
<div className="p-4">
<div className="flex items-center justify-between mb-4">
<div>
<h3 className="text-lg font-bold text-gray-900 mb-1">Warm leads</h3>
<p className="text-xs text-gray-600">People who arrived through a customer they trust.</p>
</div>
<div className="bg-[#4B2A85] text-white px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap">
<span className="font-bold">6</span> new</div>
</div>
<div className="space-y-3">
<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
<div className="flex items-center justify-between mb-2">
<span className="font-semibold text-gray-900 text-sm">Sophie K.</span>
<span className="px-2 py-1 rounded-full text-xs font-mono font-semibold bg-[#7FEAC8] text-gray-900">DEMO BOOKED</span>
</div>
<p className="text-xs text-gray-600">Referred by <span className="font-medium text-gray-900">Tom W.</span>
</p>
</div>
<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
<div className="flex items-center justify-between mb-2">
<span className="font-semibold text-gray-900 text-sm">Daniel P.</span>
<span className="px-2 py-1 rounded-full text-xs font-mono font-semibold bg-purple-100 text-[#4B2A85]">REPLIED</span>
</div>
<p className="text-xs text-gray-600">Referred by <span className="font-medium text-gray-900">Tom W.</span>
</p>
</div>
<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
<div className="flex items-center justify-between mb-2">
<span className="font-semibold text-gray-900 text-sm">Priya K.</span>
<span className="px-2 py-1 rounded-full text-xs font-mono font-semibold bg-purple-100 text-[#4B2A85]">NEW</span>
</div>
<p className="text-xs text-gray-600">Referred by <span className="font-medium text-gray-900">Emma D.</span>
</p>
</div>
<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
<div className="flex items-center justify-between mb-2">
<span className="font-semibold text-gray-900 text-sm">Alex T.</span>
<span className="px-2 py-1 rounded-full text-xs font-mono font-semibold bg-[#7FEAC8] text-gray-900">DEMO BOOKED</span>
</div>
<p className="text-xs text-gray-600">Referred by <span className="font-medium text-gray-900">Tom W.</span>
</p>
</div>
<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
<div className="flex items-center justify-between mb-2">
<span className="font-semibold text-gray-900 text-sm">Lena F.</span>
<span className="px-2 py-1 rounded-full text-xs font-mono font-semibold bg-purple-100 text-[#4B2A85]">NEW</span>
</div>
<p className="text-xs text-gray-600">Referred by <span className="font-medium text-gray-900">Emma D.</span>
</p>
</div>
</div>
<div className="mt-4 bg-purple-50 rounded-xl px-3 py-3 text-center">
<p className="text-xs text-[#4B2A85] font-bold">Every lead traces back to the review that started it.</p>
</div>
</div>
</div>
</div>
</div>
</section>
<section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 relative overflow-hidden fade-in-section min-h-screen flex items-center" style={{background: "linear-gradient(rgb(45, 22, 80) 0%, rgb(31, 14, 58) 50%, rgb(13, 3, 24) 100%)"}}>
<div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%20200%20200%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cfilter%20id%3D%27noiseFilter%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.9%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noiseFilter)%27%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "repeat", backgroundSize: "200px 200px" }}>
</div>
<div className="w-full mx-auto relative z-10 flex items-center justify-center" style={{ filter: "none" }}>
<div className="flex items-center justify-center">
<svg viewBox="0 0 1000 800" style={{ width: "min(90vw, 640px)", height: "auto", filter: "drop-shadow(rgba(127, 234, 200, 0.3) 0px 0px 60px)" }}>
<defs>
<filter id="softGlow">
<feGaussianBlur stdDeviation="8" result="coloredBlur">
</feGaussianBlur>
<feMerge>
<feMergeNode in="coloredBlur">
</feMergeNode>
<feMergeNode in="SourceGraphic">
</feMergeNode>
</feMerge>
</filter>
<filter id="nodeHalo">
<feGaussianBlur stdDeviation="6" result="coloredBlur">
</feGaussianBlur>
<feMerge>
<feMergeNode in="coloredBlur">
</feMergeNode>
<feMergeNode in="SourceGraphic">
</feMergeNode>
</feMerge>
</filter>
<radialGradient id="subtleGlow">
<stop offset="0%" stop-color="rgba(127, 234, 200, 0.15)">
</stop>
<stop offset="100%" stop-color="rgba(127, 234, 200, 0)">
</stop>
</radialGradient>
</defs>
<circle cx="500" cy="400" r="270" fill="url(#subtleGlow)" opacity="0" className="transition-opacity duration-1500" />
<circle cx="500" cy="400" r="220" fill="none" stroke="#7FEAC8" strokeWidth="2" filter="url(#softGlow)" opacity="1" className="transition-all duration-2000 opacity-0" style={{ strokeDasharray: "1382", strokeDashoffset: "1382", transition: "stroke-dashoffset 2.5s ease-out, opacity 1.5s" }} />
<text x="500" y="400" textAnchor="middle" className="fill-white font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "36px" }}>
<tspan x="500" dy="-0.4em">Uplaud</tspan>
<tspan x="500" dy="1.5em">Growth Engine</tspan>
</text>
<g>
<circle cx="500" cy="180" r="28" fill="rgba(127, 234, 200, 0.08)" className="transition-all duration-700 opacity-0" style={{transitionDelay: "0ms"}} />
<circle cx="500" cy="180" r="22" fill="#7FEAC8" filter="url(#nodeHalo)" opacity="1" className="transition-all duration-700 opacity-0 scale-0" style={{ transitionDelay: "0ms", transformOrigin: "500px 180px" }} />
<text x="500" y="180" textAnchor="middle" dominantBaseline="middle" className="font-bold font-mono" style={{ pointerEvents: "none", fontSize: "18px", fill: "rgb(30, 27, 58)" }}>01</text>
<text x="500" y="130" textAnchor="middle" dominantBaseline="middle" className="fill-white font-medium" style={{ fontFamily: "Inter, sans-serif", fontSize: "26px" }}>Capture</text>
</g>
<g>
<circle cx="709.2324335849338" cy="332.01626123751157" r="28" fill="rgba(127, 234, 200, 0.08)" className="transition-all duration-700 opacity-0" style={{transitionDelay: "200ms"}} />
<circle cx="709.2324335849338" cy="332.01626123751157" r="22" fill="#7FEAC8" filter="url(#nodeHalo)" opacity="1" className="transition-all duration-700 opacity-0 scale-0" style={{ transitionDelay: "200ms", transformOrigin: "709.232px 332.016px" }} />
<text x="709.2324335849338" y="332.01626123751157" textAnchor="middle" dominantBaseline="middle" className="font-bold font-mono" style={{ pointerEvents: "none", fontSize: "18px", fill: "rgb(30, 27, 58)" }}>02</text>
<text x="756.7852593996914" y="316.5654115187642" textAnchor="start" dominantBaseline="middle" className="fill-white font-medium" style={{ fontFamily: "Inter, sans-serif", fontSize: "26px" }}>
<tspan x="756.7852593996914" textAnchor="start" dy="-0.6em">Personalize &amp;</tspan>
<tspan x="756.7852593996914" textAnchor="start" dy="1.2em">Refer</tspan>
</text>
</g>
<g>
<circle cx="629.3127555043441" cy="577.9837387624884" r="28" fill="rgba(127, 234, 200, 0.08)" className="transition-all duration-700 opacity-0" style={{transitionDelay: "400ms"}} />
<circle cx="629.3127555043441" cy="577.9837387624884" r="22" fill="#7FEAC8" filter="url(#nodeHalo)" opacity="1" className="transition-all duration-700 opacity-0 scale-0" style={{ transitionDelay: "400ms", transformOrigin: "629.313px 577.984px" }} />
<text x="629.3127555043441" y="577.9837387624884" textAnchor="middle" dominantBaseline="middle" className="font-bold font-mono" style={{ pointerEvents: "none", fontSize: "18px", fill: "rgb(30, 27, 58)" }}>03</text>
<text x="658.7020181189678" y="618.4345884812358" textAnchor="start" dominantBaseline="middle" className="fill-white font-medium" style={{ fontFamily: "Inter, sans-serif", fontSize: "26px" }}>
<tspan x="658.7020181189678" textAnchor="start" dy="-0.6em">Amplify &amp;</tspan>
<tspan x="658.7020181189678" textAnchor="start" dy="1.2em">Distribute</tspan>
</text>
</g>
<g>
<circle cx="370.68724449565593" cy="577.9837387624884" r="28" fill="rgba(127, 234, 200, 0.08)" className="transition-all duration-700 opacity-0" style={{transitionDelay: "600ms"}} />
<circle cx="370.68724449565593" cy="577.9837387624884" r="22" fill="#7FEAC8" filter="url(#nodeHalo)" opacity="1" className="transition-all duration-700 opacity-0 scale-0" style={{ transitionDelay: "600ms", transformOrigin: "370.687px 577.984px" }} />
<text x="370.68724449565593" y="577.9837387624884" textAnchor="middle" dominantBaseline="middle" className="font-bold font-mono" style={{ pointerEvents: "none", fontSize: "18px", fill: "rgb(30, 27, 58)" }}>04</text>
<text x="341.2979818810323" y="618.4345884812358" textAnchor="end" dominantBaseline="middle" className="fill-white font-medium" style={{ fontFamily: "Inter, sans-serif", fontSize: "26px" }}>
<tspan x="341.2979818810323" textAnchor="end" dy="-0.6em">Enrich, Nurture</tspan>
<tspan x="341.2979818810323" textAnchor="end" dy="1.2em">&amp; Convert</tspan>
</text>
</g>
<g>
<circle cx="290.7675664150662" cy="332.0162612375115" r="28" fill="rgba(127, 234, 200, 0.08)" className="transition-all duration-700 opacity-0" style={{transitionDelay: "800ms"}} />
<circle cx="290.7675664150662" cy="332.0162612375115" r="22" fill="#7FEAC8" filter="url(#nodeHalo)" opacity="1" className="transition-all duration-700 opacity-0 scale-0" style={{ transitionDelay: "800ms", transformOrigin: "290.768px 332.016px" }} />
<text x="290.7675664150662" y="332.0162612375115" textAnchor="middle" dominantBaseline="middle" className="font-bold font-mono" style={{ pointerEvents: "none", fontSize: "18px", fill: "rgb(30, 27, 58)" }}>05</text>
<text x="243.21474060030857" y="316.5654115187641" textAnchor="end" dominantBaseline="middle" className="fill-white font-medium" style={{ fontFamily: "Inter, sans-serif", fontSize: "26px" }}>
<tspan x="243.21474060030857" textAnchor="end" dy="-0.6em">Continuous</tspan>
<tspan x="243.21474060030857" textAnchor="end" dy="1.2em">Growth</tspan>
</text>
</g>
</svg>
</div>
</div>
</section>
<section id="identifying-fit" className="px-4 sm:px-6 py-12 sm:py-16 md:py-24 max-w-7xl mx-auto fade-in-section">
<div className="text-xs uppercase tracking-widest text-gray-500 mb-6 sm:mb-8 font-mono">Is this you</div>
<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-12 sm:mb-16 max-w-4xl">Built for FinTech, where <span className="mint-highlight">trust</span> is the product.</h2>
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
<div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-[#4B2A85] hover:shadow-lg transition-all">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card w-10 h-10 sm:w-12 sm:h-12 text-[#4B2A85] mb-4 sm:mb-6" aria-hidden="true">
<rect width="20" height="14" x="2" y="5" rx="2" />
<line x1="2" x2="22" y1="10" y2="10" />
</svg>
<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">Payments &amp; Expense Platforms</h3>
<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Businesses route real money through you. They sign up because a founder they know already did.</p>
</div>
<div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-[#4B2A85] hover:shadow-lg transition-all">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-handshake w-10 h-10 sm:w-12 sm:h-12 text-[#4B2A85] mb-4 sm:mb-6" aria-hidden="true">
<path d="m11 17 2 2a1 1 0 1 0 3-3" />
<path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
<path d="m21 3 1 11h-2" />
<path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
<path d="M3 4h8" />
</svg>
<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">Lending &amp; Credit</h3>
<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Nobody takes a loan from a stranger. Borrowers arrive through accountants, advisors, and other owners.</p>
</div>
<div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-[#4B2A85] hover:shadow-lg transition-all">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator w-10 h-10 sm:w-12 sm:h-12 text-[#4B2A85] mb-4 sm:mb-6" aria-hidden="true">
<rect width="16" height="20" x="4" y="2" rx="2" />
<line x1="8" x2="16" y1="6" y2="6" />
<line x1="16" x2="16" y1="14" y2="18" />
<path d="M16 10h.01" />
<path d="M12 10h.01" />
<path d="M8 10h.01" />
<path d="M12 14h.01" />
<path d="M8 14h.01" />
<path d="M12 18h.01" />
<path d="M8 18h.01" />
</svg>
<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">Accounting &amp; Bookkeeping Software</h3>
<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Every accountant who loves you influences dozens of client decisions. Capture it.</p>
</div>
<div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-[#4B2A85] hover:shadow-lg transition-all">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield w-10 h-10 sm:w-12 sm:h-12 text-[#4B2A85] mb-4 sm:mb-6" aria-hidden="true">
<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
</svg>
<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">Business Insurance</h3>
<p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Policies are renewed on relationships. One insured founder vouching moves an entire network.</p>
</div>
</div>
<div className="text-center py-12 sm:py-16">
<p className="text-lg sm:text-xl font-bold text-gray-900 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>If one new account is worth thousands in lifetime value, this is built for how you already grow.</p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
<button className="w-full sm:w-auto bg-[#4B2A85] text-white px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-[#3d2269] transition-all hover:scale-[1.02] font-mono flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(75,42,133,0.39)] text-sm sm:text-base">Get Started <span className="text-base sm:text-lg">↗</span>
</button>
<button className="w-full sm:w-auto border-2 border-gray-900 text-gray-900 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-gray-900 hover:text-white transition-all hover:scale-[1.02] font-mono flex items-center justify-center gap-2 shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] text-sm sm:text-base">Get a Demo <span className="text-base sm:text-lg">↗</span>
</button>
</div>
</div>
</section>
<section className="px-4 sm:px-6 py-12 sm:py-16 md:py-24 max-w-4xl mx-auto fade-in-section">
<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12">FAQs</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-2xl px-6 bg-white transition-all duration-200">
              <h3>
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="flex flex-1 w-full items-center justify-between py-4 text-left text-lg font-semibold text-gray-900 hover:text-[#4B2A85] transition-colors focus:outline-none"
                >
                  {faq.question}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${
                      activeFaq === idx ? "rotate-180" : ""
                    }`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </h3>
              {activeFaq === idx && (
                <div className="pb-5 pt-1 text-sm text-gray-600 leading-relaxed transition-all duration-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
        </section>
</main>
<footer className="px-4 sm:px-6 py-12 sm:py-16 md:py-24 relative overflow-hidden" style={{background: "linear-gradient(rgb(67, 23, 113) 0%, rgb(56, 20, 96) 50%, rgb(22, 3, 44) 100%)"}}>
<div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%20200%20200%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cfilter%20id%3D%27noiseFilter%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.9%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noiseFilter)%27%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "repeat", backgroundSize: "200px 200px" }}>
</div>
<div className="absolute left-0 right-0 bottom-0 flex items-end justify-center pointer-events-none overflow-hidden" style={{ height: "120px" }}>
<div className="text-[15vw] sm:text-[18vw] font-bold leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", transform: "translateY(15%)", background: "linear-gradient(rgba(78, 65, 109, 0.6) 0%, rgba(0, 0, 0, 0) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>uplaud.ai</div>
</div>
<div className="absolute inset-0 opacity-20">
<div className="wave wave-1">
</div>
<div className="wave wave-2">
</div>
<div className="wave wave-3">
</div>
</div>
<div className="max-w-4xl mx-auto text-center relative z-10">
<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">Build the trust layer for your business with Uplaud.</h2>
<p className="text-base sm:text-lg text-white/80 mb-8 sm:mb-10 px-2">The trust engine for FinTech. Real reviews. Real people. Real growth.</p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-24 px-4">
<button className="w-full sm:w-auto bg-[#7FEAC8] text-gray-900 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-[#6dd4b4] transition-all hover:scale-[1.02] font-semibold font-mono flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(127,234,200,0.39)] text-sm sm:text-base">Get Started <span className="text-base sm:text-lg">↗</span>
</button>
<button className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-white hover:text-gray-900 transition-all hover:scale-[1.02] font-mono flex items-center justify-center gap-2 shadow-[0_2px_8px_0_rgba(255,255,255,0.15)] text-sm sm:text-base">Get a Demo <span className="text-base sm:text-lg">↗</span>
</button>
</div>
<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 sm:pt-12 border-t border-white/20">
<div className="text-white font-bold text-lg sm:text-xl">Uplaud.AI</div>
<a href="mailto:hello@uplaud.ai" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">hello@uplaud.ai</a>
</div>
<div className="text-white/60 text-xs sm:text-sm mt-4 sm:mt-6">© 2026 Uplaud. All rights reserved.</div>
</div>
</footer>
</div>
    </div>
  );
}
