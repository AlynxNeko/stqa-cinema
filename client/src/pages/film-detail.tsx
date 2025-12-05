import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Star, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { UserNav } from '@/components/user-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, Film, Showtime } from '@/lib/supabase';

export default function FilmDetail() {
  const [, params] = useRoute('/films/:id');
  const filmId = params?.id;

  const { data: film, isLoading: filmLoading } = useQuery<Film>({
    queryKey: ['/api/films', filmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('films')
        .select('*')
        .eq('id', filmId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!filmId,
  });

  const { data: showtimes, isLoading: showtimesLoading } = useQuery<Showtime[]>({
    queryKey: ['/api/showtimes', filmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('showtimes')
        .select('*, studio:studios(*)')
        .eq('film_id', filmId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!filmId,
  });

  const groupedShowtimes = showtimes?.reduce((acc, showtime) => {
    const date = showtime.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(showtime);
    return acc;
  }, {} as Record<string, Showtime[]>);

  if (filmLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserNav />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!film) {
    return (
      <div className="min-h-screen bg-background">
        <UserNav />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <p className="text-center text-muted-foreground">Film not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNav />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-2">
            <Card className="overflow-hidden">
              <div className="aspect-[2/3] bg-muted">
                {film.poster_url ? (
                  <img
                    src={film.poster_url}
                    alt={film.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No poster available
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="md:col-span-3">
            <h1 className="text-4xl font-bold mb-4">{film.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Badge variant="secondary" className="text-sm">
                {film.genre}
              </Badge>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold">{film.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">/10</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{film.duration_min} minutes</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Synopsis</h2>
              <p className="text-base leading-relaxed text-foreground">
                {film.description}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Select Showtime</h2>
          
          {showtimesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : groupedShowtimes && Object.keys(groupedShowtimes).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedShowtimes).map(([date, times]) => (
                <Card key={date}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {times.map((showtime) => (
                        <Link key={showtime.id} href={`/select-seats/${showtime.id}`} data-testid={`link-showtime-${showtime.id}`}>
                          <Button
                            variant="outline"
                            className="flex flex-col items-start h-auto py-3 px-4"
                            data-testid={`button-showtime-${showtime.id}`}
                          >
                            <span className="text-lg font-semibold">{showtime.time}</span>
                            <span className="text-xs text-muted-foreground">
                              {showtime.studio?.name}
                            </span>
                            <span className="text-sm font-medium text-primary mt-1">
                              Rp {showtime.price.toLocaleString('id-ID')}
                            </span>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No showtimes available for this film yet.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
