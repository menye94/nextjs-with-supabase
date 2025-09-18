import { CompanySignUpForm } from "@/components/auth/company-signup-form";

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Apply for a free account</h1>
          <p className="text-sm text-gray-600 mt-1">
            Already have an account? <a href="/auth/login" className="text-[var(--theme-green)] underline">Sign In</a>
          </p>
          <p className="text-xs text-gray-500 mt-2">After submitting, our team will review and approve your company before you can access the platform.</p>
        </div>
        <CompanySignUpForm />
      </div>
    </div>
  );
}
