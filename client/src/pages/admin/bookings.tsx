import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Booking } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export default function AdminBookings() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/admin/bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          showtime:showtimes(*, film:films(*), studio:studios(*)),
          booking_seats(*, seat:seats(*))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const booking = bookings?.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      const newStatus = status === 'Confirmed' ? 'Booked' : 'Available';
      
      for (const bs of booking.booking_seats || []) {
        await supabase
          .from('seat_statuses')
          .update({ status: newStatus })
          .eq('seat_id', bs.seat_id)
          .eq('showtime_id', booking.showtime_id);
      }

      return { bookingId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({ title: 'Booking status updated successfully' });
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Confirmed':
        return 'default';
      case 'Rejected':
      case 'Expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-2xl font-bold">Bookings Management</h1>
            <div className="w-32" />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center text-muted-foreground">Loading bookings...</div>
                ) : bookings && bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Film</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                          <TableCell className="font-mono text-sm">
                            {booking.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {booking.showtime?.film?.title}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                {booking.showtime?.date &&
                                  format(new Date(booking.showtime.date), 'MMM d, yyyy')}
                              </div>
                              <div className="text-muted-foreground">{booking.showtime?.time}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {booking.booking_seats?.slice(0, 3).map((bs) => (
                                <Badge key={bs.id} variant="outline" className="text-xs">
                                  {bs.seat?.seat_number}
                                </Badge>
                              ))}
                              {(booking.booking_seats?.length || 0) > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(booking.booking_seats?.length || 0) - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>Rp {booking.total_price.toLocaleString('id-ID')}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(booking.status)}>
                              {booking.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBooking(booking)}
                              data-testid={`button-view-${booking.id}`}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No bookings yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Booking Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking ID</span>
                      <span className="font-mono">{selectedBooking.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={getStatusVariant(selectedBooking.status)}>
                        {selectedBooking.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Film</span>
                      <span className="font-semibold">{selectedBooking.showtime?.film?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>
                        {selectedBooking.showtime?.date &&
                          format(new Date(selectedBooking.showtime.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span>{selectedBooking.showtime?.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Studio</span>
                      <span>{selectedBooking.showtime?.studio?.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Seats</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedBooking.booking_seats?.map((bs) => (
                      <Badge key={bs.id} variant="secondary">
                        {bs.seat?.seat_number}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price</span>
                    <span>Rp {selectedBooking.total_price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {selectedBooking.status === 'Pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() =>
                        updateBookingStatus.mutate({
                          bookingId: selectedBooking.id,
                          status: 'Confirmed',
                        })
                      }
                      disabled={updateBookingStatus.isPending}
                      className="flex-1"
                      data-testid="button-confirm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        updateBookingStatus.mutate({
                          bookingId: selectedBooking.id,
                          status: 'Rejected',
                        })
                      }
                      disabled={updateBookingStatus.isPending}
                      className="flex-1"
                      data-testid="button-reject"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Payment Proof</h3>
                {selectedBooking.payment_proof_url ? (
                  <div className="space-y-2">
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={selectedBooking.payment_proof_url}
                        alt="Payment proof"
                        className="w-full"
                      />
                    </div>
                    <a
                      href={selectedBooking.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 text-center text-muted-foreground">
                    No payment proof uploaded
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
