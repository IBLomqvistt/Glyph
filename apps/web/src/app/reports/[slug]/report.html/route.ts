import { redirect } from 'next/navigation'

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<never> {
  const { slug } = await context.params
  redirect(`/reports/${slug}`)
}
