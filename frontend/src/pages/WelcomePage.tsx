interface WelcomePageProps {
  onGetStarted: () => void;
}

/**
 * First screen shown when the app opens.
 */
export default function WelcomePage({ onGetStarted }: WelcomePageProps) {
  return (
    <section className="welcome page">
      <h1>You are welcomed by the Match app</h1>
      <p className="welcome__subtitle">
        Book a football field or add your field for rent.
      </p>
      <button type="button" className="btn btn--primary" onClick={onGetStarted}>
        Get Started
      </button>
    </section>
  );
}