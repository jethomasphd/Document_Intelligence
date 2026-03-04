import { useState } from 'react';
import clsx from 'clsx';
import DropZone from '../components/corpus/DropZone';
import FieldMapper from '../components/corpus/FieldMapper';
import EmbedProgress from '../components/corpus/EmbedProgress';

const STEPS = ['Upload', 'Configure', 'Embed'];

export default function CorpusNew() {
  const [step, setStep] = useState(0);
  const [rawData, setRawData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [config, setConfig] = useState({
    name: '',
    domain: '',
    fieldMap: { id: '', content: '', title: '', category: '' },
    categories: [],
    embeddingModel: 'voyage-3.5-lite',
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">New Corpus</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono',
                i < step && 'bg-accent-cyan text-bg-primary',
                i === step && 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan',
                i > step && 'bg-bg-raised text-text-muted'
              )}
            >
              {i + 1}
            </div>
            <span
              className={clsx(
                'text-sm',
                i === step ? 'text-text-primary' : 'text-text-muted'
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border-line mx-1" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <DropZone
          onDataParsed={(data, cols) => {
            setRawData(data);
            setColumns(cols);
            setStep(1);
          }}
        />
      )}
      {step === 1 && (
        <FieldMapper
          columns={columns}
          data={rawData}
          config={config}
          setConfig={setConfig}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <EmbedProgress
          rawData={rawData}
          config={config}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  );
}
