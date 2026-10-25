export type TutorFailureCode='quota'|'access'|'configuration'|'request'|'unavailable'|'timeout';
export class TutorServiceError extends Error{
 readonly code:TutorFailureCode;
 constructor(code:TutorFailureCode,message:string){super(message);this.name='TutorServiceError';this.code=code;}
}
/** Read only a bounded prefix for classification. Never return/log provider bodies. */
export async function tutorResponseError(response:Response):Promise<TutorServiceError>{
 let prefix='';const reader=response.body?.getReader();
 if(reader){try{let size=0;const decoder=new TextDecoder();while(size<4096){const {value,done}=await reader.read();if(done)break;prefix+=decoder.decode(value.subarray(0,4096-size));size+=value.byteLength;}}catch{}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}}
 if(response.status===429||/insufficient\s+tokens?\b|token\s+(?:balance|quota)\s+(?:exhausted|exceeded)|quota\s+exceeded/i.test(prefix))return new TutorServiceError('quota','The university tutor service has insufficient tokens or has reached its quota. Please try again later.');
 if(response.status===401||response.status===403)return new TutorServiceError('access','The university tutor service denied access. The site administrator needs to check its subscription key.');
 if(response.status===404)return new TutorServiceError('configuration','The university tutor model is unavailable. Please contact the site administrator.');
 if(response.status===400)return new TutorServiceError('request','The university tutor service could not accept this request. Please contact the site administrator.');
 return new TutorServiceError('unavailable','The university tutor service is temporarily unavailable. Please try again.');
}
