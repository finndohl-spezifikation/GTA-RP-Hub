import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
            RP
          </div>
          <span className="text-xl font-bold tracking-tight">GTA RP Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Anmelden
          </Link>
          <Link href="/register">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Registrieren
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="z-10 max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight">
            Willkommen in <br/> <span className="text-primary">Los Santos</span>
          </h1>
          <p className="text-xl text-muted-foreground md:px-16">
            Die ultimative Kommunikationszentrale für GTA Roleplay. Koordiniere Einsätze, plane Heists und bleibe mit deiner Fraktion in Kontakt.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                Jetzt beitreten
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg font-semibold border-primary/20 hover:bg-primary/10">
                Server entdecken
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
