import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AuthPerformanceTest } from '@/components/auth/AuthPerformanceTest';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, AlertCircle } from 'lucide-react';
import { downloadQuotationPDF } from '@/utils/pdfGenerator';
import { useQuotations, useCompanies } from '@/hooks/useDatabase';
import { useState, ReactNode, Component, ErrorInfo } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Error Boundary for Dashboard
interface DashboardErrorBoundaryProps {
  children: ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class DashboardErrorBoundary extends Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Welcome back! Here's what's happening with your business today.
              </p>
            </div>
          </div>
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>Dashboard Error:</strong> {this.state.error?.message || 'An unexpected error occurred loading the dashboard. Please refresh the page.'}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

const Index = () => {
  const { data: companies } = useCompanies();
  const currentCompany = companies?.[0];
  const { data: quotations } = useQuotations(currentCompany?.id);
  const [showAuthPerformance, setShowAuthPerformance] = useState(false);

  const handleTestPDF = () => {
    try {
      // Use real quotation data if available, otherwise use test data
      const realQuotation = quotations?.[0];

      // Get company details for PDF
      const companyDetails = currentCompany ? {
        name: currentCompany.name,
        address: currentCompany.address,
        city: currentCompany.city,
        country: currentCompany.country,
        phone: currentCompany.phone,
        email: currentCompany.email,
        tax_number: currentCompany.tax_number,
        logo_url: currentCompany.logo_url,
        primary_color: currentCompany.primary_color,
        pdf_template: currentCompany.pdf_template
      } : undefined;

      if (realQuotation) {
        downloadQuotationPDF(realQuotation, companyDetails);
        toast.success('PDF generated using real quotation data!');
        return;
      }

      // Fallback to test quotation data for demonstration
      const testQuotation = {
        id: 'test-123',
        quotation_number: 'QUO-2024-001',
        quotation_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 150000,
        subtotal: 125000,
        tax_amount: 25000,
        status: 'draft',
        notes: 'This is a test quotation to demonstrate the MedPlus logo in PDF documents.',
        terms_and_conditions: `Prepared By:……………………………………………………….…………………. Checked By:……………………………���………………...……….\n\nTerms and regulations\n1) The company shall have general as well as particular lien on all goods for any unpaid A/C\n2) Cash transactions of any kind are not acceptable. All payments should be made by cheque , MPESA, or Bank transfer only\n3) Claims and queries must be lodged with us within 21 days of dispatch of goods, otherwise they will not be acceopted back\n4) Where applicable, transport will be invoiced seperately\n5) The company will not be responsible for any loss or damage of goods on transit collected by the customer or sent via customer's courier A/C\n6) The VAT is inclusive where applicable`,
        customers: {
          name: 'Sample Customer Ltd',
          email: 'customer@example.com',
          phone: '+254 700 000 000',
          address: '123 Business Avenue',
          city: 'Nairobi',
          country: 'Kenya'
        },
        quotation_items: [
          {
            description: 'Medical Equipment - Blood Pressure Monitor',
            quantity: 5,
            unit_price: 15000,
            tax_percentage: 16,
            tax_amount: 12000,
            line_total: 87000
          },
          {
            description: 'Surgical Gloves (Box of 100)',
            quantity: 10,
            unit_price: 2500,
            tax_percentage: 16,
            tax_amount: 4000,
            line_total: 29000
          },
          {
            description: 'Digital Thermometer',
            quantity: 8,
            unit_price: 3500,
            tax_percentage: 16,
            tax_amount: 4480,
            line_total: 32480
          }
        ]
      };

      downloadQuotationPDF(testQuotation, companyDetails);
      toast.success('Test PDF generated using sample data (no real quotations found)');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <DashboardErrorBoundary>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={handleTestPDF}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-1 sm:flex-none min-w-[120px] text-sm sm:text-base"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{quotations?.length ? 'Download Sample PDF' : 'Test PDF Generation'}</span>
              <span className="sm:hidden">PDF</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowAuthPerformance(!showAuthPerformance)}
              className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white flex-1 sm:flex-none min-w-[120px] text-sm sm:text-base"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{showAuthPerformance ? 'Hide' : 'Show'} Performance</span>
              <span className="sm:hidden">{showAuthPerformance ? 'Hide' : 'Show'}</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left Column - Takes 2/3 of the space on lg screens */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <RecentActivity />
          </div>

          {/* Right Column - Takes 1/3 of the space on lg screens */}
          <div className="space-y-6 order-1 lg:order-2">
            <QuickActions />

            {/* Auth Performance Monitor - Toggle visibility */}
            {showAuthPerformance && (
              <div className="transition-all duration-300 ease-in-out">
                <AuthPerformanceTest />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default Index;
