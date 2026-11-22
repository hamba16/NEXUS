import type {ReactNode}from'react';export function UiSwitch({v1,v2}:{v1:ReactNode;v2:ReactNode}){return process.env.NEXT_PUBLIC_UI_V2==='on'?<>{v2}</>:<>{v1}</>}
