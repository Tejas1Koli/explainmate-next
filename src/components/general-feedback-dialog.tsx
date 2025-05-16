
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addFeedback } from '@/lib/feedback-storage';
import type { AddFeedbackData } from '@/lib/feedback-storage';
import { useAuth } from '@/contexts/auth-context';

const generalFeedbackSchema = z.object({
  feedbackText: z.string().min(10, { message: "Feedback must be at least 10 characters." }).max(2000, { message: "Feedback must be at most 2000 characters." }),
});

type GeneralFeedbackFormValues = z.infer<typeof generalFeedbackSchema>;

interface GeneralFeedbackDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function GeneralFeedbackDialog({ isOpen, onOpenChange }: GeneralFeedbackDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GeneralFeedbackFormValues>({
    resolver: zodResolver(generalFeedbackSchema),
    defaultValues: {
      feedbackText: "",
    },
  });

  const onSubmit = async (data: GeneralFeedbackFormValues) => {
    setIsSubmitting(true);
    const feedbackData: AddFeedbackData = {
      userId: currentUser?.uid,
      feedbackText: data.feedbackText,
      feedbackType: 'general',
    };

    const success = await addFeedback(feedbackData);
    setIsSubmitting(false);

    if (success) {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping us improve ExplainMate AI!",
      });
      form.reset();
      onOpenChange(false);
    } else {
      toast({
        title: "Error Submitting Feedback",
        description: "Could not submit your feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset(); // Reset form if dialog is closed
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Submit General Feedback</DialogTitle>
          <DialogDescription>
            Have suggestions or encountered an issue? Let us know!
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="feedbackText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us what you think or any issues you've found..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
