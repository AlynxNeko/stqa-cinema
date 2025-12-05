import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, Showtime, SeatStatus } from '@/lib/supabase';
import { format } from 'date-fns';

export default function SelectSeats() {
  const [, params] = useRoute('/select-seats/:showtimeId');
  const showtimeId = params?.showtimeId;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  const { data: showtime } = useQuery<Showtime>({
    queryKey: ['/api/showtimes', showtimeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('showtimes')
        .select('*, film:films(*), studio:studios(*)')
        .eq('id', showtimeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!showtimeId,
  });

  const { data: seatStatuses, isLoading } = useQuery<SeatStatus[]>({
    queryKey: ['/api/seat-statuses', showtimeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seat_statuses')
        .select('*, seat:seats(*)')
        .eq('showtime_id', showtimeId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!showtimeId,
    refetchInterval: 3000,
  });

  const toggleSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const getSeatStatus = (seatId: string) => {
    const status = seatStatuses?.find((s) => s.seat_id === seatId);
    return status?.status || 'Available';
  };

  const handleContinue = () => {
    if (selectedSeats.length > 0 && showtimeId) {
      const params = new URLSearchParams({
        showtimeId,
        seats: selectedSeats.join(','),
      });
      setLocation(`/checkout?${params.toString()}`);
    }
  };

  const totalSeats = showtime?.studio?.capacity || 0;
  const rows = Math.ceil(totalSeats / 10);
  const seatsPerRow = 10;

  return (
    <div className="min-h-screen bg-background">
      <UserNav />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-8">
                  <div className="bg-muted rounded-lg py-3 text-center mb-6">
                    <span className="text-sm font-medium uppercase tracking-wide">SCREEN</span>
                  </div>

                  <div className="flex justify-center gap-4 text-xs sm:text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-foreground rounded" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary rounded" />
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted-foreground/20 border-2 border-muted-foreground/40 rounded" />
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted border-2 border-border rounded" />
                      <span>Booked</span>
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-pulse text-muted-foreground">Loading seats...</div>
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-3 overflow-x-auto pb-4">
                    {[...Array(rows)].map((_, rowIndex) => {
                      const rowLetter = String.fromCharCode(65 + rowIndex);
                      return (
                        <div key={rowIndex} className="flex justify-center items-center gap-1 sm:gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-3 sm:w-4 flex-shrink-0">{rowLetter}</span>
                          <div className="flex gap-1 sm:gap-2">
                            {[...Array(seatsPerRow)].map((_, seatIndex) => {
                              const seatNumber = `${rowLetter}${seatIndex + 1}`;
                              const seatObj = seatStatuses?.find(
                                (s) => s.seat?.seat_number === seatNumber
                              );
                              const seatId = seatObj?.seat_id || '';
                              const status = getSeatStatus(seatId);
                              const isSelected = selectedSeats.includes(seatId);
                              const isDisabled = status === 'Booked' || status === 'Pending';

                              return (
                                <button
                                  key={seatIndex}
                                  onClick={() => !isDisabled && toggleSeat(seatId)}
                                  disabled={isDisabled}
                                  className={`
                                    w-10 h-10 rounded text-xs font-mono font-medium transition-all
                                    ${isSelected 
                                      ? 'border-4 border-primary bg-primary/10' 
                                      : status === 'Booked'
                                      ? 'bg-muted border-2 border-border cursor-not-allowed'
                                      : status === 'Pending'
                                      ? 'bg-muted-foreground/20 border-2 border-muted-foreground/40 cursor-not-allowed'
                                      : 'border-2 border-foreground hover-elevate active-elevate-2'
                                    }
                                  `}
                                  data-testid={`seat-${seatNumber}`}
                                >
                                  {seatIndex + 1}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
                
                {showtime && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Film</p>
                      <p className="font-semibold">{showtime.film?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-semibold">
                        {format(new Date(showtime.date), 'EEEE, MMM d, yyyy')}
                      </p>
                      <p className="text-sm">{showtime.time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Studio</p>
                      <p className="font-semibold">{showtime.studio?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Selected Seats</p>
                      {selectedSeats.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedSeats.map((seatId) => {
                            const seat = seatStatuses?.find((s) => s.seat_id === seatId)?.seat;
                            return (
                              <Badge key={seatId} variant="secondary">
                                {seat?.seat_number}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No seats selected</p>
                      )}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Price per seat</span>
                        <span>Rp {showtime.price.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Seats</span>
                        <span>{selectedSeats.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>Rp {(selectedSeats.length * showtime.price).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={selectedSeats.length === 0}
                  onClick={handleContinue}
                  data-testid="button-continue"
                >
                  Continue to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
