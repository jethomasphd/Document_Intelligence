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
    timers.push(setTimeout(() => setPhase(1), 2800));
    timers.push(setTimeout(() => setPhase(2), 5200));
    timers.push(setTimeout(() => setShowCTA(true), 7000));
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
          You manage documents one at a time &mdash; but you've never seen what they mean <em>as a collection</em>.
        </p>

        <p className={`text-xl md:text-2xl text-text-primary leading-relaxed font-light transition-opacity duration-1500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          Your best content clusters in specific regions of semantic space. Its neighbors are your next best content &mdash; and the gaps are your biggest opportunities.
        </p>

        <p className={`text-2xl md:text-3xl text-accent-cyan font-semibold transition-opacity duration-1500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          See the structure. Target the gaps. Generate what's missing.
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
          Get Started
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
