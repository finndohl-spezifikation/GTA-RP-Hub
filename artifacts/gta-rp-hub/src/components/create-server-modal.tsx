import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateServer, getListServersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";

const schema = z.object({
  name: z.string().min(2, "Servername muss mindestens 2 Zeichen lang sein"),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export default function CreateServerModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createServer = useCreateServer();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      isPublic: true,
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    createServer.mutate({ data: values }, {
      onSuccess: (server) => {
        queryClient.invalidateQueries({ queryKey: getListServersQueryKey() });
        toast({ title: "Server erstellt", description: `${server.name} wurde erfolgreich gegründet.` });
        onOpenChange(false);
        form.reset();
        setLocation(`/app/servers/${server.id}`);
      },
      onError: () => {
        toast({ title: "Fehler", description: "Der Server konnte nicht erstellt werden.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Neuen Server erstellen</DialogTitle>
          <DialogDescription>
            Gründe deine eigene Fraktion oder Community.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servername</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. LSPD Hauptquartier" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Polizei, Mafia, Krankenhaus" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Input placeholder="Kurze Beschreibung deines Servers" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Abbrechen
              </Button>
              <Button type="submit" disabled={createServer.isPending}>
                {createServer.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Erstellen
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
