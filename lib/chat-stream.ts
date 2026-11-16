export type ToolCall={id:string;name:string;arguments:string};

type ToolCallStartEvent={
  step?:{type?:string;id?:string;name?:string;arguments?:unknown};
};

type ToolArgumentsDelta={
  type?:string;
  arguments?:string;
};

export function toolCallFromStart(event:ToolCallStartEvent):ToolCall|undefined{
  const step=event.step;
  if(step?.type!=="function_call"||!step.name)return undefined;
  const args=step.arguments;
  const initialArguments=typeof args==="string"?args:
    args&&typeof args==="object"&&!Array.isArray(args)&&Object.keys(args).length?JSON.stringify(args):"";
  return {id:step.id??"",name:step.name,arguments:initialArguments};
}

export function appendToolArguments(call:ToolCall|undefined,delta:ToolArgumentsDelta){
  if(call&&delta.type==="arguments_delta")call.arguments+=delta.arguments??"";
}
