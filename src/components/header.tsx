
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, UserPlus, ListChecks, MessageSquare } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import GeneralFeedbackDialog from './general-feedback-dialog';

export default function Header() {
  const { currentUser, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

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
    <>
      <header className="py-4 px-6 bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" passHref>
            <div className="text-2xl font-bold text-primary cursor-pointer">
              ExplainMate AI
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFeedbackDialogOpen(true)}
              className="hidden sm:inline-flex"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFeedbackDialogOpen(true)}
              className="sm:hidden"
              aria-label="Submit Feedback"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            {loading ? (
              <Button variant="ghost" disabled>Loading...</Button>
            ) : currentUser ? (
              <>
                <span className="text-sm text-muted-foreground hidden md:inline">
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
      <GeneralFeedbackDialog isOpen={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
    </>
  );
}
