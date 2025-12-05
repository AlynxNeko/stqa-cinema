import { useQuery } from '@tanstack/react-query';
import { Film, Calendar, Clock, CheckSquare } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const [filmsRes, showtimesRes, bookingsRes] = await Promise.all([
        supabase.from('films').select('*', { count: 'exact', head: true }),
        supabase.from('showtimes').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      ]);

      return {
        totalFilms: filmsRes.count || 0,
        activeShowtimes: showtimesRes.count || 0,
        pendingBookings: bookingsRes.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: 'Total Films',
      value: stats?.totalFilms || 0,
      icon: Film,
      description: 'Films in database',
    },
    {
      title: 'Active Showtimes',
      value: stats?.activeShowtimes || 0,
      icon: Calendar,
      description: 'Scheduled showtimes',
    },
    {
      title: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      icon: Clock,
      description: 'Awaiting confirmation',
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="w-10" />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Welcome to Admin Panel</h2>
                <p className="text-muted-foreground">Manage your cinema operations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold mb-1">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/admin/films" className="block p-4 border rounded-lg hover-elevate active-elevate-2" data-testid="link-manage-films">
                      <div className="flex items-center gap-3">
                        <Film className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">Manage Films</h3>
                          <p className="text-sm text-muted-foreground">Add, edit, or remove films</p>
                        </div>
                      </div>
                    </a>
                    <a href="/admin/showtimes" className="block p-4 border rounded-lg hover-elevate active-elevate-2" data-testid="link-schedule-showtimes">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">Schedule Showtimes</h3>
                          <p className="text-sm text-muted-foreground">Create screening schedules</p>
                        </div>
                      </div>
                    </a>
                    <a href="/admin/bookings" className="block p-4 border rounded-lg hover-elevate active-elevate-2" data-testid="link-review-bookings">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">Review Bookings</h3>
                          <p className="text-sm text-muted-foreground">Confirm or reject tickets</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
