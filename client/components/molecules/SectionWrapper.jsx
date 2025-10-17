export default function SectionWrapper({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = 'default',
  ...props 
}) {
  const baseClasses = 'w-full mx-auto';
  
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };
  
  const paddings = {
    none: '',
    sm: 'px-4 py-8',
    default: 'px-6 py-16 md:px-8 md:py-24',
    lg: 'px-8 py-20 md:px-12 md:py-32'
  };
  
  const classes = `${baseClasses} ${maxWidths[maxWidth]} ${paddings[padding]} ${className}`;
  
  return (
    <section className={classes} {...props}>
      {children}
    </section>
  );
}
