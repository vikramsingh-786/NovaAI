import { motion } from 'framer-motion';
import Image from 'next/image'; 

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
      content: "NovaAI has the most intuitive interface I&apos;ve ever used. It understands context like no other, truly accelerating my research.",
      avatar: "SC",
      highlightColor: "purple"
    },
    {
      name: "Marcus Rodriguez",
      role: "Software Engineer",
      content: "Game-changing for my development workflow. NovaAI&apos;s code understanding and generation capabilities are phenomenal.",
      avatar: "MR",
      highlightColor: "blue"
    },
    {
      name: "Elena Kowalski",
      role: "Content Strategist",
      content: "Finally, an AI that gets creative nuance! My content brainstorming and drafting productivity has skyrocketed with NovaAI.",
      avatar: "EK",
      highlightColor: "emerald"
    }
  ];

  const getAvatarBgGradient = (color: string) => {
    switch (color) {
      case "purple":
        return "from-purple-500 to-indigo-500";
      case "blue":
        return "from-sky-500 to-cyan-500";
      case "emerald":
        return "from-emerald-500 to-teal-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 } 
    }
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      borderColor: "var(--border-primary)", 
      boxShadow: "0 4px 6px -1px var(--shadow-color-softer), 0 2px 4px -2px var(--shadow-color-soft)",
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    },
    hover: {
      y: -8,       
      scale: 1.02,  
      borderColor: "var(--border-accent)", 
      boxShadow: "0 10px 15px -3px var(--shadow-color-medium), 0 4px 6px -4px var(--shadow-color-medium)",
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <motion.section
      id="testimonials"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--background-primary)]"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }} 
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
            Loved by Innovators
          </h2>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            See what forward-thinkers and creators are saying about their NovaAI experience. It&apos;s more than an assistant; it&apos;s a partner in thought.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="flex flex-col p-8 bg-[var(--card-bg)] backdrop-blur-md rounded-2xl border"
              variants={cardVariants}
              whileHover="hover"
            >
              <p className="text-[var(--text-secondary)] mb-8 text-lg leading-relaxed flex-grow">
                <span className="text-3xl font-serif leading-none text-[var(--accent-purple)] mr-1">“</span>
                {testimonial.content}
                <span className="text-3xl font-serif leading-none text-[var(--accent-purple)] ml-1">”</span>
              </p>
              <motion.div
                className="flex items-center mt-auto pt-6 border-t border-[var(--border-primary)]/50"
                initial={{ opacity: 0 }}
                transition={{ delay: 0.2 + (index * 0.05) }} 
              >
                {testimonial.avatar.length <= 3 ? (
                  <div className={`w-14 h-14 bg-gradient-to-br ${getAvatarBgGradient(testimonial.highlightColor)} rounded-full flex items-center justify-center text-white text-xl font-semibold mr-4 shadow-md`}>
                    {testimonial.avatar}
                  </div>
                ) : (
                  <Image 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full mr-4 object-cover shadow-md" 
                  />
                )}
                <div>
                  <div className="font-semibold text-lg text-[var(--text-primary)]">{testimonial.name}</div>
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