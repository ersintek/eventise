import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProblemReporter } from '../components/problem-reporter';
import { TourRedirector } from '../components/product-tour';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get('eventise_session')?.value;
  let organizationId: string | undefined;

  if (token) {
    const response = await fetch(`${process.env.API_INTERNAL_URL}/api/organizations`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => null);
    if (response?.ok) {
      const organizations = await response.json() as Array<{ id: string; requiresOrganizationTerms?: boolean }>;
      organizationId = organizations[0]?.id;
      if (organizations[0]?.requiresOrganizationTerms) redirect(`/legal/organization?organizationId=${organizations[0].id}`);
    }
  }

  return <>{children}<TourRedirector />{organizationId && <ProblemReporter organizationId={organizationId}/>}</>;
}
