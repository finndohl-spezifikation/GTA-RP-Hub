import { useListDmConversations } from "@workspace/api-client-react";
import DmSidebar from "@/components/dm-sidebar";

export default function DmList() {
  const { data: conversations } = useListDmConversations();

  return (
    <>
      <DmSidebar />
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground p-8 text-center flex-col">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Private Kommunikationskanäle</h3>
        <p className="max-w-md">
          Wähle ein Gespräch aus der Seitenleiste, um direkte Nachrichten zu senden.
          Verschlüsselte Kommunikation für sichere Deals und Absprachen.
        </p>
      </div>
    </>
  );
}
