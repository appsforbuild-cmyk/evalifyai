import { Linkedin, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">EvalifyAI</h3>
            <p className="text-sm opacity-75">Built with ❤️ by the EvalifyAI Team.</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#about" className="hover:text-accent transition-smooth">About</a>
            <a href="#privacy" className="hover:text-accent transition-smooth">Privacy</a>
            <a href="#contact" className="hover:text-accent transition-smooth">Contact</a>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4">
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-smooth"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-smooth"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-smooth"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm opacity-75">
          <p>Copyright © {currentYear} EvalifyAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
