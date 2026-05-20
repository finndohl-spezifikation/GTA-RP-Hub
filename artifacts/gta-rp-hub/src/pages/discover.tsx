import { useDiscoverServers, useJoinServer, getListServersQueryKey, getDiscoverServersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Search, Users, Shield, Hash, Activity } from "lucide-react";

export default function Discover() {
  const { data: servers, isLoading } = useDiscoverServers();
  const joinServer = useJoinServer();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const handleJoin = (serverId: number) => {
    joinServer.mutate({ serverId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListServersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getDiscoverServersQueryKey() });
        toast({ title: "Server beigetreten", description: "Willkommen auf dem Server." });
        setLocation(`/app/servers/${serverId}`);
      },
      onError: () => {
        toast({ title: "Fehler", description: "Konnte dem Server nicht beitreten.", variant: "destructive" });
      }
    });
  };

  const filteredServers = servers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
    (s.category && s.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <header className="h-16 border-b border-border flex items-center px-6 shrink-0 shadow-sm gap-4">
        <CompassIcon className="w-6 h-6 text-muted-foreground" />
        <h1 className="font-bold text-xl">Entdecken</h1>
        <div className="ml-auto relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Server suchen..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border h-9"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center py-12 rounded-xl bg-card border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <h2 className="text-3xl font-extrabold mb-4 relative z-10">Finde deine Community</h2>
            <p className="text-muted-foreground max-w-xl mx-auto relative z-10">
              Von LSPD über Gangs bis hin zu zivilen Berufen — entdecke öffentliche Server und tauche in neue Roleplay-Szenarien ein.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-card animate-pulse rounded-xl border border-border" />
              ))}
            </div>
          ) : filteredServers?.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Keine Server gefunden, die den Kriterien entsprechen.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers?.map(server => (
                <div key={server.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col group hover:border-primary/50 transition-colors">
                  <div className="h-24 bg-muted relative">
                    {server.bannerUrl && <img src={server.bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
                    <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl bg-sidebar border-[3px] border-card flex items-center justify-center overflow-hidden font-bold text-lg shadow-sm">
                      {server.iconUrl ? (
                        <img src={server.iconUrl} alt="Icon" className="w-full h-full object-cover" />
                      ) : (
                        server.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>
                  <div className="p-4 pt-8 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg leading-tight mb-1 truncate group-hover:text-primary transition-colors">{server.name}</h3>
                    {server.category && (
                      <div className="text-xs text-primary font-medium uppercase tracking-wider mb-2">
                        {server.category}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                      {server.description || "Keine Beschreibung verfügbar."}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {server.memberCount || 0} Mitglieder
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleJoin(server.id)}
                        disabled={joinServer.isPending}
                        className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-4"
                      >
                        Beitreten
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
