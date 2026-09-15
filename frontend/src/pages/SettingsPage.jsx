import { usePreferences } from '../context/PreferenceContext';

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        {description && <p className="text-xs text-ink-500">{description}</p>}
      </div>
      <span className="relative mt-1 inline-block h-5 w-9 shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-ink-200 transition-colors peer-checked:bg-ink-700" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">Personalize how SmartEdu Tracker looks and notifies you. Preferences are saved to your account.</p>
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold text-ink-900">Appearance</h3>
        <div>
          <label className="label">Theme</label>
          <div className="flex gap-2">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                onClick={() => updatePreferences({ theme: t })}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize ${
                  preferences.theme === t ? 'border-ink-700 bg-ink-800 text-white' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Display Density</label>
          <div className="flex gap-2">
            {['comfortable', 'compact'].map((d) => (
              <button
                key={d}
                onClick={() => updatePreferences({ density: d })}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize ${
                  preferences.density === d ? 'border-ink-700 bg-ink-800 text-white' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card divide-y divide-ink-50 p-6">
        <h3 className="mb-1 font-semibold text-ink-900">Notification Preferences</h3>
        <Toggle
          checked={preferences.notifications.riskChanges}
          onChange={(v) => updatePreferences({ notifications: { ...preferences.notifications, riskChanges: v } })}
          label="Risk level changes"
          description="Notify me when my risk level changes or a student I'm assigned to becomes high risk."
        />
        <Toggle
          checked={preferences.notifications.interventions}
          onChange={(v) => updatePreferences({ notifications: { ...preferences.notifications, interventions: v } })}
          label="Interventions"
          description="Notify me about new interventions and follow-up outcomes."
        />
        <Toggle
          checked={preferences.notifications.followUps}
          onChange={(v) => updatePreferences({ notifications: { ...preferences.notifications, followUps: v } })}
          label="Follow-ups"
          description="Notify me about upcoming or overdue follow-ups."
        />
      </div>

      <button onClick={resetPreferences} className="btn-secondary">Reset to defaults</button>
    </div>
  );
}
