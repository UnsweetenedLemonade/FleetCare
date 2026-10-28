import { LocalRepository } from '../data/local';
import { HttpRepository } from '../data/http';
import type { Repository } from '../data/contracts';
export const config={adapter:import.meta.env.VITE_DATA_ADAPTER||'local',apiUrl:import.meta.env.VITE_API_BASE_URL||'',namespace:'fleetcare-clean-v1',label:''};
export function createRepository():Repository {if(config.adapter==='local')return new LocalRepository();if(config.adapter==='http')return new HttpRepository(config.apiUrl);throw new Error('Neznámý datový adaptér. Nastavte local nebo http.');}
