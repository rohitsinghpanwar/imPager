import React from 'react'
import { createContext,useContext,useState } from 'react'
const FlowContext=createContext()
export const FlowProvider=({children})=> {
    const [flowStarted,setFlowStarted]=useState(false);
    const [emailVerified,setEmailVerified]=useState(false);
  return (
    <FlowContext.Provider value={{flowStarted,setFlowStarted,emailVerified,setEmailVerified}}>
        {children}
    </FlowContext.Provider>
  )
}
export const useflow=()=>useContext(FlowContext);
