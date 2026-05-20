import { useListMembers } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MemberList({ serverId }: { serverId: number }) {
  const { data: members } = useListMembers(serverId);

  if (!members) return null;

  // Group by role or status (simplified: online vs offline for now)
  const onlineMembers = members.filter(m => m.user.status === 'online' || m.user.status === 'dnd' || m.user.status === 'idle');
  const offlineMembers = members.filter(m => m.user.status === 'offline');

  const MemberItem = ({ member }: { member: any }) => (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/5 cursor-pointer group transition-colors">
      <div className="relative shrink-0">
        <Avatar className="w-8 h-8 rounded border border-border/50">
          <AvatarImage src={member.user.avatarUrl || ""} />
          <AvatarFallback className="rounded bg-primary/20 text-primary">
            {member.nickname ? member.nickname.substring(0, 2).toUpperCase() : member.user.displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
          member.user.status === 'online' ? 'bg-green-500' : 
          member.user.status === 'idle' ? 'bg-yellow-500' : 
          member.user.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-[14px] font-medium truncate group-hover:text-primary transition-colors">
            {member.nickname || member.user.displayName}
          </div>
          {member.factionTag && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase">
              {member.factionTag}
            </span>
          )}
        </div>
        {(member.user.rpStatus || member.user.bio) && (
          <div className="text-[11px] text-muted-foreground truncate">
            {member.user.rpStatus || member.user.bio}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-60 h-full bg-card border-l border-border shrink-0 flex flex-col">
      <ScrollArea className="flex-1 p-3">
        {onlineMembers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
              Online — {onlineMembers.length}
            </h3>
            <div className="space-y-0.5">
              {onlineMembers.map(m => <MemberItem key={m.id} member={m} />)}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
              Offline — {offlineMembers.length}
            </h3>
            <div className="space-y-0.5 opacity-60 hover:opacity-100 transition-opacity">
              {offlineMembers.map(m => <MemberItem key={m.id} member={m} />)}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
