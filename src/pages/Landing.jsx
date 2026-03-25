import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(-1);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('di_landing_seen');
    if (seen) {
      navigate('/home', { replace: true });
      return;
    }

    const timers = [];
    timers.push(setTimeout(() => setPhase(0), 400));
    timers.push(setTimeout(() => setPhase(1), 3200));
    timers.push(setTimeout(() => setPhase(2), 6000));
    timers.push(setTimeout(() => setShowCTA(true), 8500));
    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  const enter = () => {
    sessionStorage.setItem('di_landing_seen', 'true');
    navigate('/home');
  };

  return (
    <div
      className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6"
      onClick={showCTA ? enter : undefined}
    >
      <div className="max-w-2xl text-center space-y-8">
        <p className={`text-lg md:text-xl text-text-muted leading-relaxed transition-opacity duration-1500 ${phase >= 0 ? 'opacity-100' : 'opacity-0'}`}>
          You have thousands of documents. Somewhere inside them is a pattern:
          what works, what doesn't, and why. But that pattern is invisible
          when you're reading one file at a time.
        </p>

        <p className={`text-xl md:text-2xl text-text-primary leading-relaxed font-light transition-opacity duration-1500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          What if you could stop reading your content and start <em>seeing</em> it?
        </p>

        <p className={`text-lg md:text-xl text-text-muted leading-relaxed transition-opacity duration-1500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          Document Intelligence maps everything you've written into a single landscape.
          High performers cluster together.
          Gaps appear where nothing exists yet.
          The next thing worth creating becomes obvious.
        </p>
      </div>

      <div
        className={`mt-14 transition-all duration-1000 ${
          showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <button
          onClick={enter}
          className="bg-accent-cyan text-bg-primary px-10 py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Start Seeing
        </button>
      </div>

      <button
        onClick={enter}
        className="absolute top-6 right-6 text-text-muted text-xs hover:text-text-primary transition-colors"
      >
        Skip
      </button>
    </div>
  );
}
