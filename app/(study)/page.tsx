import documents from '@/lib/documents.json';
import StudyWorkspace from './study-client';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 
 const params=await searchParams;
 const doc=documents.find(item=>item.id===params.doc);
 const requestedPage=Number(params.page);
 const page=doc&&Number.isInteger(requestedPage)&&requestedPage>=1&&requestedPage<=doc.pages?requestedPage:doc?.startPage;
 return <StudyWorkspace initialContext={doc&&page?{docId:doc.id,page}:undefined}/>;
}
