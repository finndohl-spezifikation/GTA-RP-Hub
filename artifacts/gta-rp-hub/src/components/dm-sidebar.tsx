import { useListDmConversations } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserPanel from "./user-panel";

export default function DmSidebar() {
  const [location] = useLocation();
  const { data: conversations } = useListDmConversations();

  return (
    <div className="w-60 h-full bg-card flex flex-col border-r border-border shrink-0">
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0 font-bold shadow-sm">
        Direktnachrichten
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {conversations?.map((conv) => {
            const isActive = location === `/app/dm/${conv.userId}`;
            return (
              <Link key={conv.userId} href={`/app/dm/${conv.userId}`}>
                <div className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isActive ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                  <div className="relative shrink-0">
                    <Avatar className="w-8 h-8 rounded border border-border/50">
                      <AvatarImage src={conv.user.avatarUrl || ""} />
                      <AvatarFallback className="rounded bg-primary/20 text-primary">
                        {conv.user.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${conv.user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{conv.user.displayName}</div>
                    <div className="text-xs truncate opacity-70">{conv.lastMessage?.content || "Keine Nachrichten"}</div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          
          {conversations?.length === 0 && (
            <div className="text-center text-xs text-muted-foreground p-4">
              Keine aktiven Gespräche.
            </div>
          )}
        </div>
      </ScrollArea>
      
      <UserPanel />
    </div>
  );
}
