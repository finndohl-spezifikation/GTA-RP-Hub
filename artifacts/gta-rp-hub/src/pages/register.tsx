import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

const registerSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein"),
  displayName: z.string().min(1, "Anzeigename ist erforderlich"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const registerMutation = useRegisterUser();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), data);
        toast({ title: "Erfolgreich registriert", description: "Willkommen in Los Santos." });
        setLocation("/app");
      },
      onError: () => {
        toast({ title: "Fehler", description: "Registrierung fehlgeschlagen. Versuche es mit einem anderen Benutzernamen.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-2xl relative z-10">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded bg-primary mx-auto mb-4 flex items-center justify-center font-bold text-primary-foreground text-xl">
            RP
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Neues Leben beginnen</h2>
          <p className="text-sm text-muted-foreground mt-2">Erstelle dein Konto, um der Stadt beizutreten.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benutzername</FormLabel>
                  <FormControl>
                    <Input placeholder="maxmustermann" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anzeigename</FormLabel>
                  <FormControl>
                    <Input placeholder="Max Mustermann" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-semibold" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Registrieren
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Bereits ein Konto? <Link href="/login" className="text-primary hover:underline font-medium">Anmelden</Link>
        </div>
      </div>
    </div>
  );
}
