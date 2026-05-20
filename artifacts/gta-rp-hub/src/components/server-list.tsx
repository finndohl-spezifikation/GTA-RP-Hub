import { Link, useLocation } from "wouter";
import { useListServers } from "@workspace/api-client-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Compass, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import CreateServerModal from "./create-server-modal";

export default function ServerList() {
  const [location] = useLocation();
  const { data: servers } = useListServers();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="w-[72px] h-full bg-sidebar flex flex-col items-center py-3 border-r border-sidebar-border z-20 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/app/dm">
            <div className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer ${location.startsWith("/app/dm") ? "bg-primary text-primary-foreground rounded-[16px]" : "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-primary hover:text-primary-foreground"}`}>
              <MessageSquare size={24} />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Direktnachrichten</TooltipContent>
      </Tooltip>

      <Separator className="w-8 h-[2px] bg-sidebar-border my-2" />

      <ScrollArea className="flex-1 w-full flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 pb-2">
          {servers?.map((server) => {
            const isActive = location.startsWith(`/app/servers/${server.id}`);
            return (
              <Tooltip key={server.id}>
                <TooltipTrigger asChild>
                  <Link href={`/app/servers/${server.id}`}>
                    <div className="relative group flex items-center justify-center w-full cursor-pointer">
                      <div className={`absolute left-0 w-1 bg-primary rounded-r-full transition-all duration-300 ${isActive ? "h-10" : "h-0 group-hover:h-5"}`} />
                      <div className={`w-12 h-12 transition-all duration-300 flex items-center justify-center overflow-hidden bg-sidebar-accent text-sidebar-accent-foreground font-bold ${isActive ? "rounded-[16px]" : "rounded-[24px] hover:rounded-[16px]"}`}>
                        {server.iconUrl ? (
                          <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
                        ) : (
                          server.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{server.name}</TooltipContent>
              </Tooltip>
            );
          })}

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer bg-sidebar-accent text-green-500 hover:bg-green-500 hover:text-white mt-2"
              >
                <Plus size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Server hinzufügen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/app/discover">
                <div className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer mt-2 ${location === "/app/discover" ? "bg-green-500 text-white rounded-[16px]" : "bg-sidebar-accent text-green-500 hover:bg-green-500 hover:text-white"}`}>
                  <Compass size={24} />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Server entdecken</TooltipContent>
          </Tooltip>
        </div>
      </ScrollArea>

      <CreateServerModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
}
