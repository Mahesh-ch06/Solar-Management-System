import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Clock, Layers, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModulePlaceholderProps {
  moduleName: string;
  modulePhase?: string;
  description: string;
  features: string[];
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderProps> = ({
  moduleName,
  modulePhase = 'Phase 3: Business Modules',
  description,
  features,
}) => {
  const { showToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {moduleName}
            </h1>
            <Badge variant="amber" size="sm">
              <Clock className="w-3 h-3 mr-1" />
              {modulePhase}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Feature Blueprint Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-solar-100 text-solar-800 rounded-2xl shrink-0">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Module Architecture & Implementation Roadmap
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                The foundation, typography, design system tokens, and API service interfaces for this
                module have been configured. The full business module workflow will be implemented in
                its dedicated feature branch.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Planned Enterprise Capabilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-solar-600 mt-1.5 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  showToast(
                    'Feature Branch Ready',
                    `Feature branch for ${moduleName} is mapped and ready for Phase 3 implementation.`,
                    'info'
                  )
                }
              >
                Inspect Module Schema
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
