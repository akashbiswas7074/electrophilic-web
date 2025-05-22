import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSiteConfig from '@/hooks/use-site-config';

interface LogoProps {
  variant?: 'default' | 'footer' | 'mobile';
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'default',
  size = 'md'
}) => {
  const { logo, name } = useSiteConfig();
  
  const sizeClasses = {
    sm: 'text-lg font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
  };
  
  const variantClasses = {
    default: 'text-primary',
    footer: 'text-white',
    mobile: 'text-primary',
  };

  return (
    <Link href="/" className="flex items-center">
      {logo.useImage ? (
        <Image 
          src={logo.imagePath} 
          alt={name}
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          className="mr-2"
        />
      ) : null}
      {logo.showText && (
        <span className={`${sizeClasses[size]} ${variantClasses[variant]}`}>
          {logo.text}
        </span>
      )}
    </Link>
  );
};

export default Logo;