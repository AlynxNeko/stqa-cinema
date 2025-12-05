import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, Booking } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function MyBookings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          showtime:showtimes(*, film:films(*), studio:studios(*)),
          booking_seats(*, seat:seats(*))
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filteredBookings = bookings?.filter((booking) => {
    if (activeTab === 'all') return true;
    return booking.status.toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      case 'Expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

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
    <div className="min-h-screen bg-background">
      <UserNav />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and track your ticket reservations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed" data-testid="tab-confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-6 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBookings && filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="hover-elevate" data-testid={`card-booking-${booking.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-36 bg-muted rounded overflow-hidden flex-shrink-0">
                          {booking.showtime?.film?.poster_url && (
                            <img
                              src={booking.showtime.film.poster_url}
                              alt={booking.showtime.film.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold mb-1">
                                {booking.showtime?.film?.title}
                              </h3>
                              <p className="text-sm text-muted-foreground font-mono">
                                Booking ID: {booking.id.slice(0, 8)}
                              </p>
                            </div>
                            <Badge variant={getStatusVariant(booking.status)} className="gap-1">
                              {getStatusIcon(booking.status)}
                              {booking.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {booking.showtime?.date && 
                                  format(new Date(booking.showtime.date), 'EEEE, MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.showtime?.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.showtime?.studio?.name}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Seats</p>
                              <div className="flex flex-wrap gap-1">
                                {booking.booking_seats?.map((bs) => (
                                  <Badge key={bs.id} variant="outline" className="font-mono">
                                    {bs.seat?.seat_number}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="ml-auto">
                              <p className="text-sm text-muted-foreground mb-1">Total</p>
                              <p className="text-xl font-bold">
                                Rp {booking.total_price.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>

                          {booking.payment_proof_url && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>
                              <a
                                href={booking.payment_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                View uploaded proof
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {activeTab === 'all'
                      ? 'No bookings yet. Start by browsing films!'
                      : `No ${activeTab} bookings found.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
