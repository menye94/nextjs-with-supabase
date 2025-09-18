import { createClient } from '@/lib/supabase/client';

export type PermissionName =
  | 'super_admin'
  | 'customers.read'
  | 'customers.write'
  | 'customers.delete'
  | 'agents.read'
  | 'agents.write'
  | 'agents.delete';

export async function hasPermission(perm: PermissionName, companyId: string | null): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('has_perm', {
    p_user_id: user.id,
    p_company_id: companyId,
    p_perm: perm,
  });

  if (error) {
    console.warn('hasPermission error', { perm, companyId, error });
    return false;
  }
  return Boolean(data);
}

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc('is_super_admin', { p_user_id: user.id });
  if (error) return false;
  return Boolean(data);
}
