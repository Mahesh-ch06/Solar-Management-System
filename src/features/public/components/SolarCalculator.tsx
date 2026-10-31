import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../utils/formatters';
import { Zap, IndianRupee, ShieldCheck, Sparkles, ArrowRight, Sun, Leaf } from 'lucide-react';

export const SolarCalculator: React.FC = () => {
  const [monthlyBill, setMonthlyBill] = useState<number>(4500);

  // Dynamic calculations based on MNRE PM Surya Ghar benchmark
  const calculations = useMemo(() => {
    // 1 kW rooftop produces approx. 120 kWh per month, offsetting ~₹900 of bill at average ₹7.5/kWh tariff
    const recommendedKW = Math.min(10, Math.max(1, Math.round(monthlyBill / 900)));
    const requiredRoofSqFt = recommendedKW * 90; // ~90 sq ft per kW

    // Gross EPC benchmark cost (~₹65,000/kW for Tier-1 Mono PERC + Inverter + Balance of System)
    const grossCost = recommendedKW * 65000;

    // PM Surya Ghar: Muft Bijli Yojana Central Government DBT Subsidy Structure
    // 1 kW = ₹30,000
    // 2 kW = ₹60,000
    // 3 kW and above = ₹78,000 (Maximum direct subsidy)
    let governmentSubsidy = 0;
    if (recommendedKW === 1) {
      governmentSubsidy = 30000;
    } else if (recommendedKW === 2) {
      governmentSubsidy = 60000;
    } else {
      governmentSubsidy = 78000;
    }

    const netInvestment = Math.max(0, grossCost - governmentSubsidy);
    const monthlySavings = Math.round(monthlyBill * 0.88); // 88% bill reduction
    const annualSavings = monthlySavings * 12;
    const paybackYears = (netInvestment / annualSavings).toFixed(1);
    const lifetimeSavings25Years = annualSavings * 25 - netInvestment;
    const co2OffsetTonsPerYear = (recommendedKW * 1.3).toFixed(1);

    return {
      recommendedKW,
      requiredRoofSqFt,
      grossCost,
      governmentSubsidy,
      netInvestment,
      monthlySavings,
      annualSavings,
      paybackYears,
      lifetimeSavings25Years,
      co2OffsetTonsPerYear,
    };
  }, [monthlyBill]);

  const handleApplyNow = () => {
    const quoteForm = document.getElementById('quote-form');
    if (quoteForm) {
      quoteForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 text-white p-6 sm:p-8 shadow-2xl rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-solar-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="amber" size="md" className="mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
            PM Surya Ghar Subsidy Calculator
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Calculate Your Solar Savings & Govt. Grant
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Move the slider to your average monthly electricity bill. See your recommended system size, government DBT grant, and 25-year return on investment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Your Monthly Electricity Bill</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {formatCurrency(monthlyBill)}/mo
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="15000"
                step="500"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-solar-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>₹1,500</span>
                <span>₹7,500</span>
                <span>₹15,000+</span>
              </div>
            </div>

            {/* Quick Capacity Recommendation Card */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-solar-500/20 text-solar-400 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300">Recommended System</p>
                  <p className="text-sm font-bold text-white font-mono">
                    {calculations.recommendedKW} kW Rooftop System
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Roof Area Required</p>
                <p className="text-xs font-bold text-slate-200">~{calculations.requiredRoofSqFt} sq. ft.</p>
              </div>
            </div>

            {/* Government Subsidy Callout */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-950/40 to-solar-950/40 border border-amber-500/30">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300">
                    Govt. PM Surya Ghar DBT Subsidy
                  </p>
                  <p className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
                    {formatCurrency(calculations.governmentSubsidy)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Credited directly to your verified bank account after joint DISCOM net-meter inspection.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Pricing Comparison Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="p-3 rounded-lg bg-slate-900/60">
                <p className="text-[11px] text-slate-400 font-medium">Estimated EPC Cost</p>
                <p className="text-base font-bold text-slate-300 line-through font-mono mt-0.5">
                  {formatCurrency(calculations.grossCost)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Full turnkey installation</p>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20">
                <p className="text-[11px] text-amber-300 font-medium">Govt. Direct Grant</p>
                <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                  - {formatCurrency(calculations.governmentSubsidy)}
                </p>
                <p className="text-[10px] text-amber-200/60 mt-1">PM Surya Ghar fund</p>
              </div>

              <div className="p-3 rounded-lg bg-solar-950/50 border border-solar-500/30">
                <p className="text-[11px] text-solar-300 font-semibold">Your Net Price</p>
                <p className="text-lg font-black text-solar-400 font-mono mt-0.5">
                  {formatCurrency(calculations.netInvestment)}
                </p>
                <p className="text-[10px] text-solar-200/70 mt-1">All-inclusive after DBT</p>
              </div>
            </div>

            {/* ROI Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Monthly Savings</p>
                <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  {formatCurrency(calculations.monthlySavings)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-1.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Annual Savings</p>
                <p className="text-sm font-bold text-sky-400 font-mono mt-0.5">
                  {formatCurrency(calculations.annualSavings)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="w-7 h-7 rounded-full bg-solar-500/10 text-solar-400 flex items-center justify-center mx-auto mb-1.5">
                  <Sun className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Payback Period</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">
                  ~{calculations.paybackYears} Years
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
                  <Leaf className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">CO₂ Offset / Year</p>
                <p className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                  {calculations.co2OffsetTonsPerYear} Tons
                </p>
              </div>
            </div>

            {/* Lifetime Benefit & CTA */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">
                  Estimated 25-Year Net Clean Energy Return:
                </p>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  {formatCurrency(calculations.lifetimeSavings25Years)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplyNow}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-solar-600 hover:bg-solar-500 text-white text-xs font-bold shadow-lg hover:shadow-solar-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book Free Survey for {calculations.recommendedKW} kW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
