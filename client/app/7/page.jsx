import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';
import Card from '../../components/molecules/Card';
import Button from '../../components/atoms/Button';

export default function ProjectsPage() {
  const projects = [
    {
      name: "Quantum Brand Evolution",
      description: "A complete digital transformation for a tech startup, resulting in 300% increase in brand awareness and 150% growth in lead generation."
    },
    {
      name: "Cosmic Social Campaign",
      description: "A viral social media campaign that reached 2M+ impressions and established our client as an industry thought leader."
    },
    {
      name: "Stellar E-commerce Platform",
      description: "An immersive online shopping experience that increased conversion rates by 85% and customer engagement by 200%."
    }
  ];

  return (
    <SectionWrapper>
      <div className="space-y-16">
        <div className="text-center space-y-6">
          <Heading level={2} className="text-white">
            Case Studies
          </Heading>
          
          <Paragraph size="lg" className="text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Explore our portfolio of transformative projects that demonstrate our ability to turn creative vision into measurable results.
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card key={index} variant="elevated" className="p-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                  <Paragraph size="sm" className="text-neutral-400 leading-relaxed">
                    {project.description}
                  </Paragraph>
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  View More
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
