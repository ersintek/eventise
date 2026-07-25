import { cookies } from 'next/headers';
import { ProblemReporter } from '../components/problem-reporter';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get('eventise_session')?.value;
  let organizationId: string | undefined;

  if (token) {
    const response = await fetch(`${process.env.API_INTERNAL_URL}/api/organizations`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => null);
    if (response?.ok) {
      const organizations = await response.json() as Array<{ id: string }>;
      organizationId = organizations[0]?.id;
    }
  }

  return <>{children}{organizationId && <ProblemReporter organizationId={organizationId}/>}</>;
}
