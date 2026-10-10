import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'The Table',description:'Your shared household menu and grocery list.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'The Table',statusBarStyle:'default'},icons:{icon:'/table-favicon.svg',apple:'/table-icon.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
