import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';
// import Image from 'next/image';

export default function ClientsPage() {
  // Using placeholder logos - in a real project, these would be actual client logos
  const clientLogos = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `Client ${i + 1}`,
    logo: '/boson.png' // Using the existing boson.png as placeholder
  }));

  return (
    <SectionWrapper>
      <div className="space-y-16">
        <div className="text-center space-y-6">
          <Heading level={2} className="text-white">
            Our Clients
          </Heading>
          
          <Paragraph size="lg" className="text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Trusted by innovators worldwide
          </Paragraph>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {clientLogos.map((client) => (
            <div 
              key={client.id}
              className="flex items-center justify-center p-6 bg-neutral-900/30 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors duration-200"
            >
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="w-16 h-16 bg-neutral-700 rounded-lg flex items-center justify-center">
                  <span className="text-neutral-400 text-xs font-medium">LOGO</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Paragraph size="base" className="text-neutral-500">
            And many more innovative brands that trust us with their digital transformation
          </Paragraph>
        </div>
      </div>
    </SectionWrapper>
  );
}
