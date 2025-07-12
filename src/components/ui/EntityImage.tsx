import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageIcon } from 'lucide-react';

interface EntityImageProps {
  imageUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EntityImage: React.FC<EntityImageProps> = ({ 
  imageUrl, 
  name, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const fallbackText = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {imageUrl ? (
        <AvatarImage 
          src={imageUrl} 
          alt={name}
          className="object-cover"
        />
      ) : (
        <AvatarFallback className="bg-muted">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default EntityImage; 