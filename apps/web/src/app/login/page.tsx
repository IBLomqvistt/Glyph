import { DemoAuthForm } from '@/components/demo-auth-form'

export default async function DemoLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<React.JSX.Element> {
  const query = await searchParams
  return (
    <DemoAuthForm initialMode={query.mode === 'signup' ? 'signup' : 'login'} />
  )
}
