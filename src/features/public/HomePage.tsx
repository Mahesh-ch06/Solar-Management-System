import React from 'react';
import { PublicNavbar } from './components/PublicNavbar';
import { SolarCalculator } from './components/SolarCalculator';
import { LeadCaptureForm } from './components/LeadCaptureForm';
import { Badge } from '../../components/ui/Badge';
import {
  SunMedium,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Building,
  Home,
  Factory,
  BatteryCharging,
  Wrench,
  FileCheck,
  Banknote,
  Award,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-solar-500 selection:text-white">
      {/* 1. Sticky Public Header */}
      <PublicNavbar />

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-solar-600/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Gov Subsidy Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Approved EPC Vendor under <strong>PM Surya Ghar: Muft Bijli Yojana</strong></span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Cut Up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-400 via-emerald-400 to-amber-300">90% Off</span> Your Power Bill With Clean Rooftop Solar
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              SunPower Solutions delivers turnkey rooftop solar engineering, fast-track DISCOM approvals, and end-to-end paperwork to secure up to <strong className="text-amber-300">₹78,000 in direct government subsidy</strong> credited straight to your bank account.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => scrollTo('calculator')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-solar-600 hover:bg-solar-500 text-white font-bold text-sm shadow-xl hover:shadow-solar-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Calculate My Subsidy & Savings</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollTo('quote-form')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book Free Rooftop Survey</span>
              </button>
            </div>

            {/* Trust Badges Bar */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-white font-mono">500+</p>
                <p className="text-xs text-slate-400 mt-0.5">Rooftops Energized</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400 font-mono">₹78,000</p>
                <p className="text-xs text-slate-400 mt-0.5">Max DBT Govt. Subsidy</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400 font-mono">25 Years</p>
                <p className="text-xs text-slate-400 mt-0.5">Panel Linear Warranty</p>
              </div>
              <div>
                <p className="text-2xl font-black text-solar-400 font-mono">4.9 / 5</p>
                <p className="text-xs text-slate-400 mt-0.5">Customer Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. What We Do Section */}
      <section id="solutions" className="py-20 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="solar" size="md" className="mb-2">What We Do</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Turnkey Solar Solutions for Homes & Businesses
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From residential homes and gated communities to factories and off-grid facilities, we design, procure, install, and maintain world-class solar infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-solar-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-solar-500/10 text-solar-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Residential Rooftop Solar</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Custom engineered 1 kW to 10 kW grid-tied systems for independent houses and villas. Fully eligible for Central Government PM Surya Ghar subsidies.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Up to 90% power bill reduction</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Net-metering grid export credit</span>
                </li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Housing Societies & Apartments</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Shared rooftop solar arrays that power society common area lighting, water pumps, clubhouse, and elevators, drastically reducing monthly maintenance dues.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Up to ₹18,000/kW society subsidy</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero structural roof disruption</span>
                </li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Factory className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Commercial & Industrial EPC</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                High-capacity 25 kW to 500 kW rooftop installations for warehouses, hospitals, schools, and manufacturing plants with 40% accelerated depreciation tax benefits.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Significant operating margin boost</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2.5 to 3 years industrial payback</span>
                </li>
              </ul>
            </div>

            {/* Service 4 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BatteryCharging className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Hybrid Solar & Battery Storage</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Smart solar systems integrated with lithium iron phosphate (LiFePO4) battery banks that maintain seamless power supply during frequent grid cuts and night hours.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero flicker switchover (UPS grade)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>10-year battery lifespan</span>
                </li>
              </ul>
            </div>

            {/* Service 5 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">5-Year Comprehensive AMC</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Preventative health checks, string voltage audits, inverter firmware updates, deep de-mineralized panel cleaning, and round-the-clock IoT generation tracking.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Guaranteed generation performance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>24-hour breakdown support SLA</span>
                </li>
              </ul>
            </div>

            {/* Service 6 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Govt. Liaison & Net Metering</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                We handle 100% of the bureaucracy: DISCOM feasibility approval, CEIG electrical safety sanction, bi-directional meter testing, and national portal subsidy documentation.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero physical visits to govt. offices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Bank Transfer subsidy credit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How Do You Get Solar At Your Home (Step-by-Step) */}
      <section id="process" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="emerald" size="md" className="mb-2">Seamless 5-Step Process</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Do You Get Solar At Your Home?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Going solar with SunPower Solutions is completely frictionless. We handle everything from the initial roof audit to your first export electricity bill.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Timeline Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-solar-500 text-slate-950 font-black text-sm flex items-center justify-center mb-4 ring-4 ring-slate-950">
                  1
                </div>
                <h4 className="text-sm font-bold text-white">Free Rooftop Audit</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Our certified engineer visits your site, verifies roof area, tilt, shadow-free zones, and tests earthing feasibility.
                </p>
                <span className="mt-3 text-[10px] font-semibold text-solar-400 bg-solar-500/10 px-2 py-0.5 rounded">Day 1</span>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-solar-500 text-slate-950 font-black text-sm flex items-center justify-center mb-4 ring-4 ring-slate-950">
                  2
                </div>
                <h4 className="text-sm font-bold text-white">3D Design & BOM Quote</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  We generate your custom 3D layout, engineering Bill of Materials (BOM), and calculate your exact PM Surya Ghar subsidy deduction.
                </p>
                <span className="mt-3 text-[10px] font-semibold text-solar-400 bg-solar-500/10 px-2 py-0.5 rounded">Day 2</span>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mb-4 ring-4 ring-slate-950">
                  3
                </div>
                <h4 className="text-sm font-bold text-white">DISCOM & Subsidy Filing</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  We register your application on the National Rooftop Portal and secure technical feasibility approval from your electricity board.
                </p>
                <span className="mt-3 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Days 3–7</span>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-solar-500 text-slate-950 font-black text-sm flex items-center justify-center mb-4 ring-4 ring-slate-950">
                  4
                </div>
                <h4 className="text-sm font-bold text-white">1-Day Installation</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Hot-dip galvanized mounting structures, Tier-1 panels, inverter wiring, and chemical earthing pits installed with zero structural damage.
                </p>
                <span className="mt-3 text-[10px] font-semibold text-solar-400 bg-solar-500/10 px-2 py-0.5 rounded">Day 8</span>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center mb-4 ring-4 ring-slate-950">
                  5
                </div>
                <h4 className="text-sm font-bold text-white">Net-Meter & Subsidy Credit</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  DISCOM installs your bi-directional net meter. System energizes, and your subsidy is credited directly via DBT to your bank account.
                </p>
                <span className="mt-3 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Days 15–30</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PM Surya Ghar Government Subsidy Guide */}
      <section id="subsidy" className="py-20 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Central Government Fund Scheme
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                How We Guide You to Secure the Government Subsidy
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Under the flagship <strong className="text-white">PM Surya Ghar: Muft Bijli Yojana</strong>, the Government of India provides direct financial assistance to residential consumers installing rooftop solar.
              </p>

              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ₹30k
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1 kW Rooftop Solar Capacity</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fixed direct subsidy of <strong>₹30,000</strong> credited to homeowner's bank account.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ₹60k
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">2 kW Rooftop Solar Capacity</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fixed direct subsidy of <strong>₹60,000</strong> (₹30,000 per kW).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 bg-amber-950/10 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                    ₹78k
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">3 kW to 10 kW Rooftop Capacity</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Maximum direct Central Government DBT subsidy capped at <strong>₹78,000</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-solar-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  SunPower Solutions 100% Paperless Guarantee:
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Homeowners do not need to visit DISCOM or government offices. Our compliance desk uploads your electricity bill, generates the application on the National Rooftop Solar portal, coordinates the joint inspection with DISCOM inspectors, and tracks the Direct Bank Transfer (DBT) until funds hit your account.
                </p>
              </div>
            </div>

            {/* Visual Guide Box */}
            <div className="lg:col-span-6 bg-slate-900 p-7 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                The Direct Bank Transfer (DBT) Lifecycle
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">National Portal Pre-Registration</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">We link your Consumer Account Number (CA) on pmsuryaghar.gov.in.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">Technical Feasibility Approval (TFR)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Local distribution company approves transformer capacity for your rooftop.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">Turnkey Installation by SunPower Solutions</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">System installed using DCR-compliant solar modules as mandated by MNRE.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-white">Bi-Directional Net Meter Installed</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Joint inspection report signed and uploaded by the discom engineer.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black text-[11px]">
                    5
                  </div>
                  <div>
                    <p className="font-semibold text-amber-300">Direct Subsidy Disbursed via DBT</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Funds credited directly to your bank account within 30 days of inspection.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive Calculator Section */}
      <section id="calculator" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SolarCalculator />
      </section>

      {/* 7. Lead Capture Form Section */}
      <section id="quote-form" className="py-20 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="solar" size="md" className="mb-2">Zero Obligation</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Get Started with SunPower Solutions Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Fill out your basic details below. An authorized rooftop solar engineer will schedule your free 3D site audit within 24 hours.
            </p>
          </div>

          <LeadCaptureForm />
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="slate" size="md" className="mb-2">Common Questions</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-sm font-bold text-white">How much rooftop area is required for a 3 kW solar plant?</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              A standard 3 kW system requires approximately 250 to 300 square feet of shadow-free rooftop area. It can be installed on flat RCC concrete roofs, elevated superstructures (allowing you to still use your terrace), or slanted tin sheds.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-sm font-bold text-white">How does Net Metering work with my electricity bill?</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              A bi-directional net meter records both electricity imported from the grid and solar power exported into the grid. At the end of the monthly billing cycle, you are only billed for the net difference. Any surplus solar generation is banked or credited to your account.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-sm font-bold text-white">How do I receive the ₹78,000 PM Surya Ghar subsidy?</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The subsidy is released via Direct Benefit Transfer (DBT) directly into your Aadhaar-linked bank account by the Ministry of New & Renewable Energy (MNRE) within 30 days after the net meter is installed and joint inspection is uploaded. SunPower Solutions manages 100% of the portal filing and document submissions.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-sm font-bold text-white">What is the expected warranty and lifespan of the solar system?</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Tier-1 Mono PERC solar modules carry a 25-year linear performance warranty (guaranteeing over 80% output after 25 years). Inverters carry a 5 to 10-year replacement warranty, and SunPower Solutions provides a 5-year comprehensive workmanship and AMC warranty.
            </p>
          </div>
        </div>
      </section>

      {/* 9. Comprehensive Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-solar-500 text-slate-950 flex items-center justify-center font-black">
                  <SunMedium className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-white">SunPower Solutions</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Empanelled solar engineering, procurement, and construction (EPC) company pioneering clean rooftop solar across North India.
              </p>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>MNRE Empanelled Vendor</span>
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <p className="text-sm font-bold text-white mb-3">Quick Navigation</p>
              <ul className="space-y-2">
                <li><button onClick={() => scrollTo('solutions')} className="hover:text-white cursor-pointer">What We Do</button></li>
                <li><button onClick={() => scrollTo('process')} className="hover:text-white cursor-pointer">How Solar Works</button></li>
                <li><button onClick={() => scrollTo('subsidy')} className="hover:text-white cursor-pointer">PM Surya Ghar Subsidy</button></li>
                <li><button onClick={() => scrollTo('calculator')} className="hover:text-white cursor-pointer">Savings Calculator</button></li>
                <li><a href="/portal" className="text-solar-400 hover:text-solar-300">Track Customer Application</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <p className="text-sm font-bold text-white mb-3">Operating Hubs</p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-solar-400 shrink-0 mt-0.5" />
                  <span>Gurugram: Sector 14, Urban Estate</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-solar-400 shrink-0 mt-0.5" />
                  <span>Delhi: South Extension Part II</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-solar-400 shrink-0 mt-0.5" />
                  <span>Noida: Sector 62 Institutional Area</span>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <p className="text-sm font-bold text-white mb-3">Customer Support & ERP</p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-solar-400" />
                  <span>+91 98101 23456 (Mon - Sat)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-solar-400" />
                  <span>support@sunpowersolutions.in</span>
                </li>
                <li className="pt-2">
                  <a
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white transition-colors"
                  >
                    <span>Employee & Staff ERP Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} SunPower Solutions EPC Pvt. Ltd. All rights reserved.</p>
            <p>Designed for residential, housing society, and commercial rooftop solar installations.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
