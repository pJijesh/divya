import { createClient } from '@/lib/supabase/server';

export type Role = 'admin' | 'editor' | 'viewer';

const ROLE_ORDER: Role[] = ['viewer', 'editor', 'admin'];

export function roleSatisfies(role: Role, minRole: Role): boolean {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(minRole);
}

export interface CurrentOrgMembership {
  userId: string;
  organizationId: string;
  role: Role;
}

// Resolves the signed-in user's organization context for Route Handlers.
// Phase 1 gives each user exactly one active membership (no org switcher
// yet), so "first active membership" is the working org everywhere.
// Real authorization still happens at the RLS layer — this exists for
// clean 401/403 responses and to avoid every route re-deriving org_id.
export async function getCurrentOrgMembership(): Promise<CurrentOrgMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return { userId: user.id, organizationId: data.organization_id, role: data.role as Role };
}

// Server Component convenience (AppHeader needs a name to display).
// Separate from getCurrentOrgMembership() rather than widening its return
// shape, since Route Handlers never need the name.
export async function getCurrentOrgName(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('memberships')
    .select('organization:organizations(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  return data?.organization?.name ?? null;
}
