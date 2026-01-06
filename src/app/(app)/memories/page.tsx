import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Camera, MapPin, PlusCircle } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const memories = [
  { id: 1, imageId: 'memory-1', description: 'Nosso primeiro pôr do sol na praia juntos. Inesquecível!', date: '2023-01-15', location: 'Praia do Rosa, SC' },
  { id: 2, imageId: 'memory-2', description: 'Noite de fondue e vinho em Campos do Jordão.', date: '2023-06-28', location: 'Campos do Jordão, SP' },
  { id: 3, imageId: 'memory-3', description: 'Explorando as ruas coloridas de Buenos Aires.', date: '2022-11-05', location: 'Buenos Aires, Argentina' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function MemoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Álbum de Memórias</h1>
          <p className="text-muted-foreground">Uma linha do tempo dos seus momentos mais especiais.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Memória
        </Button>
      </div>

      <div className="relative pl-6 after:absolute after:inset-y-0 after:left-6 after:w-px after:bg-border">
        {memories.map((memory, index) => {
          const memoryImage = PlaceHolderImages.find(p => p.id === memory.imageId);
          return (
            <div key={memory.id} className="relative grid md:grid-cols-[1fr_auto_1fr] md:gap-x-12 mb-12">
              <div className={`flex items-center md:justify-end ${index % 2 === 0 ? 'md:order-3' : 'md:order-1'}`}>
                  <Card className="w-full max-w-md">
                      <CardHeader>
                          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                              {memoryImage && (
                                  <Image 
                                      src={memoryImage.imageUrl} 
                                      alt={memoryImage.description} 
                                      fill 
                                      className="object-cover"
                                      data-ai-hint={memoryImage.imageHint}
                                  />
                              )}
                          </div>
                      </CardHeader>
                      <CardContent>
                          <CardDescription>{memory.description}</CardDescription>
                      </CardContent>
                  </Card>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 left-[-36px] md:static md:order-2 md:transform-none">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary shadow-md">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
              </div>
              
              <div className={`flex items-center ${index % 2 === 0 ? 'md:order-1' : 'md:order-3 md:justify-end'}`}>
                  <div className="p-4 md:text-right">
                      <p className="font-semibold text-lg font-headline">{format(new Date(memory.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                      {memory.location && (
                          <div className="flex items-center md:justify-end text-muted-foreground mt-1">
                              <MapPin className="w-4 h-4 mr-1"/>
                              <span>{memory.location}</span>
                          </div>
                      )}
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
