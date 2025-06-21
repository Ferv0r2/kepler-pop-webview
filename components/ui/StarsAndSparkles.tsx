'use client';
import { Star as StarIcon } from 'lucide-react';
import { FC } from 'react';

interface StarProps {
  left: string;
  top: string;
  size: number;
  delay: number;
}

interface SparkleProps {
  left: string;
  top: string;
  size: number;
  delay: number;
}

const stars: StarProps[] = [
  { left: '7vw', top: '8vh', size: 0.5, delay: 0 },
  { left: '25vw', top: '12vh', size: 0.4, delay: 0.3 },
  { left: '70vw', top: '10vh', size: 0.5, delay: 0.5 },
  { left: '90vw', top: '15vh', size: 0.35, delay: 1.1 },
  { left: '10vw', top: '45vh', size: 0.6, delay: 0.2 },
  { left: '90vw', top: '50vh', size: 0.4, delay: 1.2 },
  { left: '15vw', top: '80vh', size: 0.5, delay: 0.9 },
  { left: '45vw', top: '90vh', size: 0.35, delay: 1.6 },
  { left: '75vw', top: '85vh', size: 0.7, delay: 0.1 },
  { left: '95vw', top: '70vh', size: 0.6, delay: 1.1 },
];

const sparkles: SparkleProps[] = [
  { left: '20vw', top: '25vh', size: 24, delay: 0 },
  { left: '75vw', top: '20vh', size: 16, delay: 0.5 },
  { left: '25vw', top: '75vh', size: 20, delay: 1 },
  { left: '70vw', top: '70vh', size: 18, delay: 1.5 },
];

const Star: FC<StarProps> = ({ left, top, size, delay }) => (
  <div
    className="star"
    aria-hidden="true"
    style={{
      left,
      top,
      width: `${size}rem`,
      height: `${size}rem`,
      animationDelay: `${delay}s`,
      position: 'fixed',
    }}
  />
);

const Sparkle: FC<SparkleProps> = ({ left, top, size, delay }) => (
  <div
    className="sparkle"
    aria-hidden="true"
    style={{
      left,
      top,
      animationDelay: `${delay}s`,
      position: 'fixed',
      width: size,
      height: size,
    }}
  >
    <StarIcon size={size} fill="#FFEB3B" stroke="#FFF" strokeWidth={1} />
  </div>
);

export const StarsAndSparkles: FC = () => (
  <>
    {stars.map((star, i) => (
      <Star key={`star-${i}`} {...star} />
    ))}
    {sparkles.map((sp, i) => (
      <Sparkle key={`sparkle-${i}`} {...sp} />
    ))}
  </>
);
