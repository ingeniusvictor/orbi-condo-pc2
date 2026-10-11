import type { Metadata } from "next";
import FloatingNav from "../components/FloatingNav";
import PrivateOperationsActivity from "../components/PrivateOperationsActivity";
import PrivateOperationsViewport from "../components/PrivateOperationsViewport";
import "./globals.css";
import "./oc-pc2.css";
import "./navigation.css";
import "./transformation.css";
import "./icons.css";
import "./community-map.css";
import "./pocket.css";
import "./maintenance-alerts.css";
import "./governance-voice.css";
import "./private-operations.css";
import "./concierge-daily.css";
import "./handover.css";

export const metadata:Metadata={
 title:"Parque Ciudadano II · ORBI LIVING",
 description:"Una nueva forma de entender el mantenimiento de tu comunidad.",
 applicationName:"ORBI LIVING",
 robots:{index:false,follow:false},
 openGraph:{title:"Parque Ciudadano II · ORBI LIVING",description:"Mantenimiento y comunidad, transformados en una experiencia clara y visual.",type:"website"}
};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="es"><body><PrivateOperationsViewport/>{children}<PrivateOperationsActivity/><FloatingNav/></body></html>
}
