import "./globals.css";
import MemeGenerator from "../components/MemeGenerator";

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }} className="animate-fade-in">
        <h1 className="title-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>Meme-to-Knowledge Converter</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
          Gen-Z users often ignore important academic or institutional updates. This tool converts important information like exam dates, circulars, or announcements into engaging meme-style content to improve reach and retention.
        </p>
      </header>

      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <MemeGenerator />
      </div>
    </main>
  );
}
