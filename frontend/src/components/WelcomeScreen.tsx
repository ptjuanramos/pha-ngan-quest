interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center fade-in">
      <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
        Uma aventura criada para
      </p>

      <h2 className="font-heading text-2xl font-bold text-accent mb-6 italic">
        Ana Lia Costa
      </h2>

      <div className="w-12 h-px bg-accent/40 mb-6" />

      <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
        Ko Pha Ngan
      </p>

      <h1 className="font-heading text-5xl font-bold text-foreground leading-tight mb-6">
        Island
        <br />
        Quest
      </h1>

      <p className="font-body text-base text-muted-foreground max-w-[260px] leading-relaxed mb-10">
        8 missões. 3–4 dias. Uma aventura na ilha que não vais esquecer. ✨
      </p>

      <button
        onClick={onStart}
        className="rounded-lg bg-accent px-8 py-4 font-body text-base font-semibold text-accent-foreground transition-all active:scale-95 shadow-lg shadow-accent/20"
      >
        Começar a Aventura 💛
      </button>

      <p className="font-body text-xs text-muted-foreground mt-6 max-w-[220px] italic">
        Explora, atreve-te e captura provas pelo caminho.
      </p>
    </div>
  );
};

export default WelcomeScreen;
