'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Search, Loader2, User, Mail, Hash, Shield, MapPin, ChevronDown } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { hasPermission } from '@/lib/rbac';
import { PermissionDeniedModal } from '@/components/ui/permission-denied-modal';

interface Agent {
  id: number;
  agent_code: string;
  agent_email: string;
  agent_name: string;
  agent_is_active: boolean;
  owner_id: string;
  country_id: number | null;
}

interface Country {
  id: number;
  country_name: string;
}

interface Company {
  id: string;
  company_name: string;
}

interface AgentsTableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeCompanyId?: string;
}

export function AgentsTable({ searchQuery = '', onSearchChange, activeCompanyId }: AgentsTableProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [permModal, setPermModal] = useState<{ open: boolean; perm?: string; msg?: string }>({ open: false });

  const [formData, setFormData] = useState({
    agent_email: '',
    agent_name: '',
    agent_is_active: true,
    country_id: null as number | null,
  });

  // Searchable dropdown states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [selectedCountryName, setSelectedCountryName] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User authentication error:', userError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Resolve active company
      let companyId: string | null = activeCompanyId || null;
      if (!companyId) {
        const { data: userCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        companyId = userCompany?.id || null;
      }

      // If no company is selected/resolved, avoid querying with null
      let agentsData = [] as Agent[] | null;
      let agentsError: any = null;
      if (companyId) {
        const res = await supabase
          .from('agents')
          .select('*')
          .eq('owner_id', companyId)
          .order('agent_name');
        agentsData = res.data as any;
        agentsError = res.error;
      } else {
        agentsData = [];
      }

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        throw agentsError;
      }

      // Fetch countries for dropdown
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('id, country_name')
        .order('country_name');

      if (countriesError) {
        console.error('Error fetching countries:', countriesError);
        console.error('Countries error details:', {
          message: countriesError.message,
          details: countriesError.details,
          hint: countriesError.hint
        });
        // Don't throw error for countries, just log it and continue with empty countries array
        console.log('Continuing without countries data');
      } else {
        console.log('Successfully fetched countries:', countriesData?.length || 0, 'countries');
      }

      setAgents(agentsData || []);
      setCompanies(companyId ? [{ id: companyId, company_name: '' }] : []);
      setCountries(countriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!userCompany) throw new Error('Company not found');

      const canWrite = await hasPermission('agents.write', userCompany.id);
      if (!canWrite) {
        setPermModal({ open: true, perm: 'agents.write', msg: 'You do not have permission to create or update agents.' });
        throw new Error('permission_denied');
      }

      if (editingAgent) {
        // Update existing agent
        const updateData = {
          agent_email: formData.agent_email,
          agent_name: formData.agent_name,
          agent_is_active: formData.agent_is_active,
          country_id: formData.country_id || null,
        };
        
        console.log('Updating agent with data:', updateData);
        
        const { error } = await supabase
          .from('agents')
          .update(updateData)
          .eq('id', editingAgent.id);

        if (error) throw error;
      } else {
        // Generate agent code from agent name
        const agentCode = generateAgentCode(formData.agent_name);
        
        const insertData = {
          agent_code: agentCode,
          agent_email: formData.agent_email,
          agent_name: formData.agent_name,
          agent_is_active: formData.agent_is_active,
          country_id: formData.country_id || null,
          owner_id: userCompany.id,
        };
        
        console.log('Creating agent with data:', insertData);
        console.log('Generated agent code:', agentCode);
        
        // Create new agent
        const { error } = await supabase
          .from('agents')
          .insert(insertData);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingAgent(null);
      setFormData({
        agent_email: '',
        agent_name: '',
        agent_is_active: true,
        country_id: null,
      });
      setSelectedCountryName('');
      setCountrySearchTerm('');
      fetchData();
    } catch (error) {
      console.error('Error saving agent:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code
      });
      
      // Provide more specific error messages
      let errorMessage = 'Error saving agent. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'An agent with this code already exists.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid country selected. Please choose a valid country.';
        } else if (error.message.includes('not null')) {
          errorMessage = 'Please fill in all required fields.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      if (!(error instanceof Error && error.message === 'permission_denied')) {
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      agent_email: agent.agent_email || '',
      agent_name: agent.agent_name || '',
      agent_is_active: agent.agent_is_active,
      country_id: agent.country_id || null,
    });
    
    // Set selected country name for editing
    if (agent.country_id) {
      const country = countries.find(c => c.id === agent.country_id);
      setSelectedCountryName(country?.country_name || '');
    } else {
      setSelectedCountryName('');
    }
    setCountrySearchTerm('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const { data: row } = await supabase.from('agents').select('owner_id').eq('id', id).single();
      if (!row) throw new Error('Agent not found');
      const canDelete = await hasPermission('agents.delete', row.owner_id);
      if (!canDelete) {
        setPermModal({ open: true, perm: 'agents.delete', msg: 'You do not have permission to delete agents.' });
        throw new Error('permission_denied');
      }

      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting agent:', error);
      if (!(error instanceof Error && error.message === 'permission_denied')) {
        alert(error instanceof Error ? error.message : 'Error deleting agent. Please try again.');
      }
    }
  };

  const handleAddNew = () => {
    setEditingAgent(null);
    setFormData({
      agent_email: '',
      agent_name: '',
      agent_is_active: true,
      country_id: null,
    });
    setSelectedCountryName('');
    setCountrySearchTerm('');
    setShowModal(true);
  };

  // Helper function to generate agent code from agent name
  const generateAgentCode = (agentName: string): string => {
    if (!agentName.trim()) return 'AGT001';
    
    const initials = agentName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 3);
    
    // Use a more unique timestamp to avoid collisions
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    return `${initials}${timestamp.slice(-6)}${randomSuffix}`;
  };

  // Helper functions for searchable dropdown
  const filteredCountries = countries.filter(country =>
    country.country_name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    setFormData({ ...formData, country_id: country.id });
    setSelectedCountryName(country.country_name);
    setCountrySearchTerm('');
    setShowCountryDropdown(false);
  };

  const handleCountryInputChange = (value: string) => {
    setCountrySearchTerm(value);
    setSelectedCountryName('');
    setFormData({ ...formData, country_id: null });
    setShowCountryDropdown(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = (
      agent.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agent_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agent_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCompany = !filterCompany || agent.owner_id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    {
      key: 'agent_info',
      label: 'Agent Information',
      render: (value: any, row: Agent) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.agent_name}
          </div>
          <div className="text-sm text-gray-500">
            {row.agent_email}
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (value: any, row: Agent) => {
        const country = countries.find(c => c.id === row.country_id);
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{country?.country_name || 'No country'}</span>
          </div>
        );
      },
    },
    {
      key: 'agent_is_active',
      label: 'Status',
      render: (value: any, row: Agent) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.agent_is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.agent_is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Agent) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 text-lg font-medium">Error loading data</div>
        <div className="text-gray-600 text-sm">{error}</div>
                 <Button onClick={fetchData} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Agents</h2>
        <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-gray-600 text-lg">No agents found</div>
          <div className="text-gray-500 text-sm">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first agent'}
          </div>
                     {!searchQuery && (
             <Button onClick={handleAddNew} className="bg-[var(--theme-green)] hover:bg-[var(--theme-green-dark)] text-white">
               <Plus className="h-4 w-4 mr-2" />
               Add First Agent
             </Button>
           )}
        </div>
      ) : (
        <DataTable
          data={filteredAgents}
          columns={columns}
          searchQuery={searchQuery}
          itemsPerPage={10}
          showPagination={true}
          showBulkSelection={false}
        />
      )}

             {/* Modal */}
       <Modal
         isOpen={showModal}
         onClose={() => setShowModal(false)}
         title={editingAgent ? 'Edit Agent' : 'Add Agent'}
       >
         <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="agent_name" className="block text-sm font-medium text-gray-700 mb-2">Agent Name</Label>
                <Input
                  id="agent_name"
                  type="text"
                  value={formData.agent_name}
                  onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="agent_email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</Label>
                <Input
                  id="agent_email"
                  type="email"
                  value={formData.agent_email}
                  onChange={(e) => setFormData({ ...formData, agent_email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="relative country-dropdown-container">
                <Label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={selectedCountryName || countrySearchTerm}
                    onChange={(e) => handleCountryInputChange(e.target.value)}
                    onFocus={() => setShowCountryDropdown(true)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-green)] focus:border-[var(--theme-green)] transition-all duration-200"
                    placeholder="Search and select country"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {showCountryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <div
                          key={country.id}
                          onClick={() => handleCountrySelect(country)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                        >
                          {country.country_name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        {countries.length === 0 ? 'No countries available in database' : `No countries found matching "${countrySearchTerm}"`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingAgent ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingAgent ? 'Update Agent' : 'Add Agent'
                  )}
                </Button>
              </div>
         </form>
       </Modal>
      <PermissionDeniedModal
        isOpen={permModal.open}
        onClose={() => setPermModal({ open: false })}
        requiredPermission={permModal.perm}
        message={permModal.msg}
      />
    </div>
  );
} 