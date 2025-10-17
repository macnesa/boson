import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';

export default function StoryPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 opacity-50"></div>
      
      <SectionWrapper className="relative z-10 text-center">
        <div className="space-y-8 max-w-4xl mx-auto">
          <Heading level={2} className="text-white">
            The Story of the Universe
          </Heading>
          
          <div className="space-y-6">
            <Paragraph size="lg" className="text-neutral-300 leading-relaxed">
              At the origin, there was only possibility. We turn chaos into meaning.
            </Paragraph>
            
            <Paragraph size="base" className="text-neutral-400 leading-relaxed">
              In the vast expanse of digital space, where signals dance between devices and stories wait to be told, 
              we find the essence of creation. Every pixel, every interaction, every moment of connection carries 
              the potential to transform the ordinary into the extraordinary.
            </Paragraph>
            
            <Paragraph size="base" className="text-neutral-400 leading-relaxed">
              Like particles that form the building blocks of matter, we believe that every creative element 
              has the power to create something greater than the sum of its parts. This is our philosophy: 
              to harness the fundamental forces of creativity and channel them into experiences that resonate.
            </Paragraph>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
