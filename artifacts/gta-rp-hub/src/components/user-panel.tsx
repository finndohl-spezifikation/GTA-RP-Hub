import { useGetCurrentUser, useUpdateCurrentUser, useListMyCharacters, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, User as UserIcon, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useLogoutUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function UserPanel() {
  const { data: user } = useGetCurrentUser();
  const { data: characters } = useListMyCharacters();
  const updateCurrentUser = useUpdateCurrentUser();
  const logoutUser = useLogoutUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const activeCharacter = characters?.find(c => c.id === user.activeCharacterId);

  const handleLogout = () => {
    logoutUser.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  const handleCharacterSwitch = (characterId: number | null) => {
    updateCurrentUser.mutate({ data: { activeCharacterId: characterId } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), data);
        toast({ title: "Charakter gewechselt", description: characterId ? `Du spielst nun als ${characters?.find(c => c.id === characterId)?.name}` : "Du bist nun OOC." });
      }
    });
  };

  const statusColors = {
    online: "bg-green-500",
    idle: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500",
  };

  return (
    <div className="bg-card p-3 flex items-center gap-3 border-t border-border shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex-1 flex items-center gap-2 text-left hover:bg-white/5 p-1 rounded transition-colors group overflow-hidden">
            <div className="relative shrink-0">
              <Avatar className="w-8 h-8 rounded border border-border">
                <AvatarImage src={user.avatarUrl || ""} />
                <AvatarFallback className="rounded bg-primary/20 text-primary">{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${statusColors[user.status]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {activeCharacter ? activeCharacter.name : user.displayName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.rpStatus || (activeCharacter ? activeCharacter.occupation : "In den Menüs")}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-card border-border">
          <DropdownMenuLabel>Mein Konto</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/app/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Einstellungen
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Aktiver Charakter</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleCharacterSwitch(null)} className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" /> Out of Character (OOC)
            {!user.activeCharacterId && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          {characters?.map(char => (
            <DropdownMenuItem key={char.id} onClick={() => handleCharacterSwitch(char.id)} className="cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary/20 mr-2 flex items-center justify-center text-[8px]">
                {char.name.charAt(0)}
              </div>
              {char.name}
              {user.activeCharacterId === char.id && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <Link href="/app/characters" className="cursor-pointer text-primary">
              <Plus className="mr-2 h-4 w-4" /> Neuen Charakter erstellen...
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" /> Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1 shrink-0">
        <Link href="/app/settings">
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
            <Settings size={18} />
          </button>
        </Link>
      </div>
    </div>
  );
}
