export default function Card({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) {
  const baseClasses = 'rounded-lg border transition-all duration-200';
  
  const variants = {
    default: 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700',
    elevated: 'bg-neutral-900 border-neutral-800 shadow-lg hover:shadow-xl',
    accent: 'bg-neutral-900/30 border-[#d05a2e]/30 hover:border-[#d05a2e]/50',
    transparent: 'bg-transparent border-neutral-800 hover:border-neutral-700'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
