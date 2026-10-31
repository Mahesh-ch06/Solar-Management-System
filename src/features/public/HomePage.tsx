import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SunMedium,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Zap,
  Shield,
  TrendingDown,
  Award,
  Building2,
  Home,
  Factory,
} from 'lucide-react';
import { SolarCalculator } from './components/SolarCalculator';
import { LeadCaptureForm } from './components/LeadCaptureForm';
import { getStoredCustomerSession } from './CustomerAuthPage';
import { Customer } from '../../types/customer';

/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */
const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setCustomer(getStoredCustomerSession());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { label: 'Solutions', id: 'solutions' },
    { label: 'Process', id: 'process' },
    { label: 'Govt. Subsidy', id: 'subsidy' },
    { label: 'Calculator', id: 'calculator' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
          : 'bg-white/80 backdrop-blur-xs border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
              <SunMedium className="w-4.5 h-4.5" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">
              SunPower <span className="text-amber-600">Solutions</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {customer ? (
              <Link
                to="/portal"
                className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                My Project
              </Link>
            ) : (
              <Link
                to="/customer/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Customer Portal
              </Link>
            )}
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Staff ERP
            </Link>
            <button
              onClick={() => scrollTo('quote-form')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Get Free Quote
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 pb-6 pt-2 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="flex w-full items-center py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-4 border-t border-slate-200 space-y-2 mt-2">
            <button
              onClick={() => scrollTo('quote-form')}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold text-center transition-colors"
            >
              Get Free Quote
            </button>
            <Link
              to="/customer/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold text-center hover:bg-slate-50 transition-colors"
            >
              Customer Login
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Staff ERP Login →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
const Hero: React.FC = () => {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 overflow-hidden bg-gradient-to-b from-amber-50/50 via-white to-slate-50">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-400/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-12 lg:py-20">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold tracking-wide uppercase mb-6 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            MNRE Empanelled · PM Surya Ghar Certified EPC
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Cut Your Electricity Bill
            <br />
            by Up to <span className="text-amber-600">90%</span>
            <br />
            <span className="text-slate-600">with Rooftop Solar.</span>
          </h1>

          {/* Sub */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
            Turnkey solar installations backed by the Central Government's PM Surya Ghar scheme.
            Get up to{' '}
            <strong className="text-slate-900 font-bold">₹78,000 in direct bank subsidy</strong>,
            zero paperwork stress, and a 25-year performance warranty.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <button
              onClick={() => scrollTo('calculator')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Calculate My Savings
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo('quote-form')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Book Free Site Survey
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '500+', label: 'Installations Completed' },
              { value: '₹78K', label: 'Max Direct Subsidy' },
              { value: '25 Yr', label: 'Tier-1 Warranty' },
              { value: '4.9★', label: 'Customer Trust' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-2xl font-black text-slate-900 font-mono">{stat.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   SOLUTIONS
───────────────────────────────────────────── */
const solutions = [
  {
    icon: Home,
    title: 'Residential Rooftops',
    range: '1–10 kW',
    desc: 'Custom on-grid systems for independent villas and bungalows. Eligible for maximum ₹78,000 PM Surya Ghar grant.',
    highlights: ['Up to 90% monthly bill reduction', 'Bi-directional net-metering export credit'],
  },
  {
    icon: Building2,
    title: 'Housing Societies (RWA)',
    range: '10–50 kW',
    desc: 'Shared rooftop arrays powering common area lifts, corridor lighting, pumps, and clubhouses with zero tariff shock.',
    highlights: ['Drastically slash RWA maintenance dues', 'Zero disruption to structural waterproofing'],
  },
  {
    icon: Factory,
    title: 'Commercial & Industrial',
    range: '25–500 kW',
    desc: 'High-capacity EPC setups for warehouses, cold storages, hospitals, and manufacturing factories.',
    highlights: ['40% accelerated tax depreciation', 'Payback achieved in 2.5–3 years'],
  },
];

const SolutionsSection: React.FC = () => (
  <section id="solutions" className="py-20 bg-white border-t border-slate-200">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      {/* Section label */}
      <div className="mb-14">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2">
          Engineered EPC Solutions
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Solar Architectures for Every Scale
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-xl">
          From an urban residential terrace to a multi-megawatt industrial manufacturing plant — we design, procure, install, and guarantee peak generation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {solutions.map((s, i) => (
          <div
            key={i}
            className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6 text-amber-600 shadow-xs">
              <s.icon className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {s.range}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{s.desc}</p>
            <ul className="space-y-2.5 pt-4 border-t border-slate-200">
              {s.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Feature strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          { icon: Zap, label: 'Fast energization', desc: 'Installed & commissioned in 1 day' },
          { icon: Shield, label: '100% DISCOM paperwork', desc: 'Net-meter, CEIG & portal filings handled' },
          { icon: TrendingDown, label: '3–5 year payback', desc: 'Highest clean energy ROI in North India' },
          { icon: Award, label: '25-year panel warranty', desc: 'Tier-1 Mono PERC modules guaranteed' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <item.icon className="w-5 h-5 text-amber-600 mb-2" />
            <p className="text-xs font-bold text-slate-900">{item.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   PROCESS
───────────────────────────────────────────── */
const steps = [
  { n: '01', title: 'Free Rooftop Audit & Shadow Analysis', time: 'Day 1', desc: 'Certified engineer visits your premises, audits shadow zones with drone telemetry, checks RCC load and earthing.' },
  { n: '02', title: 'Custom 3D Layout & Guaranteed Quotation', time: 'Day 2', desc: 'Official Bill of Materials (BOM), system sizing, and transparent subsidy calculation presented for approval.' },
  { n: '03', title: 'DISCOM Feasibility (TFR) Filing', time: 'Days 3–7', desc: 'Our regulatory desk files your pre-registration on the national portal and secures DISCOM technical approval.' },
  { n: '04', title: 'Precision EPC Installation', time: 'Day 8', desc: 'Tier-1 bifacial/mono PERC panels, inverters, aluminum mountings, and lightning arrestors installed in a single day.' },
  { n: '05', title: 'Net-Meter Testing & DBT Subsidy Credit', time: 'Days 15–30', desc: 'Bi-directional meter energized. ₹78,000 subsidy credited straight to your Aadhaar-linked bank account via DBT.' },
];

const ProcessSection: React.FC = () => (
  <section id="process" className="py-20 border-t border-slate-200 bg-slate-50">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="mb-14">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2">
          Turnkey Execution Roadmap
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          From Inquiry to Clean Energy in 30 Days
        </h2>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow"
          >
            {/* Number */}
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-mono font-black text-sm flex items-center justify-center shrink-0">
              {step.n}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <span className="shrink-0 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  {step.time}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   SUBSIDY
───────────────────────────────────────────── */
const SubsidySection: React.FC = () => (
  <section id="subsidy" className="py-20 border-t border-slate-200 bg-white">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left */}
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2">
            PM Surya Ghar: Muft Bijli Yojana
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Up to ₹78,000 Direct
            <br />
            <span className="text-amber-600">Bank Transfer Subsidy.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-8">
            The Central Government's flagship solar initiative delivers non-repayable direct cash assistance
            to residential rooftop owners. SunPower manages 100% of DISCOM liaison, portal uploads,
            and joint inspection certificates so you receive every rupee smoothly.
          </p>

          {/* Tiers */}
          <div className="space-y-3">
            {[
              { cap: '1 kW System', amount: '₹30,000', highlight: false, note: 'Ideal for 1-2 BHK apartments / small loads' },
              { cap: '2 kW System', amount: '₹60,000', highlight: false, note: 'Ideal for 3 BHK homes with 1-2 ACs' },
              { cap: '3 kW to 10 kW', amount: '₹78,000 (Max)', highlight: true, note: 'Recommended for independent homes & villas' },
            ].map((tier) => (
              <div
                key={tier.cap}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  tier.highlight
                    ? 'border-amber-300 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <p className={`text-xs font-bold ${tier.highlight ? 'text-amber-900' : 'text-slate-800'}`}>
                    {tier.cap}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tier.note}</p>
                </div>
                <span className={`text-lg font-black font-mono ${tier.highlight ? 'text-amber-700' : 'text-slate-900'}`}>
                  {tier.amount}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            * Direct Benefit Transfer (DBT) funds are credited to your Aadhaar-linked bank account within 30 days of DISCOM inspection as per MNRE official benchmarks.
          </p>
        </div>

        {/* Right — DBT Lifecycle */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">
            The DBT Subsidy Lifecycle
          </h3>
          <div className="space-y-5">
            {[
              { step: '1', title: 'National Portal Registration', desc: 'We link your Consumer Account Number on pmsuryaghar.gov.in.' },
              { step: '2', title: 'Technical Feasibility Approval (TFR)', desc: 'Your local DISCOM approves transformer capacity for the rooftop load.' },
              { step: '3', title: 'DCR-Compliant Installation', desc: 'Tier-1 Domestic Content Requirement (DCR) panels installed by our team.' },
              { step: '4', title: 'Net Meter Commissioning & Inspection', desc: 'DISCOM engineer visits, fits the bi-directional meter, and signs the joint report.' },
              { step: '5', title: 'Subsidy Disbursed via DBT', desc: '₹78,000 grant credited directly to your bank account within 30 days.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  item.step === '5' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-white text-slate-700 border border-slate-300'
                }`}>
                  {item.step}
                </div>
                <div>
                  <p className={`text-xs font-bold ${item.step === '5' ? 'text-amber-900' : 'text-slate-900'}`}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   CALCULATOR SECTION
───────────────────────────────────────────── */
const CalculatorSection: React.FC = () => (
  <section id="calculator" className="py-20 border-t border-slate-200 bg-slate-50">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <SolarCalculator />
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   LEAD FORM SECTION
───────────────────────────────────────────── */
const LeadSection: React.FC = () => (
  <section id="quote-form" className="py-20 border-t border-slate-200 bg-white">
    <div className="max-w-3xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-10">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2">
          Zero-Obligation Estimate
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Request Your Free Rooftop Audit
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">
          A certified solar engineer will contact you within 24 hours to schedule your free shadow and roof survey.
        </p>
      </div>
      <LeadCaptureForm />
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   FAQ
───────────────────────────────────────────── */
const faqs = [
  {
    q: 'How much rooftop area is required for a 3 kW solar system?',
    a: 'Approximately 250 to 300 sq. ft. of shadow-free area is required. Works on flat RCC roofs, elevated superstructures, or slanted tin sheds.',
  },
  {
    q: 'How does Net Metering adjust on my monthly power bill?',
    a: 'A bi-directional meter records units imported from the grid and exported from solar. You only pay for net consumption, and any surplus units roll over as bill credit.',
  },
  {
    q: 'How do I claim the ₹78,000 PM Surya Ghar subsidy?',
    a: 'The subsidy is credited directly to your bank account via Direct Benefit Transfer (DBT) within 30 days of DISCOM inspection. SunPower handles 100% of the portal paperwork.',
  },
  {
    q: 'What warranty is provided with the solar installation?',
    a: 'Tier-1 Mono PERC solar panels carry a 25-year linear performance warranty. Inverters carry 5-10 years, and SunPower provides a comprehensive 5-year AMC warranty.',
  },
];

const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="py-20 border-t border-slate-200 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Everything You Need to Know</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIdx === i && (
                <div className="px-6 pb-5 pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
const Footer: React.FC = () => {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
                <SunMedium className="w-4.5 h-4.5" strokeWidth={2.5} />
              </div>
              <span className="text-base font-bold text-slate-900">SunPower Solutions</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              MNRE-empanelled EPC company delivering industrial & residential rooftop solar power across North India.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              PM Surya Ghar Empanelled Vendor
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Quick Navigation</p>
            <ul className="space-y-2 text-xs">
              {[
                { label: 'Solar Solutions', id: 'solutions' },
                { label: 'Installation Process', id: 'process' },
                { label: 'PM Surya Ghar Subsidy', id: 'subsidy' },
                { label: 'Savings Calculator', id: 'calculator' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollTo(link.id)}
                    className="text-slate-600 hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <Link to="/portal" className="text-slate-600 hover:text-amber-600 transition-colors">
                  Customer Project Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Regional Hubs */}
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Regional Hubs</p>
            <ul className="space-y-2 text-xs">
              {[
                'Gurugram: Sector 14, Urban Estate',
                'Delhi: South Extension Part II',
                'Noida: Sector 62 Institutional Hub',
              ].map((loc) => (
                <li key={loc} className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  {loc}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Direct Helpdesk</p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                +91 98101 23456 (Mon – Sat)
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                support@sunpowersolutions.in
              </li>
            </ul>
            <div className="mt-5">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-900 font-bold bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 transition-colors shadow-xs"
              >
                Staff ERP Workspace
                <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SunPower Solutions EPC Pvt. Ltd. All rights reserved.</p>
          <p>Residential · Commercial · Industrial Rooftop Solar Infrastructure</p>
        </div>
      </div>
    </footer>
  );
};

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export const HomePage: React.FC = () => (
  <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
    <Navbar />
    <Hero />
    <SolutionsSection />
    <ProcessSection />
    <SubsidySection />
    <CalculatorSection />
    <LeadSection />
    <FAQSection />
    <Footer />
  </div>
);
