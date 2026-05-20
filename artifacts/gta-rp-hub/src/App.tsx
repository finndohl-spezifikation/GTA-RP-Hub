import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard, GuestGuard } from "@/lib/auth-guard";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";

// App pages
import AppShell from "@/components/app-shell";
import Discover from "@/pages/discover";
import Settings from "@/pages/settings";
import Characters from "@/pages/characters";
import ServerView from "@/pages/server-view";
import ChannelView from "@/pages/channel-view";
import DmList from "@/pages/dm-list";
import DmView from "@/pages/dm-view";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <AppShell>
      <Switch>
        <Route path="/app/discover" component={Discover} />
        <Route path="/app/settings" component={Settings} />
        <Route path="/app/characters" component={Characters} />
        <Route path="/app/dm" component={DmList} />
        <Route path="/app/dm/:userId" component={DmView} />
        <Route path="/app/servers/:serverId" component={ServerView} />
        <Route path="/app/servers/:serverId/channels/:channelId" component={ChannelView} />
        <Route path="/app">
          {() => <div className="flex items-center justify-center h-full text-muted-foreground">Wähle einen Server oder eine Direktnachricht aus.</div>}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <GuestGuard><Landing /></GuestGuard>} />
      <Route path="/login" component={() => <GuestGuard><Login /></GuestGuard>} />
      <Route path="/register" component={() => <GuestGuard><Register /></GuestGuard>} />
      <Route path="/app/*" component={() => <AuthGuard><AppRouter /></AuthGuard>} />
      <Route path="/app" component={() => <AuthGuard><AppRouter /></AuthGuard>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
