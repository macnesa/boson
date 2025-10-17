export default function Paragraph({ 
  children, 
  size = 'base', 
  className = '', 
  ...props 
}) {
  const baseClasses = 'text-neutral-300 leading-relaxed';
  
  const sizes = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const classes = `${baseClasses} ${sizes[size]} ${className}`;
  
  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
}
