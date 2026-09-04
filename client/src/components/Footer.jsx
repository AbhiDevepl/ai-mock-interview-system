import { motion } from "motion/react";
import { Link } from "react-router-dom";
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
    <footer className="bg-white" role="contentinfo">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-green-500 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto px-6 py-12 md:py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="lg:col-span-1">
            <Link
              to="/"
              aria-label="InterviewIQ.AI - Back to Home"
              className="inline-flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-100/80 rounded-xl p-1 -m-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-left"
            >
              <div className="bg-black text-white p-2 rounded-lg shrink-0">
                <BsRobot size={18} />
              </div>
              <span className="font-semibold text-base md:text-lg text-gray-900">InterviewIQ.AI</span>
            </Link>
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
                    className="group relative inline-block text-gray-500 text-sm hover:text-green-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-600 transition-all duration-200 group-hover:w-full" />
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
                    className="group relative inline-block text-gray-500 text-sm hover:text-green-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-600 transition-all duration-200 group-hover:w-full" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  onClick={(e) => {
                    if (social.href === "#") e.preventDefault();
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} InterviewIQ.AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-500 text-sm hover:text-green-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

export default Footer;
