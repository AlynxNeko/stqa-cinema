import { Link, useLocation } from 'wouter';
import { Film, User, LogOut, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function UserNav() {
  const { profile, signOut } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/films" className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1 rounded-md">
          <img src="/CB_logo.png" alt="CinemaBook Logo" className="h-10 w-10"/>
          <span className="text-xl font-bold">CinemaBook</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/films">
            <Button 
              variant={isActive('/films') ? 'default' : 'ghost'}
              data-testid="link-films"
            >
              <Film className="h-4 w-4 mr-2" />
              Browse Films
            </Button>
          </Link>
          <Link href="/my-bookings">
            <Button 
              variant={isActive('/my-bookings') ? 'default' : 'ghost'}
              data-testid="link-bookings"
            >
              <Ticket className="h-4 w-4 mr-2" />
              My Bookings
            </Button>
          </Link>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile?.name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="md:hidden">
              <Link href="/films" className="flex items-center cursor-pointer">
                <Film className="h-4 w-4 mr-2" />
                Browse Films
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="md:hidden">
              <Link href="/my-bookings" className="flex items-center cursor-pointer">
                <Ticket className="h-4 w-4 mr-2" />
                My Bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="md:hidden" />
            <DropdownMenuItem onClick={() => signOut()} data-testid="button-logout" className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
