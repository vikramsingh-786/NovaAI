// app/components/home/Testimonials.tsx
"use client"; 

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  highlightColor: string;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Chen",
      role: "AI Researcher",
      content: "NovaAI has the most intuitive interface I've ever used. It understands context like no other, truly accelerating my research.",
      avatar: "/av2.avif",
      highlightColor: "purple"
    },
    {
      name: "Marcus Rodriguez",
      role: "Lead Developer",
      content: "Game-changing for my development workflow. NovaAI's code understanding and generation capabilities are phenomenal. A true productivity booster!",
      avatar: "/av3.avif",
      highlightColor: "blue"
    },
    {
      name: "Elena Kowalski",
      role: "Content Strategist",
      content: "Finally, an AI that gets creative nuance! My content brainstorming and drafting productivity has skyrocketed with NovaAI. Highly recommended.",
      avatar: "/av1.avif",
      highlightColor: "emerald"
    }
  ];

  const getAvatarBgGradient = (color: string): string => {
    switch (color) {
      case "purple":
        return "from-purple-500 to-indigo-600";
      case "blue":
        return "from-sky-500 to-cyan-600";
      case "emerald":
        return "from-emerald-500 to-teal-600";
      default:
        return "from-slate-500 to-slate-700";
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      borderColor: "var(--border-primary)",
      boxShadow: "0 4px 15px -5px var(--shadow-color-soft)",
      transition: { type: 'spring', stiffness: 90, damping: 15 }
    },
    hover: {
      y: -10,
      scale: 1.03,
      borderColor: "var(--border-accent)",
      boxShadow: "0 12px 25px -8px var(--shadow-color-medium)",
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
    }
  };

  return (
    <motion.section
      id="testimonials"
      className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--background-primary)] overflow-hidden"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-highlight-from)] to-[var(--hero-highlight-to)] bg-clip-text text-transparent leading-tight">
            Loved by Innovators
          </h2>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            See what forward-thinkers and creators are saying about their NovaAI experience. It's more than an assistant; it's a partner in thought.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="flex flex-col p-6 sm:p-8 bg-[var(--card-bg)] backdrop-blur-md rounded-2xl border border-transparent group cursor-default"
              variants={cardVariants}
              whileHover="hover"
            >
              <Quote className="w-10 h-10 text-[var(--accent-purple)]/70 mb-6 transform -scale-x-100" />
              
              <p className="text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed flex-grow mb-8 italic">
                {testimonial.content}
              </p>

              <hr className="border-[var(--border-primary)]/30 my-6 group-hover:border-[var(--accent-purple)]/30 transition-colors duration-300" />
              
              <motion.div
                className="flex items-center mt-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              >
                {testimonial.avatar.startsWith('/') || testimonial.avatar.startsWith('http') ? (
                  <div className="relative mr-4">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-[var(--border-primary)] group-hover:ring-[var(--accent-purple)] transition-all duration-300"
                    />
                    <span className={`absolute -bottom-1 -right-1 block h-4 w-4 rounded-full border-2 border-[var(--card-bg)] bg-gradient-to-tr ${getAvatarBgGradient(testimonial.highlightColor)} shadow-sm`}></span>
                  </div>
                ) : (
                  <div className={`relative w-14 h-14 bg-gradient-to-br ${getAvatarBgGradient(testimonial.highlightColor)} rounded-full flex items-center justify-center text-white text-xl font-semibold mr-4 shadow-lg ring-2 ring-[var(--border-primary)] group-hover:ring-[var(--accent-purple)] transition-all duration-300`}>
                    {testimonial.avatar}
                    <span className={`absolute -bottom-1 -right-1 block h-4 w-4 rounded-full border-2 border-[var(--card-bg)] bg-gradient-to-tr ${getAvatarBgGradient(testimonial.highlightColor)} shadow-sm`}></span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-md sm:text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-purple)] transition-colors duration-300">{testimonial.name}</div>
                  <div className="text-[var(--text-muted)] text-sm">{testimonial.role}</div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}