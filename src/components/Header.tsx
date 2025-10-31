import { Button } from "@/components/ui/button";
import logo from "@/assets/evalifyai-logo.png";

const Header = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img src={logo} alt="EvalifyAI - Performance. Perfected by AI." className="h-12 w-auto" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('problem')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Problem
            </button>
            <button 
              onClick={() => scrollToSection('solution')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Solution
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Features
            </button>
          </nav>

          {/* CTA Button */}
          <Button 
            onClick={() => scrollToSection('waitlist')}
            className="bg-accent hover:bg-accent/90 text-white font-semibold px-6"
            size="lg"
          >
            Join Waitlist
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
