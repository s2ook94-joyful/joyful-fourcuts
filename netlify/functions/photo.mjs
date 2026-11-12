import { getStore } from '@netlify/blobs';
const storeName='joyful-fourcuts-photos';
export default async (request)=>{
  try {
  const store=getStore(storeName);
  if(request.method==='POST'){
    if(!request.headers.get('content-type')?.startsWith('image/jpeg'))return new Response('JPEG only',{status:415});
    const bytes=await request.arrayBuffer();
    if(bytes.byteLength>15*1024*1024)return new Response('Photo too large',{status:413});
    const id=crypto.randomUUID();
    await store.set(id,bytes,{metadata:{created:Date.now()}});
    return Response.json({url:`/.netlify/functions/photo?id=${encodeURIComponent(id)}`});
  }
  if(request.method==='GET'){
    const id=new URL(request.url).searchParams.get('id');
    if(!id||!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
    const {data,metadata}=await store.getWithMetadata(id,{type:'arrayBuffer'});
    if(!data)return new Response('Not found',{status:404});
    if(!metadata?.created||Date.now()-Number(metadata.created)>24*60*60*1000){await store.delete(id);return new Response('Expired',{status:410})}
    return new Response(data,{headers:{'Content-Type':'image/jpeg','Content-Disposition':'attachment; filename="joyful-fourcuts.jpg"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
  }
  return new Response('Method not allowed',{status:405});
  } catch(error) {
    console.error('photo function failed:', error);
    return Response.json({error:'PHOTO_STORE_ERROR',message:String(error?.message||error)},{status:500});
  }
};
