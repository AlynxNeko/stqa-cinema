import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api, Film, Studio, Showtime } from '@/lib/supabase'; // Import api
import { queryClient } from '@/lib/queryClient';

export default function AdminShowtimes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: showtimes, isLoading } = useQuery<Showtime[]>({
    queryKey: ['/api/showtimes'],
    queryFn: async () => await api.get('/api/showtimes'),
  });

  const { data: films } = useQuery<Film[]>({
    queryKey: ['/api/films'],
    queryFn: async () => await api.get('/api/films'),
  });

  const { data: studios } = useQuery<Studio[]>({
    queryKey: ['/api/studios'],
    queryFn: async () => await api.get('/api/studios'),
  });

  const createShowtime = useMutation({
    mutationFn: async (showtimeData: Partial<Showtime>) => {
      // FIX: Gunakan api.post
      return await api.post('/api/showtimes', showtimeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/showtimes'] });
      toast({ title: 'Showtime created successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteShowtime = useMutation({
    mutationFn: async (id: string) => {
      // FIX: Gunakan api.delete
      return await api.delete(`/api/showtimes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/showtimes'] });
      toast({ title: 'Showtime deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // handleSubmit dan return JSX sama persis seperti file asli Anda,
  // karena form handling hanya memanggil createShowtime.mutate yang sudah diperbaiki.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const showtimeData = {
      film_id: formData.get('film_id') as string,
      studio_id: formData.get('studio_id') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      price: parseInt(formData.get('price') as string),
    };
    createShowtime.mutate(showtimeData);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Showtimes Management</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Showtime</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Showtime</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="film_id">Film *</Label>
                    <Select name="film_id" required>
                      <SelectTrigger><SelectValue placeholder="Select a film" /></SelectTrigger>
                      <SelectContent>{films?.map((film) => (<SelectItem key={film.id} value={film.id}>{film.title}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studio_id">Studio *</Label>
                    <Select name="studio_id" required>
                      <SelectTrigger><SelectValue placeholder="Select a studio" /></SelectTrigger>
                      <SelectContent>{studios?.map((studio) => (<SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="date">Date *</Label><Input id="date" name="date" type="date" required /></div>
                    <div className="space-y-2"><Label htmlFor="time">Time *</Label><Input id="time" name="time" type="time" required /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="price">Price (Rp) *</Label><Input id="price" name="price" type="number" required /></div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">Create Showtime</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="p-0">
                {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : showtimes && showtimes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Film</TableHead><TableHead>Studio</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {showtimes.map((showtime) => (
                        <TableRow key={showtime.id}>
                          <TableCell className="font-semibold">{showtime.film?.title}</TableCell>
                          <TableCell>{showtime.studio?.name}</TableCell>
                          <TableCell>{format(new Date(showtime.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{showtime.time}</TableCell>
                          <TableCell>Rp {showtime.price.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => { if (confirm('Delete?')) deleteShowtime.mutate(showtime.id); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <div className="p-12 text-center">No showtimes yet.</div>}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}