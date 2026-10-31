import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { RecentActivity } from '../../../types/dashboard';
import { formatDateTime } from '../../../utils/formatters';

interface RecentActivitiesListProps {
  activities: RecentActivity[];
}

export const RecentActivitiesList: React.FC<RecentActivitiesListProps> = ({ activities }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Recent Activity Stream</CardTitle>
          <CardDescription>Real-time audit log of surveys, dispatches, and installations</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-slate-100">
          {activities.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant={item.badgeType} size="sm">
                  {item.type}
                </Badge>
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(item.timestamp)}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <span>By:</span>
                <span className="font-medium text-slate-600">{item.user}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
