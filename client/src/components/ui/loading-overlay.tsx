interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subtitle?: string;
}

export default function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  subtitle = "Please wait" 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="glass-strong rounded-3xl p-8 mx-4 max-w-sm w-full">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-ios-blue animate-spin"></div>
          </div>
          
          {/* Message */}
          <h3 className="text-white text-lg font-semibold mb-2" data-testid="text-loading-message">
            {message}
          </h3>
          <p className="text-white/70 text-sm" data-testid="text-loading-subtitle">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}