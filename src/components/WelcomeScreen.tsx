interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center fade-in">
      <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
        Ko Pha Ngan
      </p>

      <h1 className="font-heading text-5xl font-bold text-foreground leading-tight mb-6">
        Island
        <br />
        Quest
      </h1>

      <p className="font-body text-base text-muted-foreground max-w-[260px] leading-relaxed mb-10">
        8 missions. 3–4 days. One island adventure you won't forget.
      </p>

      <button
        onClick={onStart}
        className="rounded-lg bg-primary px-8 py-4 font-body text-base font-semibold text-primary-foreground transition-all active:scale-95"
      >
        Begin Your Quest
      </button>

      <p className="font-body text-xs text-muted-foreground mt-6 max-w-[220px]">
        Explore, dare, and capture proof along the way.
      </p>
    </div>
  );
};

export default WelcomeScreen;
