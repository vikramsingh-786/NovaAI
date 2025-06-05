import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  const socialIconVariants = {
    hover: {
      scale: 1.2,
      color: "var(--accent-purple)",
      transition: { duration: 0.2 },
    },
  };

  return (
    <footer className="border-t border-[var(--border-primary)] py-16 px-4 sm:px-6 lg:px-8 bg-[var(--background-accent)]/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 items-center mb-12">
          {/* Logo and Name */}
          <Link
            href="/"
            className="flex items-center space-x-3 md:justify-start justify-center"
          >
            <motion.div
              className="w-10 h-10 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.1, rotate: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] bg-clip-text text-transparent">
              NovaAI
            </span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[var(--text-muted)]">
            {["Features", "About", "Testimonials", "Pricing", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href={
                    item === "Pricing" || item === "Contact"
                      ? `/${item.toLowerCase()}`
                      : `#${item.toLowerCase()}`
                  }
                  className="hover:text-[var(--accent-purple)] theme-transition text-sm"
                >
                  {item}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center space-x-6 justify-center md:justify-end">
            {[
              { href: "#", icon: Github, label: "GitHub" },
              { href: "#", icon: Twitter, label: "Twitter" },
              { href: "#", icon: Linkedin, label: "LinkedIn" },
            ].map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                className="text-[var(--text-muted)] hover:text-[var(--accent-purple)] theme-transition"
                variants={socialIconVariants}
                whileHover="hover"
                aria-label={`NovaAI on ${social.label}`}
              >
                <social.icon className="w-6 h-6" />
              </motion.a>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-[var(--border-primary)]/50 text-center text-[var(--text-muted)]">
          <p className="text-sm">
            © {new Date().getFullYear()} NovaAI. All rights reserved.
            <br className="sm:hidden" />
            Think smarter, create faster.
          </p>
          <p className="text-xs mt-2">
            Designed with <span className="text-[var(--accent-purple)]">♥</span>{" "}
            by Your Name/Company
          </p>
        </div>
      </div>
    </footer>
  );
}
