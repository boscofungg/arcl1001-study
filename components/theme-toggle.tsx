'use client';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
const subscribe=()=>()=>{};
const clientSnapshot=()=>true;
const serverSnapshot=()=>false;
export default function ThemeToggle(){
  const mounted=useSyncExternalStore(subscribe,clientSnapshot,serverSnapshot);
  const {resolvedTheme,setTheme}=useTheme();
  const dark=mounted&&resolvedTheme==='dark';
  return <button className="theme-toggle" type="button" aria-label="Dark mode" aria-pressed={dark} title={dark?'Switch to light mode':'Switch to dark mode'} disabled={!mounted} onClick={()=>setTheme(dark?'light':'dark')}>{dark?<Sun size={17}/>:<Moon size={17}/>}<span>{dark?'Light':'Dark'}</span></button>;
}
