import type { Metadata } from "next";
import FloatingNav from "../components/FloatingNav";
import "./globals.css";
import "./oc-pc2.css";
import "./navigation.css";
import "./transformation.css";
import "./icons.css";
import "./community-map.css";
import "./pocket.css";
import "./maintenance-alerts.css";

export const metadata:Metadata={
 title:"Parque Ciudadano II · ORBI Condo",
 description:"Una nueva forma de entender el mantenimiento de tu comunidad.",
 applicationName:"ORBI Condo",
 robots:{index:false,follow:false},
 openGraph:{title:"Parque Ciudadano II · ORBI Condo",description:"Mantenimiento y comunidad, transformados en una experiencia clara y visual.",type:"website"}
};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="es"><body>{children}<FloatingNav/></body></html>
}