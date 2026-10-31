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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
              <SunMedium className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                SunPower <span className="text-amber-600 font-bold">Solutions</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600 leading-none">
                Govt. Empanelled Solar EPC
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => scrollToSection('solutions')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              What We Do
            </button>
            <button
              onClick={() => scrollToSection('process')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('subsidy')}
              className="hover:text-amber-700 transition-colors cursor-pointer flex items-center gap-1 text-amber-700 font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              PM Surya Ghar Subsidy
            </button>
            <button
              onClick={() => scrollToSection('calculator')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Savings Calculator
            </button>
            <Link
              to="/portal"
              className="hover:text-slate-900 transition-colors flex items-center gap-1 text-slate-600 font-semibold"
            >
              <Search className="w-3.5 h-3.5 text-amber-600" />
              Track Project
            </Link>
          </nav>

          {/* Desktop Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {customer ? (
              <Link to="/portal">
                <Button variant="outline" size="sm" className="border-amber-300 bg-amber-50 text-amber-900" leftIcon={<User className="w-3.5 h-3.5 text-amber-600" />}>
                  My Project
                </Button>
              </Link>
            ) : (
              <Link to="/customer/login">
                <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  Customer Sign In
                </Button>
              </Link>
            )}

            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 text-xs">
                Staff ERP
              </Button>
            </Link>

            <button
              onClick={() => scrollToSection('quote-form')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Get Free Quote
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link to="/portal" className="p-2 text-slate-500 hover:text-slate-900">
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <button
            onClick={() => scrollToSection('solutions')}
            className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-slate-950"
          >
            What We Do
          </button>
          <button
            onClick={() => scrollToSection('process')}
            className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-slate-950"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('subsidy')}
            className="block w-full text-left py-2 text-xs font-bold text-amber-700"
          >
            PM Surya Ghar Subsidy Guide
          </button>
          <button
            onClick={() => scrollToSection('calculator')}
            className="block w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-slate-950"
          >
            Solar Savings Calculator
          </button>
          <Link
            to="/portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left py-2 text-xs font-bold text-amber-600"
          >
            Track My Installation & Subsidy Status
          </Link>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <Link
              to="/customer/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold text-center"
            >
              {customer ? 'My Solar Project' : 'Customer Sign In / Register'}
            </Link>
            <button
              onClick={() => scrollToSection('quote-form')}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold text-center border border-slate-200"
            >
              Book Free Site Survey
            </button>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 text-slate-500 text-xs font-medium text-center hover:text-slate-800"
            >
              Employee & Staff ERP Login &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
