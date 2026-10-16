import type {ReactNode} from "react";
import PrivateApiFailureReference from "./private-api-failure-reference";

export default function OperationsLayout({children}:{children:ReactNode}){
 return <>{children}<PrivateApiFailureReference/></>;
}
