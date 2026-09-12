const META_URL='https://busuaaaamcojjtavhrne.supabase.co/storage/v1/object/public/app-downloads/latest.json';
const APK_URL='https://busuaaaamcojjtavhrne.supabase.co/storage/v1/object/public/app-downloads/sempre-penya-latest.apk';

async function loadLatest(){
  try{
    const r=await fetch(`${META_URL}?t=${Date.now()}`,{cache:'no-store'});
    if(!r.ok) return;
    const latest=await r.json();
    const version=document.getElementById('version');
    const download=document.getElementById('download');
    const changes=document.getElementById('changes');
    if(latest.displayVersion&&version) version.textContent=latest.displayVersion;
    if(download) download.href=latest.apkUrl||APK_URL;
    if(latest.changes&&changes) changes.textContent=latest.changes;
  }catch(_){/* El HTML ja conté una versió de reserva funcional. */}
}
loadLatest();