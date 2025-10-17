import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';

export default function SocialsPage() {
  const socialPlatforms = [
    {
      name: "Instagram",
      handle: "@bosoncollective",
      description: "Visual storytelling and behind-the-scenes content",
      icon: "📸"
    },
    {
      name: "LinkedIn", 
      handle: "Boson Collective",
      description: "Industry insights and professional updates",
      icon: "💼"
    },
    {
      name: "YouTube",
      handle: "Boson Collective",
      description: "Creative tutorials and project showcases",
      icon: "🎥"
    },
    {
      name: "Behance",
      handle: "Boson Collective",
      description: "Portfolio highlights and design inspiration",
      icon: "🎨"
    }
  ];

  return (
    <SectionWrapper>
      <div className="space-y-16">
        <div className="text-center space-y-6">
          <Heading level={2} className="text-white">
            Socials
          </Heading>
          
          <Paragraph size="lg" className="text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Follow Boson's digital footprint
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {socialPlatforms.map((platform, index) => (
            <div 
              key={index}
              className="p-8 bg-neutral-900/50 border border-neutral-800 rounded-lg hover:border-[#d05a2e]/30 transition-colors duration-200 group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-[#d05a2e] transition-colors duration-200">
                      {platform.name}
                    </h3>
                    <p className="text-neutral-400 text-sm">{platform.handle}</p>
                  </div>
                </div>
                
                <Paragraph size="sm" className="text-neutral-400">
                  {platform.description}
                </Paragraph>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Paragraph size="base" className="text-neutral-500">
            Join our community of creators, innovators, and digital storytellers
          </Paragraph>
        </div>
      </div>
    </SectionWrapper>
  );
}
