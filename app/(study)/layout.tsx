import type {Metadata} from 'next';
import ThemeProvider from '@/components/theme-provider';
import './globals.css';
export const metadata:Metadata={title:'Stratum (beta) · ARCL1001',description:'ARCL1001 course readings, AI tutor, flashcards and learning expeditions.',robots:{index:true,follow:true}};
export default function StudyLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>;}
