import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const imageEditorPlugin = () => ({
  name: 'binatandang-image-editor',
  transform(source, id) {
    if (!id.endsWith('/src/admin.jsx')) return null

    const cropImage = String.raw`async function cropImage(file,ratio="16:9",zoom=1,pan={x:0,y:0}){
 const src=URL.createObjectURL(file),img=new Image();
 try{await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=src});const[w,h]=ratios[ratio]||ratios["16:9"],baseScale=Math.max(w/img.naturalWidth,h/img.naturalHeight),scale=baseScale*zoom,sw=w/scale,sh=h/scale,maxX=Math.max(0,img.naturalWidth-sw),maxY=Math.max(0,img.naturalHeight-sh),sx=Math.min(Math.max((img.naturalWidth-sw)/2-(pan.x/100)*maxX/2,0),maxX),sy=Math.min(Math.max((img.naturalHeight-sh)/2-(pan.y/100)*maxY/2,0),maxY),c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,sx,sy,sw,sh,0,0,w,h);return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(new File([b],"yayasan-"+Date.now()+".webp",{type:"image/webp"})):reject(new Error("Gagal memproses foto")),"image/webp",.9))}finally{URL.revokeObjectURL(src)}}`

    const imageField = String.raw`function ImageField({label,value,onChange,ratio="16:9",upload,help="Pilih foto, atur rasio, zoom dan posisi foto, lalu lihat hasil crop sebelum digunakan."}){
 const[file,setFile]=useState(null),[preview,setPreview]=useState(value||""),[r,setR]=useState(ratio),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),[busy,setBusy]=useState(false),drag=React.useRef(null);
 useEffect(()=>setPreview(value||""),[value]);
 useEffect(()=>()=>{if(preview?.startsWith("blob:"))URL.revokeObjectURL(preview)},[preview]);
 function choose(e){const f=e.target.files?.[0];e.target.value="";if(!f)return;if(!imageTypes.includes(f.type)||f.size>12*1024*1024){return}setFile(f);setPreview(URL.createObjectURL(f));setZoom(1);setPan({x:0,y:0})}
 function pointerDown(e){if(!file)return;e.currentTarget.setPointerCapture?.(e.pointerId);drag.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y}}
 function pointerMove(e){if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;setPan({x:Math.max(-100,Math.min(100,drag.current.px+dx)),y:Math.max(-100,Math.min(100,drag.current.py+dy))})}
 function pointerUp(){drag.current=null}
 function nudge(x,y){setPan(p=>({x:Math.max(-100,Math.min(100,p.x+x)),y:Math.max(-100,Math.min(100,p.y+y))}))}
 async function usePhoto(){if(!file)return;setBusy(true);try{const url=await upload(file,label.toLowerCase().replace(/[^a-z0-9]+/gi,"-"),r,zoom,pan);if(url){onChange(url);setPreview(url);setFile(null)}}finally{setBusy(false)}}
 const transform="translate("+(pan.x/2)+"px,"+(pan.y/2)+"px) scale("+zoom+")";
 return <div className="image-field"><div className="image-field-head"><label>{label}<small>{help}</small></label><span className="crop-status">{file?"Geser foto di dalam bingkai":"Foto siap digunakan"}</span></div><div className="image-grid"><div className="image-controls"><label className="file-picker"><span>📷 Pilih foto</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={choose}/></label><select value={r} onChange={e=>{setR(e.target.value);setPan({x:0,y:0})}}><option value="16:9">16:9 — Banner / Artikel</option><option value="4:3">4:3 — Agenda / Galeri</option><option value="1:1">1:1 — Kotak</option><option value="3:4">3:4 — Potret</option></select><label>Zoom <input type="range" min="1" max="2.5" step=".05" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><span>{zoom.toFixed(2)}×</span></label><div className="pan-controls"><span>Posisi foto</span><button type="button" aria-label="Geser ke atas" onClick={()=>nudge(0,-5)}>↑</button><button type="button" aria-label="Geser ke kiri" onClick={()=>nudge(-5,0)}>←</button><button type="button" aria-label="Tengah" onClick={()=>setPan({x:0,y:0})}>●</button><button type="button" aria-label="Geser ke kanan" onClick={()=>nudge(5,0)}>→</button><button type="button" aria-label="Geser ke bawah" onClick={()=>nudge(0,5)}>↓</button></div><small className="drag-help">Tarik foto dengan mouse atau jari untuk mengatur kiri/kanan/atas/bawah.</small><div className="image-actions">{file&&<button type="button" onClick={usePhoto} disabled={busy}>{busy?"Memproses…":"✓ Gunakan Foto Ini"}</button>}{value&&<button type="button" className="secondary" onClick={()=>{onChange("");setFile(null);setPreview("");setPan({x:0,y:0})}}>Hapus Foto</button>}</div></div><div className="image-preview"><div className={"crop-frame ratio-"+r.replace(":","x")+(file?" is-draggable":"")} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}><img src={preview||logoUrl} alt="Preview crop" style={{transform:preview&&file?transform:undefined}} draggable="false"/><span className="crop-guide">AREA FOTO</span></div><small>{file?"Preview crop interaktif — belum diunggah":"Preview foto yang akan diterbitkan"}</small></div></div></div>}`

    const galleryUploader = String.raw`function GalleryUploader({upload,onAdded}){
 const[files,setFiles]=useState([]),[ratio,setRatio]=useState("4:3"),[zoom,setZoom]=useState(1),[busy,setBusy]=useState(false),drag=React.useRef({});
 useEffect(()=>()=>files.forEach(x=>URL.revokeObjectURL(x.preview)),[files]);
 function choose(e){const picked=Array.from(e.target.files||[]).filter(f=>imageTypes.includes(f.type)&&f.size<=12*1024*1024);e.target.value="";setFiles(picked.map(file=>({file,preview:URL.createObjectURL(file),pan:{x:0,y:0}})))}
 function move(i,e){const d=drag.current[i];if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;setFiles(fs=>fs.map((f,j)=>j===i?{...f,pan:{x:Math.max(-100,Math.min(100,d.px+dx)),y:Math.max(-100,Math.min(100,d.py+dy))}}:f))}
 function down(i,e){e.currentTarget.setPointerCapture?.(e.pointerId);drag.current[i]={x:e.clientX,y:e.clientY,px:files[i].pan.x,py:files[i].pan.y}}
 function up(i){delete drag.current[i]}
 function nudge(i,x,y){setFiles(fs=>fs.map((f,j)=>j===i?{...f,pan:{x:Math.max(-100,Math.min(100,f.pan.x+x)),y:Math.max(-100,Math.min(100,f.pan.y+y))}}:f))}
 async function uploadAll(){if(!files.length)return;setBusy(true);try{for(const item of files){const url=await upload(item.file,"galeri",ratio,zoom,item.pan);if(url)await onAdded(url,item.file.name.replace(/\.[^.]+$/,""))}setFiles([])}finally{setBusy(false)}}
 return <div className="gallery-uploader"><div className="uploader-head"><div><h3>Upload foto galeri</h3><p>Pilih beberapa foto. Setiap foto dapat digeser, dizoom dan dicek sebelum disimpan.</p></div><label className="file-picker"><span>📷 Pilih foto</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={choose}/></label></div>{files.length>0&&<><div className="uploader-tools"><select value={ratio} onChange={e=>setRatio(e.target.value)}><option value="4:3">4:3 — Galeri</option><option value="16:9">16:9 — Landscape</option><option value="1:1">1:1 — Kotak</option><option value="3:4">3:4 — Potret</option></select><label>Zoom semua <input type="range" min="1" max="2.5" step=".05" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><span>{zoom.toFixed(2)}×</span></label><button type="button" onClick={uploadAll} disabled={busy}>{busy?"Mengunggah…":"✓ Simpan "+files.length+" Foto"}</button></div><div className="upload-preview-grid">{files.map((x,i)=><div className="upload-preview" key={i}><div className={"crop-frame ratio-"+ratio.replace(":","x")+" is-draggable"} onPointerDown={e=>down(i,e)} onPointerMove={e=>move(i,e)} onPointerUp={()=>up(i)} onPointerCancel={()=>up(i)}><img src={x.preview} alt={"Preview "+(i+1)} style={{transform:"translate("+(x.pan.x/2)+"px,"+(x.pan.y/2)+"px) scale("+zoom+")"}} draggable="false"/><span className="crop-guide">AREA FOTO</span></div><div className="mini-pan"><button type="button" onClick={()=>nudge(i,0,-5)}>↑</button><button type="button" onClick={()=>nudge(i,-5,0)}>←</button><button type="button" onClick={()=>nudge(i,0,0)}>●</button><button type="button" onClick={()=>nudge(i,5,0)}>→</button><button type="button" onClick={()=>nudge(i,0,5)}>↓</button></div><small>{x.file.name}</small></div>)}</div></>}</div>}`

    const uploadFunction = String.raw`async function upload(file,prefix,ratio="16:9",zoom=1,pan={x:0,y:0}){if(!file)return null;if(!imageTypes.includes(file.type)||file.size>12*1024*1024){setMessage("Foto harus JPG/PNG/WEBP/GIF dan maksimal 12 MB.");return null}setUploading(true);try{const cropped=await cropImage(file,ratio,zoom,pan),path=session.user.id+"/"+prefix+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)+".webp",res=await supabase.storage.from("MediaArtikel").upload(path,cropped,{contentType:"image/webp",upsert:false});if(res.error)throw res.error;return supabase.storage.from("MediaArtikel").getPublicUrl(path).data.publicUrl}catch(e){setMessage(e.message||"Gagal upload foto");return null}finally{setUploading(false)}}`

    source = source.replace(/async function cropImage[\s\S]*?\n\nfunction Preview/, cropImage + '\n\nfunction Preview')
    source = source.replace(/function ImageField[\s\S]*?\n\nfunction GalleryUploader/, imageField + '\n\nfunction GalleryUploader')
    source = source.replace(/function GalleryUploader[\s\S]*?\n\nfunction SitePreview/, galleryUploader + '\n\nfunction SitePreview')
    source = source.replace(/async function upload\(file,prefix,ratio="16:9",zoom=1\)\{[\s\S]*?\n async function save\(/, uploadFunction + '\n async function save(')
    return { code: source, map: null }
  },
})

export default defineConfig({
  base: './',
  plugins: [react(), imageEditorPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})
