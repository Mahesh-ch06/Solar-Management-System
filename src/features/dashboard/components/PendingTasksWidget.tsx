import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { PendingTask } from '../../../types/dashboard';
import { Clock, User, ArrowRight } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface PendingTasksWidgetProps {
  tasks: PendingTask[];
}

export const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({ tasks }) => {
  const { showToast } = useToast();

  const handleAction = (task: PendingTask) => {
    showToast(
      'Task Action Triggered',
      `Opening workflow for ${task.customerName}: "${task.title}"`,
      'info'
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Action Items & Blockers</CardTitle>
            <CardDescription>High-priority tasks requiring manager signoff</CardDescription>
          </div>
          <Badge variant="rose" size="sm">
            {tasks.filter((t) => t.priority === 'CRITICAL').length} Critical
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">{task.title}</span>
                  {task.priority === 'CRITICAL' && (
                    <Badge variant="rose" size="sm">Critical</Badge>
                  )}
                  {task.priority === 'HIGH' && (
                    <Badge variant="amber" size="sm">High</Badge>
                  )}
                  {task.priority === 'MEDIUM' && (
                    <Badge variant="sky" size="sm">Medium</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {task.customerName} ({task.systemSize})
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    Due: {task.dueDate}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <User className="w-3 h-3" />
                    {task.assignedTo}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => handleAction(task)}
                className="shrink-0 text-xs"
              >
                Resolve
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
