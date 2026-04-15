import { useEffect, useState } from "react";

interface SignatureMomentProps {
  photo: string;
  clue: string;
  onComplete: () => void;
}

const SignatureMoment = ({ photo, clue, onComplete }: SignatureMomentProps) => {
  const [showText, setShowText] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => setShowText(true), 400);
    const fadeTimer = setTimeout(() => setFading(true), 3200);
    const completeTimer = setTimeout(() => onComplete(), 4000);
    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-40 flex items-end justify-center transition-opacity duration-800 ${
        fading ? "fade-out" : ""
      }`}
    >
      {/* Photo background */}
      <img
        src={photo}
        alt="Your proof"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Paper texture overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "hsl(39, 33%, 93%, 0.2)" }}
      />

      {/* Clue overlay */}
      {showText && (
        <div className="relative z-10 w-full px-6 pb-16">
          <p className="font-heading text-lg italic text-muted-foreground typewriter-text">
            "{clue}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SignatureMoment;
