import RiskBadge from './RiskBadge';
import HelpTip from './HelpTip';

export default function RiskCard({ risk }) {
  if (!risk) {
    return (
      <div className="card p-6">
        <p className="text-sm text-ink-500">No risk assessment available yet.</p>
      </div>
    );
  }
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Overall Academic Risk
            <HelpTip text="Calculated from your attendance, academic performance, assignment completion and performance trend — never guessed or hardcoded." />
          </p>
          <p className="mt-1 text-4xl font-display font-semibold text-ink-900">{risk.totalRiskScore}<span className="text-lg text-ink-400"> / 100</span></p>
        </div>
        <RiskBadge level={risk.riskLevel} size="lg" />
      </div>
      <p className="mt-3 text-xs text-ink-400">
        Calculated {new Date(risk.createdAt).toLocaleString()} · Rule-Based Risk Scoring Engine v{risk.calculationVersion}
      </p>
    </div>
  );
}
