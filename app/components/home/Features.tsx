import { Brain, Zap, ShieldCheck, Globe } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
}

export default function Features() {
  const features: Feature[] = [
    {
      icon: <Brain className="w-10 h-10" />,
      title: "Advanced AI Reasoning",
      description:
        "Powered by cutting-edge language models for complex problem solving and creative thinking.",
      colorClass: "text-purple-400", 
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: "Lightning Fast",
      description:
        "Optimized for speed with real-time responses and seamless user experience.",
      colorClass: "text-sky-400", // Or use var(--accent-blue)
    },
    {
      icon: <ShieldCheck className="w-10 h-10" />, // Changed icon
      title: "Secure & Private",
      description:
        "Your conversations are encrypted and protected with enterprise-grade security.",
      colorClass: "text-emerald-400",
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: "Global Access",
      description:
        "Available worldwide with multi-language support and cultural awareness.",
      colorClass: "text-amber-400",
    },
  ];

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 12 },
    },
    hover: {
      y: -8,
      scale: 1.03,
      boxShadow: "0px 15px 30px -10px rgba(0,0,0,0.2)", // Softer shadow for cards
      // In light theme, shadow might need to be lighter:
      // In globals.css, you could define --card-shadow and theme it
      // boxShadow: "var(--card-shadow-hover)"
      borderColor: "var(--border-accent)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.section
      id="features"
      className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[var(--background-secondary)]/30" // Slight background distinction
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-highlight-from)] to-[var(--hero-highlight-to)] bg-clip-text text-transparent">
            Why Choose NovaAI?
          </h2>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Built for thinkers, creators, and innovators who demand more from
            their AI companion.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group p-8 bg-[var(--card-bg)] backdrop-blur-md rounded-2xl border border-[var(--border-primary)] theme-transition cursor-pointer"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                className={`mb-6 w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--gradient-start)]/20 to-[var(--gradient-end)]/20 flex items-center justify-center group-hover:from-[var(--gradient-start)]/40 group-hover:to-[var(--gradient-end)]/40 transition-colors duration-300 ${feature.colorClass}`}
                // Animate icon scale on card hover for more dynamism
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }} // This applies when hovering the icon div itself
                // To link to card hover, you'd manage state or use CSS group-hover
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-semibold mb-3 text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors duration-300 text-base leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
