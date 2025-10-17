export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950';
  
  const variants = {
    primary: 'bg-[#d05a2e] text-white hover:bg-[#b84a1f] focus:ring-[#d05a2e]',
    secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 focus:ring-neutral-500',
    outline: 'border border-[#d05a2e] text-[#d05a2e] hover:bg-[#d05a2e] hover:text-white focus:ring-[#d05a2e]',
    ghost: 'text-neutral-100 hover:bg-neutral-800 focus:ring-neutral-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
