import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';

export default function IndustriesPage() {
  const industries = [
    "Real Estate",
    "Fashion", 
    "Hospitality",
    "Lifestyle",
    "Food & Beverage",
    "Technology",
    "Healthcare",
    "Education",
    "Finance",
    "Entertainment",
    "Sports",
    "Non-Profit"
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/50 via-neutral-800/30 to-neutral-900/50"></div>
      
      <SectionWrapper className="relative z-10">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <Heading level={2} className="text-white">
              Industries We Serve
            </Heading>
            
            <Paragraph size="lg" className="text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Our expertise spans across diverse industries, each with its unique challenges and opportunities. 
              We adapt our creative approach to resonate with your specific audience and market dynamics.
            </Paragraph>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <div 
                key={index}
                className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-lg text-center hover:border-[#d05a2e]/30 transition-colors duration-200"
              >
                <span className="text-neutral-300 font-medium">{industry}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
