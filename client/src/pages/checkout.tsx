import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { UserNav } from '@/components/user-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase, Showtime } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const showtimeId = params.get('showtimeId');
  const seatIds = params.get('seats')?.split(',') || [];

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

  const { data: seats } = useQuery({
    queryKey: ['/api/seats', seatIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .in('id', seatIds);
      
      if (error) throw error;
      return data;
    },
    enabled: seatIds.length > 0,
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!user || !showtimeId || !paymentProof) {
        throw new Error('Missing required data');
      }

      let paymentProofUrl = null;

      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);
      
      paymentProofUrl = publicUrl;

      const totalPrice = (showtime?.price || 0) * seatIds.length;

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          showtime_id: showtimeId,
          status: 'Pending',
          payment_proof_url: paymentProofUrl,
          total_price: totalPrice,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const bookingSeats = seatIds.map((seatId) => ({
        booking_id: booking.id,
        seat_id: seatId,
      }));

      const { error: seatsError } = await supabase
        .from('booking_seats')
        .insert(bookingSeats);

      if (seatsError) throw seatsError;

      for (const seatId of seatIds) {
        await supabase
          .from('seat_statuses')
          .update({ status: 'Pending' })
          .eq('seat_id', seatId)
          .eq('showtime_id', showtimeId);
      }

      return booking;
    },
    onSuccess: () => {
      toast({
        title: 'Booking submitted!',
        description: 'Your booking is pending admin confirmation.',
      });
      setLocation('/my-bookings');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!paymentProof) {
      toast({
        title: 'Payment proof required',
        description: 'Please upload your payment proof',
        variant: 'destructive',
      });
      return;
    }
    createBooking.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNav />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="text-sm font-medium text-muted-foreground">Select Seats</span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="text-sm font-medium">Upload Proof</span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="text-sm text-muted-foreground">Confirm</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              
              {showtime && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-28 bg-muted rounded overflow-hidden flex-shrink-0">
                      {showtime.film?.poster_url && (
                        <img
                          src={showtime.film.poster_url}
                          alt={showtime.film.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{showtime.film?.title}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {format(new Date(showtime.date), 'EEEE, MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">{showtime.time}</p>
                      <p className="text-sm text-muted-foreground">{showtime.studio?.name}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Selected Seats</p>
                    <div className="flex flex-wrap gap-1">
                      {seats?.map((seat) => (
                        <Badge key={seat.id} variant="secondary">
                          {seat.seat_number}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per seat</span>
                      <span>Rp {showtime.price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats</span>
                      <span>{seatIds.length}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>Rp {(seatIds.length * showtime.price).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Proof</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-proof" className="text-sm font-medium mb-2 block">
                    Upload Payment Proof *
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
                    <input
                      type="file"
                      id="payment-proof"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-file"
                    />
                    <label htmlFor="payment-proof" className="cursor-pointer">
                      {previewUrl ? (
                        <div className="space-y-2">
                          <img
                            src={previewUrl}
                            alt="Payment proof preview"
                            className="max-h-48 mx-auto rounded"
                          />
                          <p className="text-sm text-muted-foreground">{paymentProof?.name}</p>
                          <Button type="button" variant="outline" size="sm">
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Payment Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Transfer to Bank Account: 1234567890</li>
                    <li>Upload screenshot of payment proof</li>
                    <li>Wait for admin confirmation</li>
                  </ol>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!paymentProof || createBooking.isPending}
                  data-testid="button-submit"
                >
                  {createBooking.isPending ? (
                    'Submitting...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
