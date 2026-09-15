import { getSource, getDocumentPages } from '@/lib/retrieval';
import documents from '@/lib/documents.json';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id=params.get('id');
  if(id) { const source=getSource(id); return Response.json(source ?? {error:'Source not found'}, {status:source?200:404}); }
  const doc=documents.find(d=>d.id===params.get('doc'));
  if(!doc) return Response.json({error:'Document not found'},{status:404});
  return Response.json({document:doc,passages:getDocumentPages(doc.id)});
}
