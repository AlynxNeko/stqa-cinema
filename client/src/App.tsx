import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";

import Login from "@/pages/login";
import Films from "@/pages/films";
import FilmDetail from "@/pages/film-detail";
import SelectSeats from "@/pages/select-seats";
import Checkout from "@/pages/checkout";
import MyBookings from "@/pages/my-bookings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminFilms from "@/pages/admin/films";
import AdminShowtimes from "@/pages/admin/showtimes";
import AdminBookings from "@/pages/admin/bookings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/films" />
      </Route>
      <Route path="/login" component={Login} />
      
      <Route path="/films">
        <ProtectedRoute>
          <Films />
        </ProtectedRoute>
      </Route>
      
      <Route path="/films/:id">
        <ProtectedRoute>
          <FilmDetail />
        </ProtectedRoute>
      </Route>
      
      <Route path="/select-seats/:showtimeId">
        <ProtectedRoute>
          <SelectSeats />
        </ProtectedRoute>
      </Route>
      
      <Route path="/checkout">
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-bookings">
        <ProtectedRoute>
          <MyBookings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/dashboard">
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/films">
        <ProtectedRoute requireAdmin>
          <AdminFilms />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/showtimes">
        <ProtectedRoute requireAdmin>
          <AdminShowtimes />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/bookings">
        <ProtectedRoute requireAdmin>
          <AdminBookings />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
