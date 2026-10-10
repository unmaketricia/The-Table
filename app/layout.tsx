import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'The Table',description:'Your shared household menu and grocery list.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'The Table',statusBarStyle:'default'},icons:{icon:'/table-favicon.svg',apple:'/apple-touch-icon.png?v=2'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
