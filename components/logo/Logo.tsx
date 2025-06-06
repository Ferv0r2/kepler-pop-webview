'use client';
interface LogoProps {
  className?: string;
}

export const Logo = ({ className = '' }: LogoProps) => {
  return (
    <h1 className={`font-['Press_Start_2P'] flex flex-col items-center justify-center text-center w-full ${className}`}>
      <div className="text-5xl font-bold bg-gradient-to-b from-[#fef08a] to-[#f59e0b] bg-clip-text text-transparent filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] w-full text-center">
        KEPLER
      </div>
      <div className="text-5xl font-bold bg-gradient-to-b from-[#ec4899] to-[#8b5cf6] bg-clip-text text-transparent filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] w-full text-center">
        POP
      </div>
    </h1>
  );
};
