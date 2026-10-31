import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { TechnicianStatus } from '../../../types/dashboard';
import { Phone, MapPin, Wrench, Compass, Sun, CheckCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface TechnicianRosterWidgetProps {
  technicians: TechnicianStatus[];
}

export const TechnicianRosterWidget: React.FC<TechnicianRosterWidgetProps> = ({ technicians }) => {
  const [filter, setFilter] = useState<'ALL' | 'ON_FIELD' | 'AVAILABLE' | 'AT_WAREHOUSE'>('ALL');

  const filteredTechnicians = technicians.filter((tech) => {
    if (filter === 'ALL') return true;
    return tech.status === filter;
  });

  const onFieldCount = technicians.filter((t) => t.status === 'ON_FIELD').length;
  const availableCount = technicians.filter((t) => t.status === 'AVAILABLE').length;

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Field Technician Deployment</CardTitle>
            <Badge variant="solar" size="sm">
              {technicians.length} Technicians
            </Badge>
          </div>
          <CardDescription>
            Live status of rooftop teams: {onFieldCount} active on field, {availableCount} ready for dispatch
          </CardDescription>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilter('ALL')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all',
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            All ({technicians.length})
          </button>
          <button
            onClick={() => setFilter('ON_FIELD')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all',
              filter === 'ON_FIELD'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            On Field ({onFieldCount})
          </button>
          <button
            onClick={() => setFilter('AVAILABLE')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all',
              filter === 'AVAILABLE'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Available ({availableCount})
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filteredTechnicians.map((tech) => {
            return (
              <div
                key={tech.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    {tech.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {tech.name}
                      </span>
                      {tech.status === 'ON_FIELD' && (
                        <Badge variant="emerald" size="sm" dot>
                          On Site
                        </Badge>
                      )}
                      {tech.status === 'AVAILABLE' && (
                        <Badge variant="sky" size="sm" dot>
                          Available
                        </Badge>
                      )}
                      {tech.status === 'AT_WAREHOUSE' && (
                        <Badge variant="amber" size="sm" dot>
                          At Warehouse
                        </Badge>
                      )}
                      {tech.status === 'ON_LEAVE' && (
                        <Badge variant="slate" size="sm">
                          On Leave
                        </Badge>
                      )}
                    </div>

                    {tech.currentProject ? (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          {tech.currentProject.stage === 'INSTALLATION' && (
                            <Sun className="w-3.5 h-3.5 text-solar-700" />
                          )}
                          {tech.currentProject.stage === 'SURVEY' && (
                            <Compass className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          {tech.currentProject.stage === 'SERVICE' && (
                            <Wrench className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {tech.currentProject.customerName} ({tech.currentProject.capacityKW} kW)
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {tech.currentProject.location}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tech.status === 'AVAILABLE'
                          ? 'Ready for dispatch'
                          : tech.status === 'AT_WAREHOUSE'
                          ? 'Loading equipment / pre-assembly'
                          : 'Off duty'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] text-slate-400 block">Completed Today</span>
                    <span className="text-xs font-semibold text-slate-700 flex items-center justify-end gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      {tech.completedTodayCount} tasks
                    </span>
                  </div>

                  <a
                    href={`tel:${tech.phone}`}
                    className="p-2 text-slate-500 hover:text-solar-800 hover:bg-solar-50 border border-slate-200 rounded-lg transition-colors"
                    title={`Call ${tech.name} (${tech.phone})`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
