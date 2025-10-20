import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';
import Card from '../../components/molecules/Card';

export default function WhoWeArePage() {
  const values = [
    {
      title: "Creativity",
      description: "The fundamental force that drives innovation and transforms ideas into reality."
    },
    {
      title: "Transformation", 
      description: "The process of turning raw potential into meaningful experiences that connect and inspire."
    },
    {
      title: "Infinite Potential",
      description: "The belief that every project holds unlimited possibilities waiting to be discovered."
    }
  ];

  return (
    <SectionWrapper>
      <div className="space-y-16">
        <div className="text-center space-y-6">
          <Heading level={2} className="text-white">
            Who We Are
          </Heading>
          
          <Paragraph size="lg" className="text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            We are architects of digital experiences, storytellers of the modern age, and catalysts of creative transformation. 
            Our mindset is rooted in the understanding that every brand has a unique frequency, and our mission is to amplify it.
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <Card key={index} variant="elevated" className="p-6 text-center">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">{value.title}</h3>
                <Paragraph size="sm" className="text-neutral-400">
                  {value.description}
                </Paragraph>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
