export default function AccountSettingsPage() {
  return (
    <div className="os-card">
      <h1 className="os-title">Account</h1>
      <p className="os-body mt-2 text-[var(--text-secondary)]">
        Update your name and email via PATCH <code className="text-sm">/api/settings/account</code>. Password changes use
        Supabase from the client.
      </p>
    </div>
  )
}
