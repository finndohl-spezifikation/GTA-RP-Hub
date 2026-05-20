import { useListChannels, useCreateChannel, getListChannelsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation, useParams } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserPanel from "./user-panel";
import { Hash, Plus, Settings, Megaphone, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
const ChannelInputType = { text: "text", voice: "voice", announcement: "announcement", category: "category" } as const;
type ChannelInputTypeValue = typeof ChannelInputType[keyof typeof ChannelInputType];

const schema = z.object({
  name: z.string().min(1, "Kanalname erforderlich"),
  type: z.enum(["text", "voice", "announcement", "category"]),
});

export default function ServerSidebar({ serverId, serverName, serverBanner }: { serverId: number, serverName: string, serverBanner?: string | null }) {
  const [location] = useLocation();
  const { data: channels } = useListChannels(serverId);
  const createChannel = useCreateChannel();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: ChannelInputType.text,
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    createChannel.mutate({ serverId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChannelsQueryKey(serverId) });
        toast({ title: "Kanal erstellt" });
        setIsOpen(false);
        form.reset();
      }
    });
  };

  // Group channels by parent category (simplified: just list texts then voices for now)
  const textChannels = channels?.filter(c => c.type === 'text' || c.type === 'announcement') || [];
  const voiceChannels = channels?.filter(c => c.type === 'voice') || [];

  return (
    <div className="w-60 h-full bg-sidebar flex flex-col border-r border-sidebar-border shrink-0 text-sidebar-foreground">
      <div className="relative h-32 shrink-0 border-b border-sidebar-border shadow-sm">
        {serverBanner ? (
          <img src={serverBanner} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        )}
        <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-sidebar to-transparent">
          <h2 className="font-bold truncate text-lg text-white shadow-sm leading-tight">{serverName}</h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-2 py-3">
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 mb-1 group">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors">Textkanäle</h3>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <button className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors opacity-0 group-hover:opacity-100">
                  <Plus className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Kanal erstellen</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kanaltyp</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={ChannelInputType.text}>Textkanal</SelectItem>
                              <SelectItem value={ChannelInputType.announcement}>Ankündigungen</SelectItem>
                              <SelectItem value={ChannelInputType.voice}>Sprachkanal</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kanalname</FormLabel>
                          <FormControl><Input {...field} className="bg-background" placeholder="z.b. dienstbesprechung" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createChannel.isPending}>Erstellen</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isActive = location === `/app/servers/${serverId}/channels/${channel.id}`;
              const Icon = channel.type === 'announcement' ? Megaphone : Hash;
              return (
                <Link key={channel.id} href={`/app/servers/${serverId}/channels/${channel.id}`}>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-all ${isActive ? "bg-sidebar-primary/20 text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                    <span className="truncate">{channel.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {voiceChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-1 group">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground/70 group-hover:text-sidebar-foreground">Sprachkanäle</h3>
            </div>
            <div className="space-y-0.5">
              {voiceChannels.map((channel) => {
                return (
                  <div key={channel.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <Volume2 className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
      
      <UserPanel />
    </div>
  );
}
