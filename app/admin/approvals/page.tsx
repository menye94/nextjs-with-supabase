import { createClient } from "@/lib/supabase/server";
import { approveCompany } from "@/lib/actions/auth";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-6">Not authenticated</div>;
  }
  // Check admin
  const { data: isAdmin } = await supabase.rpc('is_super_admin', { p_user_id: user.id });
  if (!isAdmin) {
    return <div className="p-6">Forbidden</div>;
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('id, company_name, company_email, created_at, status, approved_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  async function approve(formData: FormData) {
    'use server';
    const id = String(formData.get('company_id'));
    await approveCompany(id);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Company Approvals</h1>
        {(!companies || companies.length === 0) ? (
          <div className="text-gray-600">No pending companies.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Requested</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies!.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.company_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.company_email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(c.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={approve}>
                        <input type="hidden" name="company_id" value={c.id} />
                        <button className="px-3 py-1.5 rounded-md bg-[var(--theme-green)] text-white text-sm hover:bg-[var(--theme-green-dark)]">Approve</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
