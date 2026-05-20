import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useGetUser, getGetUserQueryKey, useGetDmMessages, getGetDmMessagesQueryKey, useSendDmMessage, useGetCurrentUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import DmSidebar from "@/components/dm-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function DmView() {
  const params = useParams();
  const userId = parseInt(params.userId || "0");
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: currentUser } = useGetCurrentUser();
  const { data: otherUser } = useGetUser(userId, { query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) } });
  const { data: messages } = useGetDmMessages(userId, { query: { enabled: !!userId, queryKey: getGetDmMessagesQueryKey(userId), refetchInterval: 3000 } });
  
  const sendMessage = useSendDmMessage();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userId) return;

    sendMessage.mutate({ userId, data: { content } }, {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: getGetDmMessagesQueryKey(userId) });
      }
    });
  };

  if (!otherUser) return null;

  return (
    <>
      <DmSidebar />
      <div className="flex-1 flex flex-col bg-background min-w-0">
        <header className="h-12 border-b border-border flex items-center px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-bold text-lg">@</span>
            <span className="font-bold">{otherUser.displayName}</span>
            <div className={`w-2 h-2 rounded-full ml-2 ${otherUser.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" ref={scrollRef}>
          {!messages || messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-end">
              <div className="mb-4">
                <Avatar className="w-20 h-20 rounded mb-4">
                  <AvatarImage src={otherUser.avatarUrl || ""} />
                  <AvatarFallback className="text-2xl rounded bg-primary/20 text-primary">
                    {otherUser.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-3xl font-bold mb-2">{otherUser.displayName}</h1>
                <p className="text-muted-foreground">
                  Dies ist der Anfang deiner Direktnachrichten-Historie mit <strong>{otherUser.displayName}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
              {messages.map((msg, index) => {
                const isMe = msg.authorId === currentUser?.id;
                const showHeader = index === 0 || messages[index - 1].authorId !== msg.authorId || new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000;
                
                return (
                  <div key={msg.id} className={`group flex gap-4 py-1 hover:bg-white/5 px-2 rounded -mx-2 ${!showHeader && "mt-0"}`}>
                    {showHeader ? (
                      <Avatar className="w-10 h-10 rounded shrink-0">
                        <AvatarImage src={msg.author.avatarUrl || ""} />
                        <AvatarFallback className="rounded bg-primary/20 text-primary">
                          {msg.author.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 shrink-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center mt-1">
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {showHeader && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-foreground hover:underline cursor-pointer">{msg.author.displayName}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                        </div>
                      )}
                      <div className="text-foreground whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 shrink-0">
          <form onSubmit={handleSend} className="relative">
            <Input 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Nachricht an @${otherUser.displayName} senden...`}
              className="pr-12 bg-card border-border h-12"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!content.trim() || sendMessage.isPending}
              className="absolute right-1 top-1 bottom-1 h-10 w-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
