import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Clapperboard, Film, Tv, MoreHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const watchlist = [
    { id: 1, name: 'Duna: Parte 2', type: 'Filme', platform: 'Max', status: 'to-watch', image: 'https://picsum.photos/seed/21/300/450' },
    { id: 2, name: 'The Bear', type: 'Série', platform: 'Star+', status: 'watching', image: 'https://picsum.photos/seed/22/300/450' },
    { id: 3, name: 'Succession', type: 'Série', platform: 'Max', status: 'watched', dateWatched: '2024-06-20', image: 'https://picsum.photos/seed/23/300/450' },
    { id: 4, name: 'Pobres Criaturas', type: 'Filme', platform: 'Star+', status: 'to-watch', image: 'https://picsum.photos/seed/24/300/450' },
    { id: 5, name: 'Fallout', type: 'Série', platform: 'Prime Video', status: 'watched', dateWatched: '2024-05-15', image: 'https://picsum.photos/seed/25/300/450' },
    { id: 6, name: 'Guerra Civil', type: 'Filme', platform: 'Cinema', status: 'to-watch', image: 'https://picsum.photos/seed/26/300/450' },
];

const renderList = (status: string) => {
    return watchlist.filter(item => item.status === status).map(item => (
        <Card key={item.id} className="overflow-hidden w-full">
            <div className="relative aspect-[2/3]">
                <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="movie poster" />
                 <Badge variant="secondary" className="absolute top-2 right-2">{item.platform}</Badge>
            </div>
            <CardContent className="p-4">
                <h3 className="font-semibold font-headline truncate">{item.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                    {item.type === 'Filme' ? <Film className="w-4 h-4 mr-1"/> : <Tv className="w-4 h-4 mr-1"/>}
                    <span>{item.type}</span>
                </div>
            </CardContent>
            {item.status === 'watched' && (
                <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                    Assistido em {new Date(item.dateWatched).toLocaleDateString('pt-BR')}
                </CardFooter>
            )}
        </Card>
    ));
}


export default function WatchlistPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Filmes & Séries</h1>
          <p className="text-muted-foreground">A lista de entretenimento do casal.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Item
        </Button>
      </div>

      <Tabs defaultValue="to-watch">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="to-watch">Para Assistir</TabsTrigger>
          <TabsTrigger value="watching">Assistindo</TabsTrigger>
          <TabsTrigger value="watched">Já Vimos</TabsTrigger>
        </TabsList>
        <TabsContent value="to-watch" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {renderList('to-watch')}
          </div>
        </TabsContent>
        <TabsContent value="watching" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
             {renderList('watching')}
          </div>
        </TabsContent>
        <TabsContent value="watched" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {renderList('watched')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
