export default function PreferencesSettingsPage() {
  return (
    <div className="os-card">
      <h1 className="os-title">Preferences</h1>
      <p className="os-body mt-2 text-[var(--text-secondary)]">
        Default session duration and format are saved with PATCH <code className="text-sm">/api/settings/preferences</code>.
      </p>
    </div>
  )
}
