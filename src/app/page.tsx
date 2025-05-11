import QuestionExplainer from '@/components/question-explainer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-8 md:pt-12 bg-background">
      <div className="w-full max-w-2xl mx-auto mb-6 flex justify-end">
        <Link href="/saved-notes" passHref>
          <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <ListChecks className="mr-2 h-4 w-4" />
            View Saved Notes
          </Button>
        </Link>
      </div>
      <QuestionExplainer />
    </main>
  );
}
