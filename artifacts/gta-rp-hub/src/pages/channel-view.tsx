import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { 
  useGetServer, getGetServerQueryKey, 
  useGetChannel, getGetChannelQueryKey,
  useListMessages, getListMessagesQueryKey,
  useSendMessage, useGetCurrentUser 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import ServerSidebar from "@/components/server-sidebar";
import MemberList from "@/components/member-list";
import { Hash, Megaphone, Send, ShieldAlert, Users } from "lucide-react";

export default function ChannelView() {
  const params = useParams();
  const serverId = parseInt(params.serverId || "0");
  const channelId = parseInt(params.channelId || "0");
  
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [content, setContent] = useState("");

  const { data: currentUser } = useGetCurrentUser();
  const { data: server } = useGetServer(serverId, { query: { enabled: !!serverId, queryKey: getGetServerQueryKey(serverId) } });
  const { data: channel } = useGetChannel(serverId, channelId, { query: { enabled: !!channelId, queryKey: getGetChannelQueryKey(serverId, channelId) } });
  
  // Refetch messages every 3s
  const { data: messages } = useListMessages(channelId, { 
    query: { enabled: !!channelId, queryKey: getListMessagesQueryKey(channelId), refetchInterval: 3000 } 
  });
  
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, channelId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !channelId) return;

    sendMessage.mutate({ channelId, data: { content } }, {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(channelId) });
      }
    });
  };

  if (!server || !channel) return null;

  return (
    <>
      <ServerSidebar serverId={serverId} serverName={server.name} serverBanner={server.bannerUrl} />
      
      <div className="flex-1 flex flex-col bg-background min-w-0 h-full">
        <header className="h-12 border-b border-border flex items-center px-4 shrink-0 shadow-sm justify-between bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            {channel.type === 'announcement' ? <Megaphone className="w-5 h-5 text-primary" /> : <Hash className="w-5 h-5 text-muted-foreground" />}
            <span className="font-bold text-lg">{channel.name}</span>
            {channel.topic && (
              <>
                <span className="mx-2 text-border">|</span>
                <span className="text-sm text-muted-foreground truncate max-w-md">{channel.topic}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowMembers(!showMembers)} className={showMembers ? "bg-white/10" : ""}>
              <Users className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative" ref={scrollRef}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          {!messages || messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-end pb-8">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-sidebar-accent flex items-center justify-center mb-4">
                  {channel.type === 'announcement' ? <Megaphone className="w-8 h-8 text-primary" /> : <Hash className="w-8 h-8 text-muted-foreground" />}
                </div>
                <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Willkommen in #{channel.name}!</h1>
                <p className="text-muted-foreground">
                  Dies ist der Anfang des Kanals #{channel.name}. 
                  {channel.type === 'announcement' && " Hier werden wichtige Neuigkeiten veröffentlicht."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end mt-auto min-h-min pb-4">
              {messages.map((msg, index) => {
                const showHeader = index === 0 || 
                  messages[index - 1].authorId !== msg.authorId || 
                  new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000 ||
                  msg.isSystem;
                
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex items-center gap-3 py-2 text-muted-foreground px-4 border-l-2 border-primary/50 bg-primary/5 my-2 rounded-r">
                      <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{msg.content}</span>
                      <span className="text-xs ml-auto">{format(new Date(msg.createdAt), "HH:mm")}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`group flex gap-4 py-1 hover:bg-white/5 px-2 rounded -mx-2 ${!showHeader && "mt-0"}`}>
                    {showHeader ? (
                      <Avatar className="w-10 h-10 rounded shrink-0 border border-border/50 shadow-sm mt-0.5">
                        <AvatarImage src={msg.author.avatarUrl || ""} />
                        <AvatarFallback className="rounded bg-primary/20 text-primary font-bold">
                          {msg.author.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 shrink-0 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center mt-1 font-mono">
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {showHeader && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-foreground hover:underline cursor-pointer">{msg.author.displayName}</span>
                          {/* Faction tag would go here if we fetched it */}
                          <span className="text-xs text-muted-foreground font-mono">{format(new Date(msg.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                        </div>
                      )}
                      <div className="text-foreground whitespace-pre-wrap break-words leading-relaxed text-[15px]">{msg.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 shrink-0 bg-background pt-0">
          <form onSubmit={handleSend} className="relative">
            <Input 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Nachricht an #${channel.name} senden...`}
              className="pr-12 bg-sidebar border-border/50 h-[44px] rounded-xl focus-visible:ring-primary/50"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!content.trim() || sendMessage.isPending}
              className="absolute right-1.5 top-1.5 bottom-1.5 h-[32px] w-[32px] rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
      
      {showMembers && <MemberList serverId={serverId} />}
    </>
  );
}
