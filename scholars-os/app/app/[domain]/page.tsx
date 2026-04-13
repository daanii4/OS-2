import { redirect } from 'next/navigation'

type TenantEntryPageProps = {
  params: Promise<{ domain: string }>
}

export default async function TenantEntryPage({ params }: TenantEntryPageProps) {
  await params
  redirect('/dashboard')
}
