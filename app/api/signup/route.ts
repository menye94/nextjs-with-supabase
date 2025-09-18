import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { email, password, companyName, companyEmail, companyWebsite } = await req.json();
    if (!email || !password || !companyName || !companyEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create auth user with email_confirmed_at NULL
    const { data: userData, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // ensures email_confirmed_at stays NULL
    });
    if (userErr || !userData?.user) {
      console.error('User creation error:', userErr);
      return NextResponse.json({ error: userErr?.message || 'Failed to create user' }, { status: 400 });
    }

    const user = userData.user;

    // Send confirmation email using admin
    const { error: emailErr } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
      },
    });
    if (emailErr) {
      console.error('Email generation error:', emailErr);
      // Don't fail the signup if email fails, just log it
    }

    // Create company immediately (pending)
    const { data: companyData, error: cErr } = await admin.from('companies').insert({
      company_name: companyName,
      company_email: companyEmail,
      company_address: '',
      owner_id: user.id,
      status: 'pending',
      company_website: companyWebsite || null
    }).select('id').single();
    if (cErr) {
      console.error('Company creation error:', cErr);
      return NextResponse.json({ error: cErr.message }, { status: 400 });
    }

    // Create owner membership for the user
    const { error: mErr } = await admin.from('memberships').insert({
      user_id: user.id,
      role_id: 2, // Assuming role_id 2 is "Owner" - adjust if needed
      company_id: companyData.id
    });
    if (mErr) {
      console.error('Membership creation error:', mErr);
      // Don't fail the signup if membership fails, just log it
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (e: any) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
