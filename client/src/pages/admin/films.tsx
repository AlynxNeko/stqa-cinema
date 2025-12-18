import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase, Film } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export default function AdminFilms() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const { toast } = useToast();

  const { data: films, isLoading } = useQuery<Film[]>({
    queryKey: ['/api/films'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('films')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const createFilm = useMutation({
    mutationFn: async (filmData: Partial<Film>) => {
      const { data, error } = await supabase
        .from('films')
        .insert(filmData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/films'] });
      toast({ title: 'Film created successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateFilm = useMutation({
    mutationFn: async ({ id, ...filmData }: Partial<Film>) => {
      const { data, error } = await supabase
        .from('films')
        .update(filmData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/films'] });
      toast({ title: 'Film updated successfully' });
      setIsDialogOpen(false);
      setEditingFilm(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteFilm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('films').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/films'] });
      toast({ title: 'Film deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const filmData = {
      title: formData.get('title') as string,
      genre: formData.get('genre') as string,
      duration_min: parseInt(formData.get('duration_min') as string),
      description: formData.get('description') as string,
      poster_url: formData.get('poster_url') as string,
      rating: parseFloat(formData.get('rating') as string),
    };

    if (editingFilm) {
      updateFilm.mutate({ id: editingFilm.id, ...filmData });
    } else {
      createFilm.mutate(filmData);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-2xl font-bold">Films Management</h1>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingFilm(null);
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-film">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Film
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingFilm ? 'Edit Film' : 'Add New Film'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        required
                        defaultValue={editingFilm?.title}
                        data-testid="input-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre *</Label>
                      <Input
                        id="genre"
                        name="genre"
                        required
                        defaultValue={editingFilm?.genre}
                        data-testid="input-genre"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration_min">Duration (minutes) *</Label>
                      <Input
                        id="duration_min"
                        name="duration_min"
                        type="number"
                        required
                        defaultValue={editingFilm?.duration_min}
                        data-testid="input-duration"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating (0-10) *</Label>
                      <Input
                        id="rating"
                        name="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        required
                        defaultValue={editingFilm?.rating}
                        data-testid="input-rating"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poster_url">Poster URL *</Label>
                    <Input
                      id="poster_url"
                      name="poster_url"
                      type="url"
                      required
                      defaultValue={editingFilm?.poster_url}
                      data-testid="input-poster-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      defaultValue={editingFilm?.description}
                      rows={4}
                      data-testid="input-description"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-submit">
                      {editingFilm ? 'Update' : 'Create'} Film
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center text-muted-foreground">Loading films...</div>
                ) : films && films.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poster</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Genre</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {films.map((film) => (
                        <TableRow key={film.id} data-testid={`row-film-${film.id}`}>
                          <TableCell>
                            <div className="w-12 h-16 bg-muted rounded overflow-hidden">
                              {film.poster_url && (
                                <img
                                  src={film.poster_url}
                                  alt={film.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{film.title}</TableCell>
                          <TableCell>{film.genre}</TableCell>
                          <TableCell>{film.duration_min} min</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              {film.rating.toFixed(1)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingFilm(film);
                                  setIsDialogOpen(true);
                                }}
                                data-testid={`button-edit-${film.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this film?')) {
                                    deleteFilm.mutate(film.id);
                                  }
                                }}
                                data-testid={`button-delete-${film.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No films yet. Add your first film!
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
