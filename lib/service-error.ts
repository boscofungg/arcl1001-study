/** Return only fixed, safe messages. Provider error bodies can contain sensitive metadata. */
export function classifyServiceError(status:number,body:unknown):{code:string;message:string}{
 const error=body&&typeof body==='object'?(body as {error?:unknown}).error:undefined;
 const data=error&&typeof error==='object'?error as {message?:unknown;details?:unknown}:{};
 const message=typeof data.message==='string'?data.message.toLowerCase():'';
 const reasons=Array.isArray(data.details)?data.details.flatMap(detail=>detail&&typeof detail==='object'&&typeof detail.reason==='string'?[detail.reason]:[]):[];
 if(reasons.includes('API_KEY_INVALID')||/api key not valid|invalid api key/.test(message))return {code:'AI_KEY_INVALID',message:'The tutor’s service credential is invalid. The site administrator needs to update it; retrying will not resolve this.'};
 if(/reported as leaked|leaked/.test(message))return {code:'AI_KEY_BLOCKED',message:'The tutor’s service credential has been blocked. The site administrator needs to replace it.'};
 if(status===429)return {code:'AI_QUOTA',message:'The tutor service has reached its quota. Please try again later.'};
 if(status===401||status===403)return {code:'AI_ACCESS_DENIED',message:'The tutor service denied access. The site administrator needs to check its credential and project permissions.'};
 if(status===404)return {code:'AI_MODEL_UNAVAILABLE',message:'The configured tutor model is unavailable. The site administrator needs to check the model setting.'};
 if(status===400)return {code:'AI_REQUEST_INVALID',message:'The tutor service could not accept this request. Try a shorter question; if it persists, contact the site administrator.'};
 return {code:'AI_UNAVAILABLE',message:'The tutor service is temporarily unavailable. Please try again.'};
}
export async function serviceError(response:Response):Promise<Error>{
 let body:unknown;try{body=await response.json();}catch{body=undefined;}
 return new Error(classifyServiceError(response.status,body).message);
}
