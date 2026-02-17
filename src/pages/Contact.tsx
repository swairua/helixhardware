import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { useToast } from '@/hooks/use-toast';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useSEO } from '@/hooks/useSEO';
import { generateContactPageSchema, useBreadcrumbSchema } from '@/utils/seoHelpers';
import { useWebCategories } from '@/hooks/useWebCategories';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';
import emailjs from 'emailjs-com';
import { Mail, MessageCircle } from 'lucide-react';

export default function Contact() {
  const { categories } = useWebCategories();
  const companyConfig = useCompanyConfig();

  useSEO(
    {
      title: 'Contact Us',
      description: `Get in touch with ${companyConfig.name}. ${companyConfig.address ? `Located at ${companyConfig.address}` : ''}${companyConfig.phone ? `. Call ${companyConfig.phone}` : ''}${companyConfig.email ? ` or email ${companyConfig.email}` : ''} for inquiries and support.`,
      keywords: 'contact, support, customer service, healthcare inquiries, hospital equipment support',
      url: '/contact',
      type: 'website',
    },
    generateContactPageSchema(companyConfig)
  );

  useBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact Us', url: '/contact' }
  ], companyConfig);

  // Initialize EmailJS
  emailjs.init('dK906nDGwBHoPvOsr');

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    if (contactMethod === 'email') {
      handleEmailSubmit();
    } else {
      handleWhatsAppSubmit();
    }
  };

  const { currentCompany } = useCurrentCompany();

  const handleEmailSubmit = async () => {
    try {
      const templateParams = {
        to_email: currentCompany?.email || 'sales@medplusafrica.com',
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        company: formData.company,
        subject: formData.subject,
        message: formData.message,
      };

      await emailjs.send('service_v8xry1b', 'template_ulgafes', templateParams);

      toast({
        title: "Success!",
        description: "Your inquiry has been sent via email. We'll get back to you shortly.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppSubmit = () => {
    try {
      const message = `*Inquiry from ${companyConfig.name} Contact Form*
━━━━━━━━━━━━━━━━━━━━━━

*From:*
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
${formData.company ? `Company: ${formData.company}` : ''}

*Subject:*
${formData.subject}

*Message:*
${formData.message}

━━━━━━━━━━━━━━━━━━━━━━`;

      const whatsappPhone = currentCompany?.phone?.replace(/\D/g, '').slice(-12) || '254713416022';
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');

      toast({
        title: "Success!",
        description: "Opening WhatsApp. Please review and send your message.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader currentPage="contact" />

      {/* Breadcrumb */}
      <BreadcrumbNav items={[{ label: 'Contact Us', href: '/contact' }]} />

      {/* Page Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Contact Us</h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90">Get in touch with our team for inquiries and support</p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Form */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>

              {/* Contact Method Toggle */}
              <fieldset className="mb-6">
                <legend className="sr-only">Choose contact method</legend>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setContactMethod('email')}
                    role="option"
                    aria-selected={contactMethod === 'email'}
                    aria-label="Send message via email"
                    className={`flex-1 py-3 px-3 sm:px-4 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-auto active:scale-95 ${
                      contactMethod === 'email'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Mail size={18} />
                    <span>Email</span>
                  </button>
                  <button
                    onClick={() => setContactMethod('whatsapp')}
                    role="option"
                    aria-selected={contactMethod === 'whatsapp'}
                    aria-label="Send message via WhatsApp"
                    className={`flex-1 py-3 px-3 sm:px-4 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors min-h-[44px] sm:min-h-auto active:scale-95 ${
                      contactMethod === 'whatsapp'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </fieldset>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <Label htmlFor="name" className="text-gray-700 mb-2 block text-sm sm:text-base">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 min-h-[44px] text-base"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 mb-2 block text-sm sm:text-base">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 min-h-[44px] text-base"
                    placeholder="your.email@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-700 mb-2 block text-sm sm:text-base">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 min-h-[44px] text-base"
                    placeholder="+254 XXX XXX XXX"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <Label htmlFor="company" className="text-gray-700 mb-2 block text-sm sm:text-base">Company/Institution</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 min-h-[44px] text-base"
                    placeholder="Your organization name"
                    autoComplete="organization"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-gray-700 mb-2 block text-sm sm:text-base">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="mt-1 min-h-[44px] text-base"
                    placeholder="What is this about?"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-700 mb-2 block text-sm sm:text-base">Message *</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mt-1 text-base min-h-[120px]"
                    placeholder="Please provide details about your inquiry..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full text-white font-semibold flex items-center justify-center gap-2 min-h-[44px] text-base sm:text-lg ${
                    contactMethod === 'email'
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  size="lg"
                >
                  {contactMethod === 'email' ? (
                    <>
                      <Mail size={20} />
                      {isSubmitting ? 'Sending via Email...' : 'Send via Email'}
                    </>
                  ) : (
                    <>
                      <MessageCircle size={20} />
                      {isSubmitting ? 'Opening WhatsApp...' : 'Send via WhatsApp'}
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Medplus Africa Limited</h3>
                  <div className="text-gray-600 space-y-2 text-sm">
                    <p>Siens Plaza River Road</p>
                    <p>P.O BOX 45352 - 00100</p>
                    <p>Nairobi, Kenya</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Details</h3>
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      <span className="font-semibold">Phone:</span>
                    </p>
                    <p className="text-gray-600 ml-4">
                      <a href="tel:+254713416022" className="text-primary hover:underline">
                        +254 713 416 022
                      </a>
                    </p>
                    <p className="text-gray-600 ml-4">
                      <a href="tel:+254786830610" className="text-primary hover:underline">
                        +254 786 830 610
                      </a>
                    </p>
                    <p className="text-gray-600 mt-3">
                      <span className="font-semibold">Email:</span>
                    </p>
                    <p className="text-gray-600 ml-4">
                      <a href="mailto:sales@medplusafrica.com" className="text-primary hover:underline">
                        sales@medplusafrica.com
                      </a>
                    </p>
                    <p className="text-gray-600 mt-3">
                      <span className="font-semibold">Website:</span>
                    </p>
                    <p className="text-gray-600 ml-4">
                      <a href="https://www.medplusafrica.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        www.medplusafrica.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Time</h3>
                  <p className="text-gray-700">
                    We typically respond to inquiries within 24 business hours. For urgent matters, please call us directly.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Hours</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>Monday - Friday: 8:00 AM - 5:00 PM</li>
                    <li>Saturday: Closed</li>
                    <li>Sunday & Public Holidays: Closed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Our Catalog?</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Download our complete product catalog or browse our offerings
          </p>
          <Link to="/products">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold">
              View Our Products
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter productCategories={categories} />
    </div>
  );
}
