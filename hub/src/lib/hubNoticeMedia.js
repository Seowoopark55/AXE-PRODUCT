const STORED_IMAGE_RE=/\[\[LAC_NOTICE_IMAGE\|(?<path>notices\/[0-9a-f-]{36}\.(?:png|jpg|webp))\]\]/gi;
const editorMarker=key=>`[[사진 ${key}]]`;

export function noticeImagePaths(body){
  const text=String(body??'');
  const paths=[];
  for(const match of text.matchAll(STORED_IMAGE_RE)){
    const path=String(match.groups?.path||'').trim();
    if(path&&!paths.includes(path))paths.push(path);
  }
  return paths;
}

export function noticeBodyForEditor(body,urlForPath=()=>'',existingMedia=[]){
  const text=String(body??'');
  const byPath=new Map((existingMedia||[]).filter(item=>item?.path).map(item=>[String(item.path),item]));
  const media=[];
  let seq=0;
  const editorBody=text.replace(STORED_IMAGE_RE,(whole,_path,offset,input,groups)=>{
    const path=String(groups?.path||_path||'').trim();
    seq+=1;
    const previous=byPath.get(path);
    media.push({key:String(seq),path,url:previous?.url||urlForPath(path)||'',isNew:false,removed:false});
    return editorMarker(seq);
  });
  return {editorBody,media,nextSeq:seq};
}

export function serializeNoticeEditorBody(editorBody,media=[]){
  let text=String(editorBody??'');
  for(const item of media){
    if(!item||item.removed||!item.path||!item.key)continue;
    text=text.split(editorMarker(item.key)).join(`[[LAC_NOTICE_IMAGE|${item.path}]]`);
  }
  return text.trim();
}

export function noticeBodySegments(body){
  const text=String(body??'');
  const segments=[];
  let cursor=0;
  for(const match of text.matchAll(STORED_IMAGE_RE)){
    const index=match.index??0;
    if(index>cursor)segments.push({type:'text',value:text.slice(cursor,index)});
    const path=String(match.groups?.path||'').trim();
    if(path)segments.push({type:'image',path});
    else segments.push({type:'text',value:match[0]});
    cursor=index+match[0].length;
  }
  if(cursor<text.length)segments.push({type:'text',value:text.slice(cursor)});
  return segments.length?segments:[{type:'text',value:text}];
}

export function markerForNoticeImage(key){return editorMarker(key);}
