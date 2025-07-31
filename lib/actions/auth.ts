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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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