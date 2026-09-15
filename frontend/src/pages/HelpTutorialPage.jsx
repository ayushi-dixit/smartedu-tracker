import { useState } from 'react';
import TutorialModal, { TUTORIAL_STEPS } from '../components/TutorialModal';

const QUICK_GUIDES = [
  { title: 'Understanding Risk Score', body: 'Your risk score (0–100) is a weighted combination of your attendance, academic average, assignment completion, and performance trend. Higher means more risk.' },
  { title: 'Understanding Risk Level', body: 'Scores under 40 are Low risk, 40 up to 65 are Medium risk, and 65 and above are High risk. These thresholds are fixed and applied the same way for everyone.' },
  { title: 'Attendance Risk', body: 'Calculated as 100 minus your overall attendance percentage across all subjects. Lower attendance means higher attendance risk.' },
  { title: 'Academic Risk', body: 'Calculated as 100 minus your academic average across all recorded assessments. It carries the largest weight (35%) in your overall score.' },
  { title: 'Assignment Risk', body: 'Calculated as 100 minus your assignment completion percentage — how many assignments you submitted out of the total assigned.' },
  { title: 'Performance Trend', body: 'Compares your earliest and most recent internal assessment scores to see whether you are improving, declining, or staying stable.' },
  { title: 'AI Recommendations', body: 'An AI model reads your already-calculated risk factors and explains them in plain language with suggested next steps. It never changes your risk score.' },
  { title: 'Interventions', body: 'An intervention is an action a faculty member takes to support you — like a counselling session — recorded with a type, reason, status, and follow-up.' },
  { title: 'What-if Simulator', body: 'Lets you try hypothetical attendance, marks, or assignment numbers to see how your risk might change. It never modifies your real records.' },
];

export default function HelpTutorialPage() {
  const [tourOpen, setTourOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Help & Tutorial</h1>
        <p className="text-sm text-ink-500">Replay the guided tour anytime, or browse quick guides below.</p>
      </div>

      <div className="card flex items-center justify-between p-6">
        <div>
          <p className="font-medium text-ink-900">Guided Tour</p>
          <p className="text-sm text-ink-500">{TUTORIAL_STEPS.length} short steps covering the whole app.</p>
        </div>
        <button onClick={() => setTourOpen(true)} className="btn-primary">Start Guided Tour</button>
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold text-ink-900">Quick Guides</h3>
        <div className="divide-y divide-ink-50">
          {QUICK_GUIDES.map((g, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenGuide(openGuide === i ? null : i)}
                className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-ink-900"
              >
                {g.title}
                <span className="text-ink-400">{openGuide === i ? '−' : '+'}</span>
              </button>
              {openGuide === i && <p className="pb-3 text-sm text-ink-600">{g.body}</p>}
            </div>
          ))}
        </div>
      </div>

      <TutorialModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
