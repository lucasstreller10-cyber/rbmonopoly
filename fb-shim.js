/* Stellt dieselbe Schnittstelle bereit wie window.claude.use("db"/"user"), aber mit Firebase.
   Spielstände werden als JSON-Text gespeichert (Firestore mag keine verschachtelten Listen),
   die Felder für Abfragen (status, created, at) liegen zusätzlich daneben. */
(function(){
  const cfg=window.FIREBASE_CONFIG;
  let ready=null;
  function init(){
    if(ready)return ready;
    ready=(async()=>{
      if(!cfg||!cfg.apiKey||!window.firebase)return null;
      firebase.initializeApp(cfg);
      const auth=firebase.auth(),fs=firebase.firestore();
      try{fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});}catch(e){}
      const u=auth.currentUser||await new Promise((res,rej)=>{const off=auth.onAuthStateChanged(x=>{if(x){off();res(x);}});auth.signInAnonymously().catch(rej);});
      return {fs,uid:u.uid};
    })().catch(e=>{console.warn("Firebase nicht verfügbar",e);return null;});
    return ready;
  }
  const IDX=["status","created","at"];
  const pack=v=>{const o={_j:JSON.stringify(v)};IDX.forEach(k=>{if(v&&v[k]!==undefined)o[k]=v[k];});return o;};
  const unpack=d=>{if(!d)return undefined;if(typeof d._j==="string")return JSON.parse(d._j);return d;};
  const snapOf=s=>({id:s.id,exists:s.exists,data:()=>unpack(s.data())});
  function makeDb(fs,uid){
    const leaseRef=path=>fs.collection("leases").doc(path.replace(/\//g,"__"));
    function docRef(path){
      const r=fs.doc(path);
      return {
        path,
        get:async()=>snapOf(await r.get()),
        set:async v=>{await r.set(pack(v));},
        update:async v=>{const cur=unpack((await r.get()).data())||{};await r.set(pack(Object.assign(cur,v)));},
        delete:async()=>{await r.delete();},
        onSnapshot:(fn,err)=>r.onSnapshot(s=>fn(snapOf(s)),err||(()=>{})),
        acquire:async({holder,ttlMs})=>{
          const lr=leaseRef(path);
          try{return await fs.runTransaction(async t=>{
            const s=await t.get(lr),now=Date.now(),d=s.exists?s.data():null;
            if(d&&d.holder!==holder&&d.until>now)return {acquired:false};
            t.set(lr,{holder,until:now+(ttlMs||6000)});return {acquired:true};
          });}catch(e){return {acquired:false};}
        },
        release:async holder=>{const lr=leaseRef(path);try{await fs.runTransaction(async t=>{const s=await t.get(lr);if(s.exists&&s.data().holder===holder)t.delete(lr);});}catch(e){}}
      };
    }
    function col(path,q){
      q=q||[];
      const build=()=>{let r=fs.collection(path);q.forEach(([m,a])=>{r=r[m](...a);});return r;};
      const wrapQ=s=>({docs:s.docs.map(snapOf)});
      return {
        doc:id=>docRef(path+"/"+(id||fs.collection(path).doc().id)),
        add:async v=>{const ref=fs.collection(path).doc();await ref.set(pack(v));return docRef(path+"/"+ref.id);},
        where:(...a)=>col(path,q.concat([["where",a]])),
        orderBy:(...a)=>col(path,q.concat([["orderBy",a]])),
        limit:n=>col(path,q.concat([["limit",[n]]])),
        get:async()=>wrapQ(await build().get()),
        onSnapshot:(fn,err)=>build().onSnapshot(s=>fn(wrapQ(s)),err||(()=>{}))
      };
    }
    return Object.freeze({doc:docRef,collection:p=>col(p)});
  }
  window.claude={use:async name=>{
    const c=await init();if(!c)return null;
    if(name==="db")return makeDb(c.fs,c.uid);
    if(name==="user")return {id:async()=>c.uid,isOwner:()=>false,canEdit:()=>true};
    return null;
  }};
})();
