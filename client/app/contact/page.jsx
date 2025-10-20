'use client';
import { useState } from 'react';
import SectionWrapper from '../../components/molecules/SectionWrapper';
import Heading from '../../components/atoms/Heading';
import Paragraph from '../../components/atoms/Paragraph';
import Button from '../../components/atoms/Button';
import Card from '../../components/molecules/Card';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <SectionWrapper>
      <div className="space-y-16">
        <div className="text-center space-y-6">
          <Heading level={2} className="text-white">
            Let's Collaborate
          </Heading>
          
          <Paragraph size="lg" className="text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Ready to transform your brand's digital presence? Let's start a conversation about your next project.
          </Paragraph>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card variant="elevated" className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#d05a2e] focus:border-transparent transition-colors duration-200"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#d05a2e] focus:border-transparent transition-colors duration-200"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#d05a2e] focus:border-transparent transition-colors duration-200 resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-full"
              >
                Start a Conversation
              </Button>
            </form>
          </Card>
        </div>

        <div className="text-center">
          <Paragraph size="base" className="text-neutral-500">
            © 2025 BOSON COLLECTIVE
          </Paragraph>
        </div>
      </div>
    </SectionWrapper>
  );
}
