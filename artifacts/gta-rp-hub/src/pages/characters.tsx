import { useListMyCharacters, useCreateCharacter, useDeleteCharacter, useUpdateCurrentUser, getListMyCharactersQueryKey, getGetCurrentUserQueryKey, useGetCurrentUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle2, User as UserIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const schema = z.object({
  name: z.string().min(2, "Name ist erforderlich"),
  age: z.coerce.number().min(18, "Mindestens 18 Jahre").max(100),
  occupation: z.string().min(2, "Beruf ist erforderlich"),
  backstory: z.string().optional(),
  imageUrl: z.string().optional(),
});

export default function Characters() {
  const { data: characters, isLoading } = useListMyCharacters();
  const { data: user } = useGetCurrentUser();
  const createCharacter = useCreateCharacter();
  const deleteCharacter = useDeleteCharacter();
  const updateCurrentUser = useUpdateCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      age: 25,
      occupation: "",
      backstory: "",
      imageUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    createCharacter.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMyCharactersQueryKey() });
        toast({ title: "Charakter erstellt", description: `${values.name} ist nun in Los Santos.` });
        setIsModalOpen(false);
        form.reset();
      }
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Bist du sicher, dass du ${name} endgültig löschen möchtest? Dies kann nicht rückgängig gemacht werden (Perma-Death).`)) {
      deleteCharacter.mutate({ characterId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyCharactersQueryKey() });
          toast({ title: "Charakter gelöscht", description: `${name} weilt nicht mehr unter uns.` });
          if (user?.activeCharacterId === id) {
             updateCurrentUser.mutate({ data: { activeCharacterId: null } });
          }
        }
      });
    }
  };

  const handleSetActive = (id: number | null) => {
    updateCurrentUser.mutate({ data: { activeCharacterId: id } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), data);
        toast({ title: "Status aktualisiert", description: id ? "Charakter gewechselt." : "Du bist nun OOC." });
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <header className="h-16 border-b border-border flex items-center px-6 shrink-0 shadow-sm justify-between">
        <div className="flex items-center gap-3">
          <UserIcon className="w-5 h-5 text-muted-foreground" />
          <h1 className="font-bold text-xl">Meine Charaktere</h1>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Neuer Charakter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Einreise nach Los Santos</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vor- und Nachname</FormLabel>
                      <FormControl><Input {...field} className="bg-background" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alter</FormLabel>
                        <FormControl><Input type="number" {...field} className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beruf / Tätigkeit</FormLabel>
                        <FormControl><Input {...field} className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bild URL (optional)</FormLabel>
                      <FormControl><Input {...field} className="bg-background" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="backstory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hintergrundgeschichte</FormLabel>
                      <FormControl><Input {...field} className="bg-background" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createCharacter.isPending}>
                    {createCharacter.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
                    Erstellen
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card animate-pulse rounded-xl border border-border" />)}
            </div>
          ) : characters?.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border">
              <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Keine Charaktere</h3>
              <p className="text-muted-foreground mb-6">Du hast noch keine Charaktere erstellt. Erstelle deinen ersten Charakter, um am Roleplay teilzunehmen.</p>
              <Button onClick={() => setIsModalOpen(true)}>Jetzt erstellen</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters?.map(char => {
                const isActive = user?.activeCharacterId === char.id;
                
                return (
                  <Card key={char.id} className={`bg-card border-border overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-primary border-transparent' : ''}`}>
                    <div className="h-32 bg-muted relative">
                      {char.imageUrl ? (
                         <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
                          <UserIcon className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-3 h-3" /> Aktiv
                        </div>
                      )}
                    </div>
                    <CardHeader className="relative pb-2">
                      <Avatar className="w-16 h-16 rounded-xl border-4 border-card absolute -top-8 left-4 shadow-sm bg-muted">
                        <AvatarImage src={char.imageUrl || ""} />
                        <AvatarFallback className="rounded-xl text-xl bg-sidebar font-bold">
                          {char.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="pt-8">
                        <CardTitle className="text-xl">{char.name}</CardTitle>
                        <CardDescription>{char.age} Jahre • {char.occupation}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {char.backstory || "Keine Hintergrundgeschichte angegeben."}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-border pt-4 bg-background/50">
                      <Button 
                        variant={isActive ? "secondary" : "default"} 
                        size="sm"
                        onClick={() => handleSetActive(isActive ? null : char.id)}
                      >
                        {isActive ? "OOC gehen" : "Spielen"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(char.id, char.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
