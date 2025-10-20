import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';
import Card from '../../components/molecules/Card';

export default function ServicesPage() {
  const services = [
    {
      title: "Social Media Strategy",
      description: "We craft data-driven strategies that transform your brand's digital presence into meaningful connections with your audience."
    },
    {
      title: "Branding & Design",
      description: "From visual identity to brand guidelines, we create cohesive design systems that communicate your unique story."
    },
    {
      title: "Websites & Digital",
      description: "We build digital experiences that engage, convert, and leave lasting impressions through thoughtful design and development."
    },
    {
      title: "Photo & Video Production",
      description: "Our creative team produces compelling visual content that captures attention and tells your story with cinematic quality."
    }
  ];

  return (
    <SectionWrapper>
      <div className="space-y-16">
        <div className="text-center space-y-6">
          <Heading level={2} className="text-white">
            Our Services
          </Heading>
          
          <Paragraph size="lg" className="text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            We offer comprehensive creative solutions designed to amplify your brand's voice and accelerate your growth 
            in the digital landscape.
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <Card key={index} variant="elevated" className="p-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white">{service.title}</h3>
                <Paragraph size="base" className="text-neutral-400 leading-relaxed">
                  {service.description}
                </Paragraph>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
