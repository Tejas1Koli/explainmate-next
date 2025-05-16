
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, UserPlus, UserCircle, ListChecks } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const { currentUser, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error) {
      toast({ title: 'Logout Failed', description: 'Could not log out. Please try again.', variant: 'destructive' });
      console.error('Logout failed', error);
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <header className="py-4 px-6 bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" passHref>
          <div className="text-2xl font-bold text-primary cursor-pointer">
            ExplainMate AI
          </div>
        </Link>
        <nav className="flex items-center gap-3">
          {loading ? (
            <Button variant="ghost" disabled>Loading...</Button>
          ) : currentUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {currentUser.email}
              </span>
               {pathname !== '/saved-notes' && (
                 <Link href="/saved-notes" passHref>
                    <Button variant="outline" size="sm">
                        <ListChecks className="mr-2 h-4 w-4" />
                        My Notes
                    </Button>
                 </Link>
               )}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            !isAuthPage && (
              <>
                <Link href="/login" passHref>
                  <Button variant="ghost" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
                <Link href="/signup" passHref>
                  <Button variant="default" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
