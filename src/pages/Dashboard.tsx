import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Download, Star, Building, ExternalLink, Shield, Clock, Users } from 'lucide-react';
import supabase from '../utils/supabase';

interface Company {
  id: number;
  name: string;
  domain: string;
  career_page: string;
  industry: string;
  location: string;
  rating: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/');
        return;
      }

      setUser(authUser);

      // Check payment status - try the function first, fallback to direct table query
      let hasValidPayment = false;
      
      try {
        // Try using the payment function if it exists
        const { data: paymentData, error: paymentError } = await supabase
          .rpc('get_user_payment_status', { user_email: authUser.email });

        if (!paymentError && paymentData && paymentData.length > 0) {
          hasValidPayment = paymentData[0].has_paid;
          setPaymentStatus(paymentData[0]);
        } else {
          // Fallback: check user_payments table directly
          const { data: directPaymentData, error: directError } = await supabase
            .from('user_payments')
            .select('payment_status, payment_date, payment_method')
            .eq('email', authUser.email)
            .eq('payment_status', 'completed')
            .limit(1);

          if (!directError && directPaymentData && directPaymentData.length > 0) {
            hasValidPayment = true;
            setPaymentStatus({
              has_paid: true,
              payment_date: directPaymentData[0].payment_date,
              payment_method: directPaymentData[0].payment_method
            });
          }
        }
      } catch (funcError) {
        console.log('Payment function not available, using direct table query');
        
        // Final fallback: check if user exists in user_payments with completed status
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_payments')
          .select('*')
          .eq('email', authUser.email)
          .eq('payment_status', 'completed')
          .limit(1);

        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          hasValidPayment = true;
          setPaymentStatus({
            has_paid: true,
            payment_date: fallbackData[0].payment_date,
            payment_method: fallbackData[0].payment_method || 'paypal'
          });
        }
      }
      
      if (!hasValidPayment) {
        // User hasn't paid, redirect to payment page
        navigate('/payment');
        return;
      }
      
      // Load companies data (mock data for now)
      loadCompanies();
      
    } catch (err) {
      console.error('Error checking user access:', err);
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = () => {
    // Mock data - replace with actual API call
    const mockCompanies: Company[] = [
      {
        id: 1,
        name: "Microsoft Corporation",
        domain: "microsoft.com",
        career_page: "https://careers.microsoft.com",
        industry: "Technology",
        location: "Redmond, WA",
        rating: 4.5
      },
      {
        id: 2,
        name: "Amazon Web Services",
        domain: "aws.amazon.com",
        career_page: "https://aws.amazon.com/careers/",
        industry: "Cloud Computing",
        location: "Seattle, WA",
        rating: 4.3
      },
      {
        id: 3,
        name: "Google LLC",
        domain: "google.com",
        career_page: "https://careers.google.com",
        industry: "Technology",
        location: "Mountain View, CA",
        rating: 4.7
      },
      {
        id: 4,
        name: "Meta Platforms",
        domain: "meta.com",
        career_page: "https://www.metacareers.com",
        industry: "Social Media",
        location: "Menlo Park, CA",
        rating: 4.2
      },
      {
        id: 5,
        name: "Apple Inc.",
        domain: "apple.com",
        career_page: "https://jobs.apple.com",
        industry: "Technology",
        location: "Cupertino, CA",
        rating: 4.6
      }
    ];
    
    setCompanies(mockCompanies);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                H1B Sponsor Database
              </h1>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                Lifetime Access
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">500+</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Sponsors</p>
                <p className="text-2xl font-bold text-gray-900">100%</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-2xl font-bold text-gray-900">Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies by name, industry, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-0 outline-none text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Companies List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                H1B Sponsoring Companies
              </h2>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                <span>Export List</span>
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {company.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{company.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{company.industry}</span>
                      <span>•</span>
                      <span>{company.location}</span>
                      <span>•</span>
                      <span>{company.domain}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href={`https://${company.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={company.career_page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      View Careers
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No companies found matching your search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;