import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  'customers': 'Customers & Leads',
  'quotations': 'Quotations & Orders',
  'surveys': 'Site Surveys',
  'installations': 'Installations',
  'service-tickets': 'Service & Maintenance',
  'inventory': 'Warehouse Inventory',
  'dispatch': 'Dispatch & Serial Tracking',
  'warranties': 'Warranty Registry',
  'finance': 'Finance & Cashflow',
  'reports': 'Reports & Analytics',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-xs text-slate-500" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center hover:text-solar-800 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>ERP</span>
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = pathLabels[segment] || segment;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{label}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-solar-800 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
