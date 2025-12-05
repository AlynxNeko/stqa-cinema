import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, Star, Clock, CalendarDays } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase, Film } from '@/lib/supabase';
import { format, addDays } from 'date-fns';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Updated type to track if it's in the carousel window (1 week)
type FilmWithShowtimeInfo = Film & {
  hasUpcomingShowtime: boolean;
};

export default function Films() {
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'duration' | 'title'>('rating');

  const { data: films, isLoading } = useQuery<FilmWithShowtimeInfo[]>({
    queryKey: ['/api/films'],
    queryFn: async () => {
      // 1. Fetch all films
      const { data: filmsData, error: filmsError } = await supabase
        .from('films')
        .select('*')
        .order('rating', { ascending: false });

      if (filmsError) throw filmsError;
      const allFilms: Film[] = filmsData || [];

      // 2. Fetch showtimes for the next 7 days
      const today = new Date();
      const nextWeek = addDays(today, 7);
      
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(nextWeek, 'yyyy-MM-dd');

      const { data: upcomingShowtimes, error: showtimesError } = await supabase
        .from('showtimes')
        .select('film_id')
        .gte('date', startDate)
        .lte('date', endDate);

      if (showtimesError) throw showtimesError;

      // Create a Set of film IDs that have showtimes in the next week
      const upcomingFilmIds = new Set(upcomingShowtimes?.map(s => s.film_id));

      // 3. Map and enrich the films data
      const enrichedFilms: FilmWithShowtimeInfo[] = allFilms.map(film => ({
        ...film,
        hasUpcomingShowtime: upcomingFilmIds.has(film.id),
      }));

      return enrichedFilms;
    },
  });

  // Derived list for the Carousel
  const carouselFilms = films?.filter(f => f.hasUpcomingShowtime) || [];

  // Filter logic for the main grid
  const allGenres = Array.from(
    new Set(
      (films || []).flatMap((f) => f.genre.split(',').map((g) => g.trim().toLowerCase()))
    )
  );

  const filteredFilms = (films || [])
    .map((film) => ({
      ...film,
      _genres: film.genre.split(',').map((g) => g.trim().toLowerCase()),
    }))
    .filter((film) => {
      const matchesSearch =
        film.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        film._genres.some((g) => g.includes(searchTerm.toLowerCase()));

      const matchesGenre = genreFilter === '' || film._genres.includes(genreFilter);

      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'duration') return a.duration_min - b.duration_min;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <UserNav />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* --- CAROUSEL SECTION --- */}
        {!isLoading && carouselFilms.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Now Showing & Coming Soon</h2>
            </div>
            
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {carouselFilms.map((film) => (
                  <CarouselItem key={film.id} className="md:basis-1/3 lg:basis-1/4">
                    <Link href={`/films/${film.id}`}>
                      <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                        <div className="relative aspect-[2/3] bg-muted rounded-t-xl overflow-hidden">
                          {film.poster_url ? (
                            <img
                              src={film.poster_url}
                              alt={film.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              No poster
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold truncate">{film.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{film.rating.toFixed(1)}</span>
                            <span className="mx-1">•</span>
                            <span>{film.duration_min} min</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex !absolute -left-16 z-10" />
              <CarouselNext className="hidden md:flex !absolute -right-16 z-10" />
            </Carousel>
          </section>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Films</h1>
          <p className="text-muted-foreground">Discover and book tickets for the latest movies</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search films..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background w-full md:w-auto"
          >
            <option value="">All Genres</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-md px-3 py-2 bg-background w-full md:w-auto"
          >
            <option value="rating">Sort by Rating</option>
            <option value="duration">Sort by Duration</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>

        {/* Browse Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[2/3] bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFilms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFilms.map((film) => (
              <Link key={film.id} href={`/films/${film.id}`}>
                <Card className="group overflow-hidden hover-elevate cursor-pointer h-full">
                  <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                    {film.poster_url ? (
                      <img
                        src={film.poster_url}
                        alt={film.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No poster
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                      <Button variant="secondary" size="sm">View Details</Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-xl font-semibold mb-1 line-clamp-1">{film.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">{film.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{film.duration_min} min</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        {film.genre}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No films found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}