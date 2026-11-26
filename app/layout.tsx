import './globals.css';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
export const metadata = { title: 'Cashew Global Markets', description: 'World markets, heatmaps, portfolio and journal in one place.' };
const themeScript = `try{var t=localStorage.getItem('cgm_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}`;
const Wrap = ({ children }: { children: ReactNode }) => (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <ClerkProvider signInUrl="/signin" signUpUrl="/signin" afterSignOutUrl="/signin">{children}</ClerkProvider> : <>{children}</>);
export default function Root({ children }: { children: ReactNode }) {
  return (<Wrap><html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><link rel="preconnect" href="https://fonts.googleapis.com" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" /></head><body>{children}</body></html></Wrap>);
}
