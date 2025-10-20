import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';

export default function WhyBosonPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Golden swirl accent background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#d05a2e]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#d05a2e]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d05a2e]/5 rounded-full blur-3xl"></div>
      </div>
      
      <SectionWrapper className="relative z-10">
        <div className="space-y-8 max-w-4xl mx-auto text-center">
          <Heading level={2} className="text-white">
            Why Boson
          </Heading>
          
          <div className="space-y-6">
            <Paragraph size="lg" className="text-neutral-300 leading-relaxed">
              In physics, a boson is a particle that carries force, enabling interactions between matter. 
              In our world, we are the force that enables meaningful interactions between brands and their audiences.
            </Paragraph>
            
            <Paragraph size="base" className="text-neutral-400 leading-relaxed">
              Our unique methodology combines logic-driven creativity with intuitive storytelling. We don't just create content; 
              we engineer experiences that resonate at the fundamental level of human connection. Every strategy is built on 
              data, every design is crafted with purpose, and every story is told with intention.
            </Paragraph>
            
            <Paragraph size="base" className="text-neutral-400 leading-relaxed">
              Like the boson particles that make the universe possible, we make meaningful brand interactions possible. 
              We are the invisible force that transforms signals into stories, chaos into clarity, and potential into reality.
            </Paragraph>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
