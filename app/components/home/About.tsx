import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic'; 
import { Suspense } from 'react';

const InteractiveBrainCanvas = dynamic(() => import('../ui/InteractiveBrain'), {
  ssr: false,
  loading: () => ( 
    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
      <Brain className="w-24 h-24 text-[var(--accent-purple)] animate-pulse" />
      <p className="ml-4">Loading 3D Brain...</p>
    </div>
  ),
});

export default function About() {
  const statItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.section 
      id="about" 
      className="py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 50, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-highlight-from)] to-[var(--hero-highlight-to)] bg-clip-text text-transparent leading-tight">
              Beyond Ordinary AI
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-6 leading-relaxed">
              NovaAI isn&apos;t just another chatbot. It&apos;s a thinking partner that understands nuance, 
              context, and the subtle art of human communication.
            </p>
            <p className="text-lg text-[var(--text-muted)] mb-10 leading-relaxed">
              Whether you&apos;re solving complex problems, brainstorming creative ideas, or exploring 
              new concepts, NovaAI adapts to your cognitive style and helps you think deeper.
            </p>
            <motion.div 
              className="flex items-center space-x-6 sm:space-x-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              transition={{ staggerChildren: 0.2 }}
            >
              {[
                { value: "99.9%", label: "Uptime", color: "text-[var(--accent-purple)]" },
                { value: "10M+", label: "Interactions", color: "text-[var(--accent-blue)]" },
                { value: "150+", label: "Countries", color: "text-emerald-400" } // Example of a third distinct color
              ].map(stat => (
                <motion.div key={stat.label} className="text-center" variants={statItemVariants}>
                  <div className={`text-3xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative h-96 lg:h-[500px]" 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 50, delay: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gradient-start)]/10 to-[var(--gradient-end)]/10 rounded-3xl backdrop-blur-sm border border-[var(--border-primary)] shadow-2xl overflow-hidden">
              <Suspense fallback={ // Fallback for the canvas itself
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    <Brain className="w-24 h-24 text-[var(--accent-purple)] animate-pulse" />
                  </div>
              }>
                <InteractiveBrainCanvas />
              </Suspense>
            </div>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--card-bg)]/70 backdrop-blur-sm rounded-lg border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] shadow-md">
                Interactive AI Core Visualization
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}