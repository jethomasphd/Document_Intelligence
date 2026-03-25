export default function StepGuide({ steps, currentStep }) {
  return (
    <div className="bg-bg-raised/50 border border-border-line rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-6 h-6 rounded-full bg-accent-cyan/20 flex items-center justify-center mt-0.5">
          <span className="text-accent-cyan text-xs font-mono font-medium">{currentStep}</span>
        </div>
        <div>
          <p className="text-text-primary text-sm font-medium mb-1">{steps[currentStep - 1]?.title}</p>
          <p className="text-text-muted text-xs leading-relaxed">{steps[currentStep - 1]?.description}</p>
        </div>
      </div>
      <div className="flex gap-1 mt-3 ml-9">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < currentStep ? 'bg-accent-cyan' : 'bg-border-line'}`}
          />
        ))}
      </div>
    </div>
  );
}
