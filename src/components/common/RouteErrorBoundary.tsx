import React from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = 'An unexpected application error occurred.';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {errorStatus === 404 ? 'Page Not Found' : 'Something Went Wrong'}
        </h1>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {errorStatus === 404
            ? "The page you are looking for doesn't exist or has been moved."
            : "The enterprise portal encountered an unhandled issue. Our engineering logging has captured the incident."}
        </p>

        {errorMessage && (
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left">
            <p className="text-xs font-mono text-slate-700 break-all">{errorMessage}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reload Page
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
