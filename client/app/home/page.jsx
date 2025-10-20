import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';
import Button from '../../components/atoms/Button';

export default function HeroPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      
      <SectionWrapper className="relative z-10 text-center">
        <div className="space-y-8">
          <Heading level={1} className="text-white">
            BOSON COLLECTIVE
          </Heading>
          
          <Paragraph size="xl" className="text-neutral-300 max-w-2xl mx-auto">
            Transforming Signals Into Stories
          </Paragraph>
          
          <div className="pt-4">
            <Button variant="primary" size="lg">
              Discover Boson
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
