import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SunMedium, Menu, X, ArrowRight, ShieldCheck, Search, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { getStoredCustomerSession } from '../CustomerAuthPage';
import { Customer } from '../../../types/customer';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setCustomer(getStoredCustomerSession());
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform">
              <SunMedium className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SunPower <span className="text-solar-400 font-semibold">Solutions</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-none">
                Govt. Empanelled Solar EPC
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              onClick={() => scrollToSection('solutions')}
              className="hover:text-solar-400 transition-colors cursor-pointer"
            >
              What We Do
            </button>
            <button
              onClick={() => scrollToSection('process')}
              className="hover:text-solar-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('subsidy')}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-amber-300"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              PM Surya Ghar Subsidy
            </button>
            <button
              onClick={() => scrollToSection('calculator')}
              className="hover:text-solar-400 transition-colors cursor-pointer"
            >
              Savings Calculator
            </button>
            <Link
              to="/portal"
              className="hover:text-solar-400 transition-colors flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <Search className="w-3.5 h-3.5 text-solar-400" />
              Track Project
            </Link>
          </nav>

          {/* Desktop Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {customer ? (
              <Link to="/portal">
                <Button variant="outline" size="sm" className="border-solar-500/30 text-solar-300 hover:bg-slate-800" leftIcon={<User className="w-3.5 h-3.5 text-solar-400" />}>
                  My Project
                </Button>
              </Link>
            ) : (
              <Link to="/customer/login">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                  Customer Sign In
                </Button>
              </Link>
            )}

            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                Staff ERP
              </Button>
            </Link>

            <button
              onClick={() => scrollToSection('quote-form')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-solar-600 hover:bg-solar-500 text-white text-xs font-bold shadow-md hover:shadow-solar-500/20 transition-all cursor-pointer"
            >
              Get Free Quote
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link to="/portal" className="p-2 text-slate-400 hover:text-white">
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => scrollToSection('solutions')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-solar-400"
          >
            What We Do
          </button>
          <button
            onClick={() => scrollToSection('process')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-solar-400"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('subsidy')}
            className="block w-full text-left py-2 text-sm font-medium text-amber-300 hover:text-amber-200"
          >
            PM Surya Ghar Subsidy Guide
          </button>
          <button
            onClick={() => scrollToSection('calculator')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-solar-400"
          >
            Solar Savings Calculator
          </button>
          <Link
            to="/portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left py-2 text-sm font-medium text-solar-400 hover:text-solar-300"
          >
            Track My Installation & Subsidy Status
          </Link>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link
              to="/customer/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-lg bg-solar-600 hover:bg-solar-500 text-white text-sm font-bold text-center"
            >
              {customer ? 'My Solar Project' : 'Customer Sign In / Register'}
            </Link>
            <button
              onClick={() => scrollToSection('quote-form')}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold text-center border border-slate-700"
            >
              Book Free Site Survey
            </button>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 text-slate-400 text-xs font-semibold text-center hover:text-white"
            >
              Employee & Staff ERP Login &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
