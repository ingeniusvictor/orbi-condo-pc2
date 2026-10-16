import type {ReactNode} from "react";
import PrivateApiFailureReference from "./private-api-failure-reference";
import SessionRecoveryGate from "./session-recovery-gate";

export default function OperationsLayout({children}:{children:ReactNode}){
 return <><SessionRecoveryGate>{children}</SessionRecoveryGate><PrivateApiFailureReference/></>;
}
