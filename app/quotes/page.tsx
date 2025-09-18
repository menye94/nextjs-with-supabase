'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Edit, Eye, Calendar, User, Mail, Plus, FileText, Receipt } from 'lucide-react';
import Link from 'next/link';
// Simple date formatting function to avoid date-fns dependency
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

interface QuoteDraft {
  id: string;
  created_at: string;
  updated_at: string;
  data: {
    clientName?: string;
    clientEmail?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  };
}

interface Offer {
  id: number;
  offer_code: string;
  offer_name: string;
  time_created: string;
  active_from: string;
  active_to: string | null;
  accepted: boolean | null;
  client_id: number;
  client?: {
    cus_first_name: string;
    cus_last_name: string;
    cus_email_address: string;
    countries?: {
      country_name: string;
    };
  };
}

export default function QuotesPage() {
  const [quoteDrafts, setQuoteDrafts] = useState<QuoteDraft[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'drafts' | 'offers'>('offers');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch quote drafts
      const { data: draftsData, error: draftsError } = await supabase
        .from('quote_drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (draftsError) {
        console.error('Error fetching quote drafts:', draftsError);
      } else {
        setQuoteDrafts(draftsData || []);
      }

      // Fetch offers with client information
      const { data: offersData, error: offersError } = await supabase
        .from('offer')
        .select(`
          *,
          client:customers(cus_first_name, cus_last_name, cus_email_address, countries(country_name))
        `)
        .order('time_created', { ascending: false });

      if (offersError) {
        console.error('Error fetching offers:', offersError);
      } else {
        setOffers(offersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = quoteDrafts.filter(draft => {
    const searchLower = searchTerm.toLowerCase();
    return (
      draft.data.clientName?.toLowerCase().includes(searchLower) ||
      draft.data.clientEmail?.toLowerCase().includes(searchLower) ||
      draft.id.toLowerCase().includes(searchLower)
    );
  });

  const filteredOffers = offers.filter(offer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      offer.offer_name.toLowerCase().includes(searchLower) ||
      offer.offer_code.toLowerCase().includes(searchLower) ||
      `${offer.client?.cus_first_name} ${offer.client?.cus_last_name}`.toLowerCase().includes(searchLower) ||
      offer.client?.cus_email_address.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (offer: Offer) => {
    if (offer.accepted) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
    }
    
    const today = new Date();
    const activeFrom = new Date(offer.active_from);
    const activeTo = offer.active_to ? new Date(offer.active_to) : null;
    
    if (activeTo && today > activeTo) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Expired</Badge>;
    }
    
    if (today >= activeFrom) {
      return <Badge variant="outline" className="border-blue-200 text-blue-800">Active</Badge>;
    }
    
    return <Badge variant="outline" className="border-yellow-200 text-yellow-800">Pending</Badge>;
  };


  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes & Offers</h1>
          <p className="text-gray-600 mt-1">Manage your quotes and offers</p>
        </div>
        <Link href="/quote-create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search quotes and offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'offers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Receipt className="h-4 w-4 inline mr-2" />
            Offers ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'drafts'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Drafts ({quoteDrafts.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {filteredOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchTerm ? 'No offers match your search criteria.' : 'You haven\'t created any offers yet.'}
                </p>
                {!searchTerm && (
                  <Link href="/quote-create">
                    <Button>Create Your First Offer</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{offer.offer_name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {offer.client ? `${offer.client.cus_first_name} ${offer.client.cus_last_name}` : 'Unknown Client'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {offer.client?.cus_email_address || 'No email'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(offer.active_from)} - {offer.active_to ? formatDate(offer.active_to) : 'Open'}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(offer)}
                      <Badge variant="outline">{offer.offer_code}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Created {formatDate(offer.time_created)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/quote-create?edit=${offer.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/quotes/${offer.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'drafts' && (
        <div className="space-y-4">
          {filteredDrafts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchTerm ? 'No drafts match your search criteria.' : 'You don\'t have any saved drafts.'}
                </p>
                {!searchTerm && (
                  <Link href="/quote-create">
                    <Button>Create Your First Quote</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredDrafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {draft.data.clientName || 'Untitled Draft'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        {draft.data.clientEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {draft.data.clientEmail}
                          </span>
                        )}
                        {draft.data.startDate && draft.data.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(draft.data.startDate)} - {formatDate(draft.data.endDate)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Last updated {formatDate(draft.updated_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/quote-create?draft=${draft.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Continue
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
