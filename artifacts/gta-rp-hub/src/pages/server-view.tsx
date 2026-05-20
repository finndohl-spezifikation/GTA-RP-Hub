import { useGetServer, useListChannels, getGetServerQueryKey, getListChannelsQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import ServerSidebar from "@/components/server-sidebar";

export default function ServerView() {
  const params = useParams();
  const serverId = parseInt(params.serverId || "0");
  const [, setLocation] = useLocation();

  const { data: server, isLoading: isServerLoading, error: serverError } = useGetServer(serverId, { 
    query: { enabled: !!serverId, queryKey: getGetServerQueryKey(serverId), retry: false } 
  });
  
  const { data: channels, isLoading: isChannelsLoading } = useListChannels(serverId, {
    query: { enabled: !!serverId, queryKey: getListChannelsQueryKey(serverId) }
  });

  useEffect(() => {
    if (serverError) {
      setLocation("/app");
    }
  }, [serverError, setLocation]);

  useEffect(() => {
    // Auto-redirect to first text channel if we are exactly on the server root
    if (channels && channels.length > 0) {
      const firstTextChannel = channels.find(c => c.type === 'text' || c.type === 'announcement');
      if (firstTextChannel) {
        setLocation(`/app/servers/${serverId}/channels/${firstTextChannel.id}`);
      }
    }
  }, [channels, serverId, setLocation]);

  if (isServerLoading || isChannelsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!server) return null;

  return (
    <>
      <ServerSidebar serverId={serverId} serverName={server.name} serverBanner={server.bannerUrl} />
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground p-8 text-center flex-col">
        <div className="w-20 h-20 rounded-[20px] bg-sidebar border border-border flex items-center justify-center mb-6 overflow-hidden shadow-lg">
          {server.iconUrl ? (
            <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold">{server.name.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Willkommen auf {server.name}</h3>
        <p className="max-w-md">
          Wähle einen Kanal in der Seitenleiste, um mit der Kommunikation zu beginnen.
        </p>
      </div>
    </>
  );
}
