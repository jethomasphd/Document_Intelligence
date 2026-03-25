import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STAGES = [
  {
    text: 'You have a thousand documents.\nWhat do they mean together?',
    opacity: 'opacity-0',
    delay: 500,
  },
  {
    text: 'Every document is a point in space.\nSimilar meaning, similar position.',
    opacity: 'opacity-0',
    delay: 3500,
  },
  {
    text: 'Now you can see the shape of meaning.\nNavigate it. Compare it. Generate from it.',
    opacity: 'opacity-0',
    delay: 6500,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(-1);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    // Check if user has seen the landing before
    const seen = sessionStorage.getItem('di_landing_seen');
    if (seen) {
      navigate('/home', { replace: true });
      return;
    }

    const timers = [];
    timers.push(setTimeout(() => setPhase(0), 500));
    timers.push(setTimeout(() => setPhase(1), 3500));
    timers.push(setTimeout(() => setPhase(2), 6500));
    timers.push(setTimeout(() => setShowCTA(true), 9000));
    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  const enter = () => {
    sessionStorage.setItem('di_landing_seen', 'true');
    navigate('/home');
  };

  return (
    <div
      className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 cursor-pointer"
      onClick={showCTA ? enter : undefined}
    >
      <div className="max-w-2xl text-center space-y-10">
        {STAGES.map((stage, i) => (
          <p
            key={i}
            className={`text-xl md:text-2xl leading-relaxed font-light transition-opacity duration-1500 whitespace-pre-line ${
              phase >= i ? 'opacity-100 text-text-primary' : 'opacity-0 text-text-primary'
            }`}
          >
            {stage.text}
          </p>
        ))}
      </div>

      <div
        className={`mt-16 transition-all duration-1000 ${
          showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <button
          onClick={enter}
          className="bg-accent-cyan text-bg-primary px-10 py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          Enter Document Intelligence
        </button>
        <p className="text-text-muted text-sm mt-4 text-center">
          Semantic corpus analysis and generative document synthesis
        </p>
      </div>

      {/* Skip link */}
      <button
        onClick={enter}
        className="absolute top-6 right-6 text-text-muted text-xs hover:text-text-primary transition-colors"
      >
        Skip intro
      </button>
    </div>
  );
}
