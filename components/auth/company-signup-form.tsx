"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { createCompanyAndOwner } from "@/lib/actions/auth";

export function CompanySignUpForm() {
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [agree, setAgree] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isValid =
    companyName.trim() !== "" &&
    companyEmail.trim() !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    userEmail.trim() !== "" &&
    password.trim().length >= 8 &&
    password === confirmPassword &&
    agree;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    // Step 1: sign up auth user (server action)
    const signUpRes = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password, companyName, companyEmail, companyWebsite })
    }).then(r => r.json()).catch(() => ({ error: 'Network error' }));

    if (signUpRes?.error) {
      alert(signUpRes.error);
      return;
    }

    // Inform user about confirmation requirement
    alert('We have sent you a confirmation email. Please verify your email. Your company application has been recorded and is pending approval.');
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-colors";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Container card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-start gap-3">
          <div className="mt-0.5 text-[var(--theme-green)]"><Info className="h-5 w-5" /></div>
          <p className="text-sm text-gray-700">
            Are you a SafariBookings partner? <a className="text-[var(--theme-green)] underline" href="#">Apply</a> using your SafariBookings account.
          </p>
        </div>

        {/* Company Details */}
        <section className="px-6 py-6">
          <h2 className="text-base font-semibold text-gray-900">Company Details</h2>
          <p className="mt-1 text-sm text-gray-500">Tell us about your safari company.</p>

          <div className="mt-5 space-y-5">
            <div>
              <Label htmlFor="company_name" className="mb-2 block text-sm font-medium text-gray-700">Company Name</Label>
              <Input id="company_name" type="text" placeholder="Your company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <Label htmlFor="company_website" className="mb-2 block text-sm font-medium text-gray-700">Company Website</Label>
              <Input id="company_website" type="url" placeholder="https://example.com" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="company_email" className="mb-2 block text-sm font-medium text-gray-700">Company Email Address</Label>
              <Input id="company_email" type="email" placeholder="info@example.com" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} required className={inputClass} />
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-200" />

        {/* Personal Details */}
        <section className="px-6 py-6">
          <h2 className="text-base font-semibold text-gray-900">Your Details</h2>
          <p className="mt-1 text-sm text-gray-500">We will create your personal login using these details.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="first_name" className="mb-2 block text-sm font-medium text-gray-700">First Name</Label>
              <Input id="first_name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <Label htmlFor="last_name" className="mb-2 block text-sm font-medium text-gray-700">Last Name</Label>
              <Input id="last_name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="user_email" className="mb-2 block text-sm font-medium text-gray-700">Email Address</Label>
              <Input id="user_email" type="email" placeholder="you@example.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required className={inputClass} />
              <p className="mt-1 text-xs text-gray-500">Can be the same as the company email. It will be used for signing into your personal account.</p>
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-200" />

        {/* Account Credentials */}
        <section className="px-6 py-6">
          <h2 className="text-base font-semibold text-gray-900">Create Your Account</h2>
          <p className="mt-1 text-sm text-gray-500">Set a password for your login.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters.</p>
            </div>
            <div>
              <Label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-gray-700">Confirm Password</Label>
              <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-200" />

        {/* Terms and submit */}
        <section className="px-6 py-6">
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 rounded border-gray-300 text-[var(--theme-green)] focus:ring-[var(--theme-green)]" />
            <span>
              I agree to the <a className="text-[var(--theme-green)] underline" href="#">SafariOffice Subscription Terms & Conditions</a>
            </span>
          </label>

          <div className="mt-5">
            <Button type="submit" className="w-full md:w-auto bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)]" disabled={!isValid}>
              Apply for an account
            </Button>
          </div>
        </section>
      </div>
    </form>
  );
}
