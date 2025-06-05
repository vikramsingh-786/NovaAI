import { motion } from "framer-motion";

export default function LoadingMessage() {
  const dotVariants = {
    animate: (i: number) => ({
      y: [0, -3, 0],
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }),
  };

  return (
    <div className="flex items-center py-1">
      {" "}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full mr-1"
          custom={i}
          variants={dotVariants}
          animate="animate"
        />
      ))}
      <span className="ml-1 text-sm text-[var(--text-muted)] italic">
        NovaAI is thinking...
      </span>
    </div>
  );
}
