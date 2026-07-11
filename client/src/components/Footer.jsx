import { BsRobot, BsTwitterX, BsLinkedin, BsGithub, BsEnvelope } from "react-icons/bs";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Interview", href: "/interview" },
  { label: "History", href: "/history" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

const socialLinks = [
  { icon: BsTwitterX, label: "Twitter", href: "#" },
  { icon: BsLinkedin, label: "LinkedIn", href: "#" },
  { icon: BsGithub, label: "GitHub", href: "#" },
  { icon: BsEnvelope, label: "Email", href: "#" },
];

const currentYear = new Date().getFullYear();

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200" role="contentinfo">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-black text-white p-2 rounded-lg">
                <BsRobot size={18} />
              </div>
              <span className="font-semibold text-lg hidden md:block">InterviewIQ.AI</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              AI Powered Mock Interview System
            </p>
          </div>

          <nav aria-label="Main navigation">
            <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-500 text-sm hover:text-green-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-500 text-sm hover:text-green-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            &copy; {currentYear} InterviewIQ.AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;