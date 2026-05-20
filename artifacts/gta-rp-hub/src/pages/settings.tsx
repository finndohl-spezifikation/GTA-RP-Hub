import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetCurrentUser, useUpdateCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
const UserUpdateStatus = { online: "online", idle: "idle", dnd: "dnd", offline: "offline" } as const;
type UserUpdateStatusValue = typeof UserUpdateStatus[keyof typeof UserUpdateStatus];

const schema = z.object({
  displayName: z.string().min(1, "Anzeigename ist erforderlich"),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  status: z.enum(["online", "idle", "dnd", "offline"]),
  rpStatus: z.string().optional(),
});

export default function Settings() {
  const { data: user } = useGetCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
      status: (user?.status as UserUpdateStatus) || UserUpdateStatus.online,
      rpStatus: user?.rpStatus || "",
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    updateCurrentUser.mutate({ data: values }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), data);
        toast({ title: "Einstellungen gespeichert", description: "Dein Profil wurde aktualisiert." });
      },
      onError: () => {
        toast({ title: "Fehler", description: "Einstellungen konnten nicht gespeichert werden.", variant: "destructive" });
      }
    });
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <header className="h-16 border-b border-border flex items-center px-6 shrink-0 shadow-sm">
        <h1 className="font-bold text-xl">Benutzereinstellungen</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="flex items-center gap-6 p-6 bg-card rounded-xl border border-border">
            <Avatar className="w-24 h-24 rounded-lg">
              <AvatarImage src={form.watch("avatarUrl")} />
              <AvatarFallback className="rounded-lg text-2xl bg-primary/20 text-primary">
                {form.watch("displayName")?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{form.watch("displayName")}</h2>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-xl border border-border">
              <h3 className="text-lg font-bold border-b border-border pb-2 mb-4">Profil bearbeiten</h3>
              
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anzeigename</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Über mich</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Schreibe etwas über dich..." className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Online-Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Status wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UserUpdateStatus.online}>Online</SelectItem>
                          <SelectItem value={UserUpdateStatus.idle}>Abwesend</SelectItem>
                          <SelectItem value={UserUpdateStatus.dnd}>Bitte nicht stören</SelectItem>
                          <SelectItem value={UserUpdateStatus.offline}>Unsichtbar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rpStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RP Status (In-Game)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. Im Dienst, Im Krankenhaus..." className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateCurrentUser.isPending || !form.formState.isDirty}>
                  {updateCurrentUser.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Änderungen speichern
                </Button>
              </div>
            </form>
          </Form>

        </div>
      </div>
    </div>
  );
}
