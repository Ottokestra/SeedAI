import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StepCard({ icon: Icon, title, desc, alt, active }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, boxShadow: "0 6px 24px 0 rgb(16 185 129 / 0.18)" }}
      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      className="w-full" aria-label={title}
    >
      <Card className={`rounded-2xl shadow-md p-5 h-full transition border-2 ${active ? 'border-emerald-500' : 'border-transparent'}`}
        tabIndex="0"
        aria-current={active ? "step" : undefined}
      >
        <CardContent className="flex flex-col gap-3 items-center justify-center">
          <Icon className="w-10 h-10 mb-2 text-emerald-500" aria-label={alt} />
          <h4 className="text-lg font-bold text-emerald-800">{title}</h4>
          <p className="text-emerald-700 text-base text-center select-none">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

