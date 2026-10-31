import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
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
    <Card className="bg-white border-slate-200 text-slate-900 p-6 sm:p-10 shadow-xl rounded-3xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            PM Surya Ghar Subsidy Calculator
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Calculate Your Solar Savings & Govt. Grant
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Move the slider to your average monthly electricity bill. See your recommended system size, government DBT grant, and 25-year return on investment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Your Monthly Electricity Bill</span>
                <span className="text-lg font-black text-amber-600 font-mono">
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
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono font-medium">
                <span>₹1,500</span>
                <span>₹7,500</span>
                <span>₹15,000+</span>
              </div>
            </div>

            {/* Quick Capacity Recommendation Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Recommended System</p>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    {calculations.recommendedKW} kW Rooftop System
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 font-medium">Roof Area Required</p>
                <p className="text-xs font-bold text-slate-800">~{calculations.requiredRoofSqFt} sq. ft.</p>
              </div>
            </div>

            {/* Government Subsidy Callout */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 shadow-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Govt. PM Surya Ghar DBT Subsidy
                  </p>
                  <p className="text-2xl font-black text-amber-700 font-mono mt-0.5">
                    {formatCurrency(calculations.governmentSubsidy)}
                  </p>
                  <p className="text-[11px] text-amber-900/80 mt-1 leading-relaxed">
                    Credited directly to your verified bank account after joint DISCOM net-meter inspection.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Pricing Comparison Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <p className="text-[11px] text-slate-500 font-semibold">Estimated EPC Cost</p>
                <p className="text-base font-bold text-slate-400 line-through font-mono mt-0.5">
                  {formatCurrency(calculations.grossCost)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Full turnkey installation</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[11px] text-amber-800 font-bold">Govt. Direct Grant</p>
                <p className="text-base font-bold text-amber-600 font-mono mt-0.5">
                  - {formatCurrency(calculations.governmentSubsidy)}
                </p>
                <p className="text-[10px] text-amber-700 mt-1">PM Surya Ghar fund</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500 text-slate-950 shadow-sm border border-amber-400">
                <p className="text-[11px] text-amber-950 font-extrabold uppercase tracking-wider">Your Net Price</p>
                <p className="text-xl font-black text-slate-950 font-mono mt-0.5">
                  {formatCurrency(calculations.netInvestment)}
                </p>
                <p className="text-[10px] text-amber-950 font-semibold mt-1">All-inclusive after DBT</p>
              </div>
            </div>

            {/* ROI Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Monthly Savings</p>
                <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                  {formatCurrency(calculations.monthlySavings)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Annual Savings</p>
                <p className="text-sm font-bold text-sky-600 font-mono mt-0.5">
                  {formatCurrency(calculations.annualSavings)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
                  <Sun className="w-4 h-4" />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Payback Period</p>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  ~{calculations.paybackYears} Years
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
                  <Leaf className="w-4 h-4" />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500">CO₂ Offset / Year</p>
                <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                  {calculations.co2OffsetTonsPerYear} Tons
                </p>
              </div>
            </div>

            {/* Lifetime Benefit & CTA */}
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 text-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
                  Estimated 25-Year Net Clean Energy Return:
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-700 font-mono mt-0.5">
                  {formatCurrency(calculations.lifetimeSavings25Years)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplyNow}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
