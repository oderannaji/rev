// Energy-gated utterance windows. Partial snapshots replace one another; finals
// close the utterance. This is windowed local inference, not token streaming.
export function createUtterances({rate,emit,partialSeconds=2,maxSeconds=12,silenceSeconds=.7}) {
  let parts=[],size=0,silent=0,lastPartial=0,id=0,hasVoice=false;
  function snapshot(final){if(size<rate*.5||!hasVoice)return;const samples=new Float32Array(size);let offset=0;for(const part of parts){samples.set(part,offset);offset+=part.length;}emit(samples,{id,final,seconds:size/rate});}
  function finish(){snapshot(true);parts=[];size=0;silent=0;lastPartial=0;hasVoice=false;id++;}
  return {
    push(data){let power=0;for(const n of data)power+=n*n;const voiced=Math.sqrt(power/Math.max(1,data.length))>=.003;
      if(!parts.length&&!voiced)return;
      parts.push(data);size+=data.length;hasVoice ||= voiced;silent=voiced?0:silent+data.length;
      if((silent>=rate*silenceSeconds&&size>=rate)||size>=rate*maxSeconds){finish();return;}
      if(size-lastPartial>=rate*partialSeconds){snapshot(false);lastPartial=size;}
    },
    stop(save=true){if(save)finish();else{parts=[];size=0;hasVoice=false;}}
  };
}
