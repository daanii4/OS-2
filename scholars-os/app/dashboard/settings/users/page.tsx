import { redirect } from 'next/navigation'

export default function LegacyUsersSettingsRedirect() {
  redirect('/dashboard/team')
}
