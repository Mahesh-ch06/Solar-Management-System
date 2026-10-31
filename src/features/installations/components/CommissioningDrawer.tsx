import React, { useState, useRef } from 'react';
import { InstallationJob, InstallationChecklist } from '../../../types/installation';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../context/ToastContext';
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Camera,
  Star,
  PenTool,
  RotateCcw,
} from 'lucide-react';

interface CommissioningDrawerProps {
  job: InstallationJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitCommissioning: (
    jobId: string,
    checklist: InstallationChecklist,
    signature: string,
    rating?: number,
    feedback?: string
  ) => Promise<void>;
}

export const CommissioningDrawer: React.FC<CommissioningDrawerProps> = ({
  job,
  isOpen,
  onClose,
  onSubmitCommissioning,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checklist states
  const [checklist, setChecklist] = useState<InstallationChecklist>({
    structureAnchoringChecked: true,
    panelMountingTightened: true,
    dcPolarityVerified: true,
    dcStringVocVolts: 360,
    inverterWallMounted: true,
    acDcdbInstalled: true,
    earthResistanceOhms: 2.8,
    lightningArresterConnected: true,
    generationTestWatts: 3800,
    customerBriefed: true,
  });

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('Installation completed cleanly. Solar generation verified.');
  const [signatureName, setSignatureName] = useState('');
  const [isSigned, setIsSigned] = useState(false);

  // Canvas for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  React.useEffect(() => {
    if (job) {
      setSignatureName(job.customerName);
      setChecklist(job.checklist || {
        structureAnchoringChecked: true,
        panelMountingTightened: true,
        dcPolarityVerified: true,
        dcStringVocVolts: 360,
        inverterWallMounted: true,
        acDcdbInstalled: true,
        earthResistanceOhms: 2.8,
        lightningArresterConnected: true,
        generationTestWatts: job.capacityKW * 850,
        customerBriefed: true,
      });
      setIsSigned(false);
    }
  }, [job]);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsSigned(true);
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setIsSigned(false);
  };

  const handleSubmit = async () => {
    if (!job) return;

    if (checklist.earthResistanceOhms >= 5) {
      showToast('Validation Error', 'Earth resistance must be < 5 Ohms before energization', 'error');
      return;
    }

    if (checklist.generationTestWatts <= 0) {
      showToast('Validation Error', 'Record positive generation power test reading in Watts', 'error');
      return;
    }

    if (!isSigned && !signatureName) {
      showToast('Signature Required', 'Please have customer sign on screen or enter confirmation', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const signaturePayload = isSigned ? `Digital Touch Signature (${signatureName})` : signatureName;
      await onSubmitCommissioning(job.id, checklist, signaturePayload, rating, feedback);
      showToast(
        'System Commissioned!',
        `${job.customerName}'s ${job.capacityKW} kW system energized. ICR generated.`,
        'success'
      );
      onClose();
    } catch {
      showToast('Commissioning Error', 'Failed to submit commissioning report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Rooftop Commissioning & Signoff"
      description={`Mobile-ready completion protocol for ${job.customerName} (${job.capacityKW} kW ${job.systemType})`}
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Commission System & Generate ICR
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Job Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">{job.jobCode}</span>
              <Badge variant="emerald" size="sm">
                {job.capacityKW} kW {job.systemType}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{job.customerName}</h3>
            <p className="text-xs text-slate-500">{job.siteAddress}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block">Lead Field Engineer</span>
            <span className="text-xs font-semibold text-slate-800">{job.leadTechnicianName}</span>
          </div>
        </div>

        {/* Section 1: Rooftop Safety & Electrical Checklist */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Technical Verification Checklist
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                key: 'structureAnchoringChecked',
                label: 'Structure Anchor Bolts Torqued & Waterproofed',
              },
              {
                key: 'panelMountingTightened',
                label: 'Solar Panels Clamped with Mid & End Clamps',
              },
              {
                key: 'dcPolarityVerified',
                label: 'DC Polarity (+/-) & MC4 Crimp Verified',
              },
              {
                key: 'inverterWallMounted',
                label: 'Inverter Securely Mounted with Heat Dissipation',
              },
              {
                key: 'acDcdbInstalled',
                label: 'ACDB & DCDB with SPD & MCB Protection Fitted',
              },
              {
                key: 'lightningArresterConnected',
                label: 'Lightning Arrester Bonded to Separate Earth Pit',
              },
              {
                key: 'customerBriefed',
                label: 'Homeowner Briefed on Safety & App Monitoring',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs select-none transition-colors"
              >
                <input
                  type="checkbox"
                  checked={Boolean((checklist as unknown as Record<string, unknown>)[item.key])}
                  onChange={(e) =>
                    setChecklist({ ...checklist, [item.key]: e.target.checked })
                  }
                  className="mt-0.5 rounded text-solar-800 focus:ring-solar-500"
                />
                <span className="text-slate-800 font-medium leading-snug">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Generation & Resistance Measurements */}
        <div className="bg-solar-50/60 border border-solar-200/80 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-solar-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-solar-700" />
              Live Electrical Test Readings
            </h4>
            <span className="text-[11px] text-solar-700 font-medium">DISCOM Net-Metering Spec</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="DC String Voc (Volts)"
              type="number"
              value={checklist.dcStringVocVolts}
              onChange={(e) =>
                setChecklist({ ...checklist, dcStringVocVolts: Number(e.target.value) })
              }
              helperText="Typical 300–450V DC"
            />
            <div>
              <Input
                label="Earth Resistance (Ω)"
                type="number"
                step="0.1"
                value={checklist.earthResistanceOhms}
                onChange={(e) =>
                  setChecklist({ ...checklist, earthResistanceOhms: Number(e.target.value) })
                }
                helperText="Must be < 5.0 Ohms"
                error={checklist.earthResistanceOhms >= 5 ? 'High resistance! Must be < 5Ω' : undefined}
              />
            </div>
            <Input
              label="Live Generation (Watts)"
              type="number"
              value={checklist.generationTestWatts}
              onChange={(e) =>
                setChecklist({ ...checklist, generationTestWatts: Number(e.target.value) })
              }
              helperText="Tested on-site with solar irradiance"
            />
          </div>
        </div>

        {/* Section 3: Commissioning Photographs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Installation Photographs
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Captured via technician mobile app</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                title: 'Rooftop Panels',
                url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=300',
              },
              {
                title: 'Inverter & ACDB',
                url: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=300',
              },
              {
                title: 'Bi-Directional Meter',
                url: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=300',
              },
            ].map((photo, i) => (
              <div key={i} className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-semibold text-white truncate">{photo.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Customer Touchscreen Signature & Acceptance */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-solar-800" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Homeowner Handover & Digital Signature
              </h4>
            </div>
            {isSigned && (
              <Badge variant="emerald" size="sm">
                Signed on Screen
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            I confirm that the solar rooftop system ({job.capacityKW} kW) has been installed, tested in
            my presence, generating power, and all work is completed to my satisfaction.
          </p>

          {/* Interactive Touch/Mouse Canvas Signature */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Sign inside the box below:</span>
              <button
                type="button"
                onClick={handleClearSignature}
                className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Signature
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 touch-none">
              <canvas
                ref={canvasRef}
                width={500}
                height={120}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleEndDraw}
                onMouseLeave={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDraw}
                onTouchEnd={handleEndDraw}
                className="w-full h-28 cursor-crosshair"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Input
              label="Signatory Full Name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g. Rajesh Malhotra"
            />
            <div>
              <label className="text-xs font-semibold text-slate-700 select-none block mb-1.5">
                Customer Rating
              </label>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-600 ml-2">{rating}/5 Stars</span>
              </div>
            </div>
          </div>

          <Input
            label="Customer Feedback / Testimonial"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add any remarks from customer..."
          />
        </div>
      </div>
    </Drawer>
  );
};
