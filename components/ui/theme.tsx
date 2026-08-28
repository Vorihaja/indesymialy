'use client';
import { createContext,useCallback,useContext,useEffect,useMemo,useSyncExternalStore,type ReactNode } from 'react';
export type Theme='dark'|'light'|'system';
const storageKey='indesy-theme';
const themeEvent='indesy-theme-change';
const ThemeContext=createContext<{theme:Theme;setTheme:(theme:Theme)=>void}>({theme:'system',setTheme:()=>undefined});
const readTheme=():Theme=>{if(typeof window==='undefined')return 'system';const value=localStorage.getItem(storageKey);return value==='dark'||value==='light'||value==='system'?value:'system'};
const subscribe=(callback:()=>void)=>{window.addEventListener('storage',callback);window.addEventListener(themeEvent,callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener(themeEvent,callback)}};
export function ThemeProvider({children}:{children:ReactNode;defaultTheme?:Theme}){
  const theme=useSyncExternalStore<Theme>(subscribe,readTheme,():Theme=>'system');
  useEffect(()=>{const media=matchMedia('(prefers-color-scheme: light)');const apply=()=>{document.documentElement.dataset.theme=theme==='system'?(media.matches?'light':'dark'):theme};apply();if(theme==='system')media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply)},[theme]);
  const setTheme=useCallback((value:Theme)=>{localStorage.setItem(storageKey,value);window.dispatchEvent(new Event(themeEvent))},[]);
  const context=useMemo(()=>({theme,setTheme}),[theme,setTheme]);
  return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
}
export const useTheme=()=>useContext(ThemeContext);
