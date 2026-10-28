import { StrictMode, Component, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router';
import { createRepository } from './app/config';
import { WorkspaceProvider } from './app/context';
import { Layout } from './app/layout';
import type { Actor } from './domain/models';
import type { Repository } from './data/contracts';
import { Empty, Notice } from './components/ui';
import { Dashboard, DeadlinesPage, DriverWorkspace } from './features/overview';
import { DriverPage, DriversPage, VehiclePage, VehiclesPage } from './features/fleet';
import { AssignmentPage, FaultPage, FaultsPage, OrderPage, OrdersPage, TripPage, TripsPage } from './features/operations';
import { CostsPage, ExpensePage, FuelPage, StatementPage, TransactionPage } from './features/costs';
import { DocumentPage } from './features/documents';
import { ReportsPage } from './features/reports';
import { SettingsPage } from './features/settings';
import './styles/global.css';
const client=new QueryClient();
class ErrorBoundary extends Component<{children:ReactNode},{error:string}>{state={error:''};static getDerivedStateFromError(e:Error){return {error:e.message};}render(){return this.state.error?<div className="fatal"><h1>Pracovní prostor nelze otevřít</h1><Notice error>{this.state.error}</Notice><p>Zkontrolujte konfiguraci a obnovte stránku.</p></div>:this.props.children;}}
function App(){const [repo]=useState<Repository>(()=>createRepository());const [actor,setActor]=useState<Actor>({role:'Fleet manažer',driverId:null});const navigate=useNavigate();const switchActor=async(next:Actor)=>{await client.cancelQueries();client.removeQueries({queryKey:['workspace']});client.removeQueries({queryKey:['search']});client.removeQueries({queryKey:['file']});setActor(next);navigate(next.role==='Řidič'?'/my/vehicle':'/',{replace:true});};const manager=actor.role!=='Řidič';return <WorkspaceProvider key={actor.role+actor.driverId} actor={actor} repo={repo}><Layout onActor={next=>void switchActor(next)}><Routes>{manager?<><Route path="/" element={<Dashboard/>}/><Route path="/vehicles" element={<VehiclesPage/>}/><Route path="/vehicles/:id/:tab?" element={<VehiclePage/>}/><Route path="/drivers" element={<DriversPage/>}/><Route path="/drivers/:id/:tab?" element={<DriverPage/>}/><Route path="/orders" element={<OrdersPage/>}/><Route path="/orders/:id/assign" element={<AssignmentPage/>}/><Route path="/trips" element={<TripsPage/>}/><Route path="/faults" element={<FaultsPage/>}/><Route path="/costs/:tab?" element={<CostsPage/>}/><Route path="/expenses/:id" element={<ExpensePage/>}/><Route path="/statements/:id" element={<StatementPage/>}/><Route path="/transactions/:id" element={<TransactionPage/>}/><Route path="/deadlines" element={<DeadlinesPage/>}/><Route path="/settings/:tab?" element={<SettingsPage/>}/></>:<><Route path="/" element={<Navigate to="/my/vehicle" replace/>}/><Route path="/my/:tab?" element={<DriverWorkspace/>}/></>}<Route path="/orders/:id/:tab?" element={<OrderPage/>}/><Route path="/trips/:id" element={<TripPage/>}/><Route path="/faults/:id" element={<FaultPage/>}/><Route path="/fuels/:id" element={<FuelPage/>}/><Route path="/documents/:id" element={<DocumentPage/>}/><Route path="/reports" element={actor.role==='Vedení'?<ReportsPage/>:<Empty title="Nedostatečná oprávnění" text="Reporty jsou dostupné pouze vedení."/>}/><Route path="*" element={<Empty title="Stránka není dostupná" text="Vyberte některou z dostupných sekcí v navigaci."/>}/></Routes></Layout></WorkspaceProvider>;}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><QueryClientProvider client={client}><BrowserRouter><App/></BrowserRouter></QueryClientProvider></ErrorBoundary></StrictMode>);
