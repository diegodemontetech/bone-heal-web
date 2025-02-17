import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Studies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: studies, isLoading } = useQuery({
    queryKey: ['scientific-studies', searchTerm, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('scientific_studies')
        .select('*')
        .order('published_date', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (startDate) {
        query = query.gte('published_date', startDate);
      }

      if (endDate) {
        query = query.lte('published_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="pt-24">
          <div className="relative h-[400px] bg-primary">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/90 to-primary/90" />
            <div className="container mx-auto px-8 h-full flex items-center">
              <div className="relative z-10 max-w-3xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Estudos Científicos
                </h1>
                <p className="text-lg md:text-xl text-white/90">
                  Descubra as pesquisas e evidências científicas que comprovam a eficácia dos nossos produtos.
                </p>
              </div>
            </div>
          </div>
          
          <div className="container mx-auto px-8 py-16">
            {/* Search and Filter Section */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Pesquisar estudos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {studies?.map((study) => (
                  <div key={study.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-primary mb-3">{study.title}</h3>
                      <p className="text-neutral-600 mb-4 line-clamp-3">{study.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-neutral-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {study.published_date && format(new Date(study.published_date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                        </div>
                        <a 
                          href={study.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download PDF</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Studies;