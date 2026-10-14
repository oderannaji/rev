import {useEffect,useRef,useState} from 'react';
export function useLiveScripture({utterance,translation,enabled,neural}){
  const [state,setState]=useState({results:[],kind:'none',busy:false}),context=useRef(null),latest=useRef(null),busy=useRef(false),serial=useRef(0),alive=useRef(true),request=useRef(null);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;latest.current=null;request.current?.abort();};},[]);
  useEffect(()=>{context.current=null;setState({results:[],kind:'none',busy:false});},[translation]);
  useEffect(()=>{
    const version=++serial.current;latest.current=null;
    if(!enabled||!utterance.text){setState(s=>({...s,busy:false}));return;}
    async function run(){
      if(busy.current)return;busy.current=true;
      try{while(alive.current&&latest.current){const task=latest.current;latest.current=null;setState(s=>({...s,busy:true}));request.current=new AbortController();
        try{const response=await fetch('/api/scripture/detect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...task.input,context:context.current}),signal:request.current.signal});const data=await response.json();if(!response.ok)throw Error(data.error);if(alive.current&&task.version===serial.current){if(data.context)context.current=data.context;setState({...data,busy:false});}}
        catch(e){if(alive.current&&task.version===serial.current)setState(s=>({...s,busy:false,warning:e.message}));}
      }}finally{busy.current=false;}
    }
    const timer=setTimeout(()=>{latest.current={version,input:{text:utterance.text.slice(-1500),final:utterance.final,translation,neural}};void run();},350);
    return()=>clearTimeout(timer);
  },[utterance,translation,enabled,neural]);
  return state;
}
