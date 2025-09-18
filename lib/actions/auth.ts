"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(email: string, password: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
      },
    });

    if (error) {
      console.error('SignUp error:', error);
      return { error: error.message };
    }
    return { success: true, user: data.user };
  } catch (error) {
    console.error('SignUp unexpected error:', error);
    return { error: 'An unexpected error occurred during sign up' };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('SignIn error:', error);
      return { error: error.message };
    }
    return { success: true, user: data.user };
  } catch (error) {
    console.error('SignIn unexpected error:', error);
    return { error: 'An unexpected error occurred during sign in' };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/login");
  } catch (error) {
    console.error('SignOut error:', error);
    redirect("/auth/login");
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('GetCurrentUser error:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('GetCurrentUser unexpected error:', error);
    return null;
  }
}

// Create company + owner membership after signup; company starts pending
export async function createCompanyAndOwner(params: {
  companyName: string;
  companyWebsite?: string;
  companyEmail: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}) {
  const supabase = await createClient();
  // Ensure there is an authenticated user context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Create company (pending)
  const { data: company, error: cErr } = await supabase
    .from('companies')
    .insert({
      company_name: params.companyName,
      company_email: params.companyEmail,
      company_address: '',
      owner_id: user.id,
      status: 'pending'
    })
    .select('id')
    .single();
  if (cErr) {
    console.error('createCompany error', cErr);
    return { error: cErr.message };
  }

  // Create membership as owner
  const { data: role } = await supabase.from('roles').select('id').eq('name', 'owner').maybeSingle();
  if (!role?.id) {
    return { error: 'Owner role missing' };
  }
  const { error: mErr } = await supabase
    .from('memberships')
    .insert({ user_id: user.id, role_id: role.id, company_id: company.id });
  if (mErr) {
    console.error('createMembership error', mErr);
    return { error: mErr.message };
  }

  // TODO: queue emails: notify super admin; send user confirmation/thanks
  return { success: true, companyId: company.id };
}

// Admin-only: approve company
export async function approveCompany(companyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Ensure caller is super_admin
  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_super_admin', { p_user_id: user.id });
  if (adminErr || !isAdmin) return { error: 'Forbidden' };

  const { error } = await supabase
    .from('companies')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user.id })
    .eq('id', companyId);
  if (error) return { error: error.message };
  return { success: true };
} 