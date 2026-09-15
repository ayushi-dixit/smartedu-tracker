import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const TUTORIAL_STEPS = [
  { title: 'Welcome to SmartEdu Tracker 👋', body: 'This quick tour walks through the main parts of the app so you know exactly where to find things.' },
  { title: 'Dashboard', body: 'Your dashboard shows your attendance, academic average, assignment completion, and current risk at a glance.' },
  { title: 'Academic Performance', body: 'See your full marks, attendance records, assignments, and history in one place, with charts.' },
  { title: 'Risk Assessment', body: 'A risk score (0–100) and level (Low / Medium / High) are calculated from your real academic data — never guessed.' },
  { title: 'Risk Factors', body: 'Every risk score breaks down into attendance, academic, assignment and trend factors, so you can see exactly why.' },
  { title: 'AI Recommendations', body: 'An AI explanation turns your risk factors into plain-language reasons and suggested next actions.' },
  { title: 'What-if Simulator', body: 'Try hypothetical numbers to see how your risk might change — this never touches your real records.' },
  { title: 'Notes & Notifications', body: 'Keep personal study notes, and get notified when your risk level changes or a faculty member takes action.' },
  { title: 'Help & Tutorial', body: 'You can replay this tour anytime, or browse quick guides, from Help & Tutorial in the sidebar.' },
];

export default function TutorialModal({ open, onClose }) {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);

  if (!open) return null;

  const isLast = step === TUTORIAL_STEPS.length - 1;
  const current = TUTORIAL_STEPS[step];

  async function finish() {
    await completeOnboarding();
    setStep(0);
    onClose();
  }

  async function skip() {
    await completeOnboarding();
    setStep(0);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
          Step {step + 1} of {TUTORIAL_STEPS.length}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink-900">{current.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{current.body}</p>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={skip} className="text-sm text-ink-400 hover:text-ink-600">Skip</button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="btn-secondary">Previous</button>
            )}
            {!isLast && <button onClick={() => setStep((s) => s + 1)} className="btn-primary">Next</button>}
            {isLast && <button onClick={finish} className="btn-primary">Finish</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
