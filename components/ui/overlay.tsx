'use client';
import { useEffect, type ReactNode } from 'react';
import { IconButton } from './core';
type OverlayProps={open:boolean;onClose:()=>void;title:string;children:ReactNode;footer?:ReactNode};
function useEscape(open:boolean,onClose:()=>void){useEffect(()=>{if(!open)return;const fn=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};document.addEventListener('keydown',fn);return()=>document.removeEventListener('keydown',fn)},[open,onClose])}
export function Dialog({open,onClose,title,children,footer}:OverlayProps){useEscape(open,onClose);if(!open)return null;return <div className='ds-overlay' role='presentation' onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className='ds-dialog' role='dialog' aria-modal='true' aria-labelledby='ds-dialog-title'><header className='ds-dialog-head'><h2 id='ds-dialog-title' className='ds-h3'>{title}</h2><IconButton variant='ghost' aria-label='Fermer' onClick={onClose}>×</IconButton></header><div className='ds-dialog-body'>{children}</div>{footer&&<footer className='ds-dialog-foot'>{footer}</footer>}</div></div>}
export const Modal=Dialog;
export function Drawer({open,onClose,title,children,footer}:OverlayProps){useEscape(open,onClose);if(!open)return null;return <div className='ds-overlay'><aside className='ds-drawer' role='dialog' aria-modal='true' aria-label={title}><header className='ds-dialog-head'><h2 className='ds-h3'>{title}</h2><IconButton variant='ghost' aria-label='Fermer' onClick={onClose}>×</IconButton></header><div className='ds-dialog-body'>{children}</div>{footer}</aside></div>}
export const Sheet=Drawer;
export function Tooltip({content,children}:{content:ReactNode;children:ReactNode}){return <span title={typeof content==='string'?content:undefined}>{children}</span>}
export const Popover=({children}:{children:ReactNode})=><div className='ds-card ds-pad'>{children}</div>;
export const Dropdown=Popover;
export const Toast=({children}:{children:ReactNode})=><div role='status' aria-live='polite' className='ds-alert'>{children}</div>;
export const CommandPalette=Dialog;
