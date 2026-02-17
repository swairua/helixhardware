import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { PublicFooter } from '@/components/PublicFooter';
import ProductCategorySidebar from '@/components/ProductCategorySidebar';
import { ImageGallery } from '@/components/ImageGallery';
import { useToast } from '@/hooks/use-toast';
import { useWebCategoryBySlug, useWebVariantBySlug } from '@/hooks/useWebCategories';
import { useWebManager, VariantImage } from '@/hooks/useWebManager';
import { MessageCircle, ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useSEO } from '@/hooks/useSEO';
import { generateProductSchema, SITE_CONFIG, useBreadcrumbSchema } from '@/utils/seoHelpers';
import { openWhatsAppQuotation } from '@/utils/whatsappQuotation';
import { VariantImagesModal } from '@/components/web-manager/VariantImagesModal';

export default function ProductDetail() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchVariantImages } = useWebManager();

  // Try to fetch as category first, then as variant
  const { category, variants } = useWebCategoryBySlug(productSlug || '');
  const { variant } = useWebVariantBySlug(productSlug || '');

  const [variantImages, setVariantImages] = useState<VariantImage[]>([]);
  const [categoryVariantImages, setCategoryVariantImages] = useState<Record<string, VariantImage[]>>({});
  const [variantImageIndex, setVariantImageIndex] = useState<Record<string, number>>({});
  const [selectedVariantForImages, setSelectedVariantForImages] = useState<typeof variants[0] | null>(null);
  const [showImagesModal, setShowImagesModal] = useState(false);

  const isCategory = !!category && variants.length > 0;
  const isVariant = !!variant && !isCategory;

  // Fetch variant images when variant loads
  useEffect(() => {
    if (variant?.id) {
      loadVariantImages(variant.id);
    }
  }, [variant?.id]);

  // Fetch images for all category variants
  useEffect(() => {
    if (isCategory && variants.length > 0) {
      loadCategoryVariantImages(variants);
    }
  }, [isCategory, variants]);

  const loadVariantImages = async (variantId: string) => {
    const images = await fetchVariantImages(variantId);
    setVariantImages(images);
  };

  const loadCategoryVariantImages = async (categoryVariants: typeof variants) => {
    const imagesMap: Record<string, VariantImage[]> = {};
    for (const v of categoryVariants) {
      const images = await fetchVariantImages(v.id);
      imagesMap[v.id] = images;
    }
    setCategoryVariantImages(imagesMap);
  };

  // Set SEO for product
  useSEO(
    {
      title: variant?.name || category?.name || 'Product',
      description: variant?.description || category?.description || 'Browse our product collection',
      keywords: `${variant?.name || category?.name}, medical supplies, healthcare`,
      url: `${SITE_CONFIG.url}/products/${productSlug}`,
      type: isCategory ? 'website' : 'product',
      image: variant?.image_path || undefined,
    },
    variant ? generateProductSchema({
      name: variant.name,
      description: variant.description || '',
      image: variant.image_path || '',
      url: `${SITE_CONFIG.url}/products/${productSlug}`,
      category: category?.name || '',
    }) : undefined
  );

  useBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: variant?.name || category?.name || 'Product', url: `/products/${productSlug}` }
  ]);

  const [quotationForm, setQuotationForm] = useState({
    quantity: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    additionalNotes: ''
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuotationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendToWhatsApp = () => {
    if (!quotationForm.quantity || !quotationForm.companyName || !quotationForm.email || !quotationForm.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before sending.",
        variant: "destructive"
      });
      return;
    }

    try {
      openWhatsAppQuotation({
        productName: variant?.name || category?.name || 'Product',
        productSku: variant?.sku,
        category: category?.name,
        quantity: quotationForm.quantity,
        companyName: quotationForm.companyName,
        contactPerson: quotationForm.contactPerson,
        email: quotationForm.email,
        phone: quotationForm.phone,
        additionalNotes: quotationForm.additionalNotes
      });

      toast({
        title: "Success!",
        description: "Opening WhatsApp. Please complete your message and send.",
      });

      setQuotationForm({
        quantity: '',
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!variant && !isCategory) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white shadow-sm z-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to="/" className="flex-shrink-0">
                <BiolegendLogo size="md" showText={true} />
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link to="/" className="text-gray-700 hover:text-primary transition-colors font-medium">Home</Link>
                <Link to="/about-us" className="text-gray-700 hover:text-primary transition-colors font-medium">About Us</Link>
                <Link to="/products" className="text-gray-700 hover:text-primary transition-colors font-medium">Our Products</Link>
                <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors font-medium">Contact Us</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
            <Link to="/products">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                <ArrowLeft size={16} className="mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render category view
  if (isCategory) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 bg-white shadow-sm z-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to="/" className="flex-shrink-0">
                <BiolegendLogo size="md" showText={true} />
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link to="/" className="text-gray-700 hover:text-primary transition-colors font-medium">Home</Link>
                <Link to="/about-us" className="text-gray-700 hover:text-primary transition-colors font-medium">About Us</Link>
                <Link to="/products" className="text-gray-700 hover:text-primary transition-colors font-medium">Our Products</Link>
                <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors font-medium">Contact Us</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <BreadcrumbNav items={[
          { label: 'Products', href: '/products' },
          { label: category?.name || 'Category', href: `/products/${productSlug}` }
        ]} />

        {/* Category Products Grid */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar - Using ProductCategorySidebar which fetches its own data */}
              <ProductCategorySidebar
                activeCategory={category?.name}
              />

              {/* Main Content */}
              <div className="flex-1">
                <div className="mb-12">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{category?.name}</h1>
                  <p className="text-lg text-gray-600">
                    {category?.description || `Browse our collection of ${category?.name?.toLowerCase()} products`}
                  </p>
                </div>

                {/* Variants Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* Variant Images */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {categoryVariantImages[v.id] && categoryVariantImages[v.id].length > 0 ? (
                      <img
                        src={categoryVariantImages[v.id][0].url}
                        alt={categoryVariantImages[v.id][0].altText || v.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : v.image_path ? (
                      <img
                        src={v.image_path}
                        alt={v.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    {categoryVariantImages[v.id] && categoryVariantImages[v.id].length > 1 && (
                      <button
                        onClick={() => {
                          setSelectedVariantForImages(v);
                          setShowImagesModal(true);
                        }}
                        className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer hover:shadow-lg hover:scale-110 border-2 border-white shadow-md flex items-center gap-1"
                        title="Click to view all images"
                      >
                        <span>+{categoryVariantImages[v.id].length - 1}</span>
                        <span>👁️</span>
                      </button>
                    )}
                  </div>

                  {/* Variant Info */}
                  <div className="p-4">
                    {/* SKU */}
                    <p className="text-xs text-gray-500 font-semibold mb-2">SKU: {v.sku}</p>

                    {/* Variant Name */}
                    <h3 className="text-base font-bold text-gray-900 mb-4 line-clamp-2">
                      {v.name}
                    </h3>

                    {/* Request Quotation Button */}
                    <button
                      onClick={() => {
                        openWhatsAppQuotation({
                          productName: v.name,
                          productSku: v.sku,
                          category: category?.name,
                          quantity: '1',
                          companyName: '',
                          contactPerson: '',
                          email: '',
                          phone: ''
                        });
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Request Quotation
                    </button>
                  </div>
                </div>
              ))}
                </div>

                {/* Back Button */}
                <div className="mt-12 text-center">
                  <Link to="/products">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                      <ArrowLeft size={16} className="mr-2" />
                      Back to Products
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {selectedVariantForImages && (
          <VariantImagesModal
            open={showImagesModal}
            onOpenChange={setShowImagesModal}
            variant={selectedVariantForImages}
            images={categoryVariantImages[selectedVariantForImages.id] || []}
          />
        )}

        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0">
              <BiolegendLogo size="md" showText={true} />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary transition-colors font-medium">Home</Link>
              <Link to="/about-us" className="text-gray-700 hover:text-primary transition-colors font-medium">About Us</Link>
              <Link to="/products" className="text-gray-700 hover:text-primary transition-colors font-medium">Our Products</Link>
              <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors font-medium">Contact Us</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <BreadcrumbNav items={[
        { label: 'Products', href: '/products' },
        { label: category?.name || 'Category', href: `/products/${category?.slug}` },
        { label: variant?.name || 'Variant', href: `/products/${productSlug}` }
      ]} />

      {/* Product Details with Sidebar */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar - Using ProductCategorySidebar which fetches its own data */}
            <ProductCategorySidebar
              activeCategory={category?.name}
            />

            {/* Main Content */}
            <div className="flex-1">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Variant Images Gallery */}
                <div>
                  <ImageGallery
                    images={variantImages}
                    fallbackImage={variant?.image_path}
                    fallbackAlt={variant?.name}
                  />
                </div>

                {/* Variant Info */}
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{variant?.name}</h1>
                  <p className="text-sm text-gray-600 font-semibold mb-4">SKU: {variant?.sku}</p>
                  <p className="text-lg text-gray-600 mb-6">
                    {variant?.description || 'High-quality product for medical and healthcare applications'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quotation Form */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Request a Quotation</h2>
          <p className="text-gray-600 text-center mb-12">Fill in the details below and we'll send you a quotation via WhatsApp</p>

          <form className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6 scroll-smooth" style={{ scrollBehavior: 'auto' }}>
            {/* Product Display */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-semibold">Product Category</p>
              <p className="text-lg text-orange-900 font-bold">{category?.name}</p>
              <p className="text-sm text-orange-700 mt-2">Variant: {variant?.name}</p>
              <p className="text-sm text-orange-600">SKU: {variant?.sku}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quantity */}
              <div>
                <Label htmlFor="quantity" className="text-gray-700 mb-2 block">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={quotationForm.quantity}
                  onChange={handleFormChange}
                  autoComplete="off"
                  placeholder="e.g., 50"
                  required
                  className="mt-1"
                />
              </div>

              {/* Company Name */}
              <div>
                <Label htmlFor="companyName" className="text-gray-700 mb-2 block">
                  Company/Institution Name *
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={quotationForm.companyName}
                  onChange={handleFormChange}
                  autoComplete="organization"
                  placeholder="Your organization name"
                  required
                  className="mt-1"
                />
              </div>

              {/* Contact Person */}
              <div>
                <Label htmlFor="contactPerson" className="text-gray-700 mb-2 block">
                  Contact Person
                </Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={quotationForm.contactPerson}
                  onChange={handleFormChange}
                  autoComplete="name"
                  placeholder="Your full name"
                  className="mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-700 mb-2 block">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={quotationForm.email}
                  onChange={handleFormChange}
                  autoComplete="email"
                  placeholder="your.email@example.com"
                  required
                  className="mt-1"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-gray-700 mb-2 block">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={quotationForm.phone}
                  onChange={handleFormChange}
                  autoComplete="tel"
                  placeholder="+254 XXX XXX XXX"
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="additionalNotes" className="text-gray-700 mb-2 block">
                Additional Notes or Special Requirements
              </Label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={quotationForm.additionalNotes}
                onChange={handleFormChange}
                autoComplete="off"
                rows={4}
                placeholder="Any special requirements or additional information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mt-1"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={sendToWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Send via WhatsApp
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/products')}
                variant="outline"
                className="flex-1 py-3"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Products
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              * Required fields. Your information will be used only for quotation purposes.
            </p>
          </form>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Need Help?</h2>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 text-center">
            <p className="text-gray-700 mb-4">
              Have questions about this product or need more information?
            </p>
            <p className="text-gray-600 mb-6">
              Sales Email: <a href="mailto:sales@medplusafrica.com" className="text-primary hover:underline font-semibold">sales@medplusafrica.com</a><br />
              Phone: <a href="tel:+254713416022" className="text-primary hover:underline font-semibold">+254 713 416 022</a>
            </p>
            <Link to="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
