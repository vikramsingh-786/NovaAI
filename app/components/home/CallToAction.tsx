import { ArrowRight, Rocket } from 'lucide-react'; 
import { motion } from 'framer-motion';

export default function CallToAction() {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 20,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.section 
      className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--background-secondary)]/50 via-[var(--background-primary)] to-[var(--background-secondary)]/50" // Subtle gradient background
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.div variants={itemVariants} className="mb-6">
          <Rocket className="w-16 h-16 mx-auto text-[var(--accent-purple)] opacity-80" />
        </motion.div>
        <motion.h2 
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-highlight-from)] to-[var(--hero-highlight-to)] bg-clip-text text-transparent"
        >
          Ready to Elevate Your Thinking?
        </motion.h2>
        <motion.p 
          variants={itemVariants}
          className="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Join thousands of thinkers, creators, and innovators who have made NovaAI their indispensable AI companion. Unlock your potential today.
        </motion.p>
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <motion.button 
            className="group w-full sm:w-auto bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-10 py-4 rounded-full text-lg font-semibold text-[var(--button-text)] shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out"
            whileHover={{ scale: 1.05, filter: "brightness(1.15)" }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Free
            <ArrowRight className="inline-block ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </motion.button>
          <motion.button 
            className="w-full sm:w-auto px-10 py-4 rounded-full text-lg font-semibold border-2 border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 hover:text-[var(--accent-purple)] transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Schedule Demo
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
}