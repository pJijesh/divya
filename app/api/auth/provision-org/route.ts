import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils/slugify';

// Provisions an organization + admin membership for the current user,
// atomically from the caller's perspective, via the service-role client
// (RLS intentionally blocks regular users from inserting into
// `organizations` directly — see supabase/migrations/20261016000001).
// Idempotent: if the user already has any membership, this is a no-op.
// Called from app/signup (when email confirmation is disabled and a
// session exists immediately) and from app/auth/callback (after the
// confirmation link is clicked).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: existingMemberships, error: membershipLookupError } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (membershipLookupError) {
    return NextResponse.json({ error: membershipLookupError.message }, { status: 500 });
  }

  if (existingMemberships && existingMemberships.length > 0) {
    return NextResponse.json({ ok: true, alreadyProvisioned: true });
  }

  const pendingOrgName =
    typeof user.user_metadata?.pending_org_name === 'string' &&
    user.user_metadata.pending_org_name.trim().length > 0
      ? user.user_metadata.pending_org_name.trim()
      : 'My Organization';
  const fullName =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;

  const admin = createAdminClient();

  const baseSlug = slugify(pendingOrgName);
  let slug = baseSlug;
  let organizationId: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: pendingOrgName, slug })
      .select('id')
      .single();

    if (!orgError && org) {
      organizationId = org.id;
      break;
    }

    // 23505 = unique_violation on the slug column — retry with a suffix.
    if (orgError?.code === '23505') {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      continue;
    }

    return NextResponse.json(
      { error: orgError?.message ?? 'Failed to create organization' },
      { status: 500 },
    );
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: 'Could not allocate a unique organization slug' },
      { status: 500 },
    );
  }

  const { error: membershipError } = await admin.from('memberships').insert({
    organization_id: organizationId,
    user_id: user.id,
    role: 'admin',
    status: 'active',
  });

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: user.id, full_name: fullName }, { onConflict: 'id' });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, organizationId });
}
