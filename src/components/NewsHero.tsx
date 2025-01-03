import { motion } from "framer-motion";

const NewsHero = () => {
  return (
    <section className="bg-primary pt-48 pb-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Notícias e Atualizações
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Fique por dentro das últimas atualizações em Regeneração Óssea Guiada e Odontologia
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsHero;