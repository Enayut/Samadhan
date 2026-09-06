#!/bin/bash
# One-session verification: backend (RAG) + demo server + bundled PDF + mobile.
pkill -f backend.py 2>/dev/null
pkill -f "tsx server.ts" 2>/dev/null
sleep 1

cd backend
DATABASE_URL="sqlite+aiosqlite:///./samaadhan_demo.db" nohup python3 backend.py --port 8000 > /tmp/backend.log 2>&1 &
cd ../client
nohup ./node_modules/.bin/tsx server.ts > /tmp/demo-server.log 2>&1 &

# wait for both
for i in $(seq 1 40); do
  curl -sf http://localhost:8000/api/health > /dev/null 2>&1 && \
  curl -sf http://localhost:3000/api/health > /dev/null 2>&1 && break
  sleep 1
done

echo "=== RAG corpus ingestion (first run) ==="
curl -s -X POST http://localhost:3000/api/rag/ingest -H 'Content-Type: application/json' -d '{}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);console.log(r.error?('ERROR: '+r.error):('mode: '+r.mode+' | indexed: '+(r.counts?r.counts.documents_indexed:'?')+' | chunks: '+(r.counts?r.counts.chunks:'?')))})"

echo "=== RAG status (through demo proxy :3000) ==="
curl -s http://localhost:3000/api/rag/status | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);console.log(r.error?('ERROR: '+r.error):('embedder: '+r.embedding_backend+' | vector: '+r.vector_backend+' | indexed docs: '+r.counts.documents_indexed+' | chunks: '+r.counts.chunks))})"

echo "=== RAG search: Circular 02/2020 slope monitoring ==="
curl -s "http://localhost:3000/api/rag/search?q=systematic%20monitoring%20of%20slopes%20opencast%20mines&top_k=3" | node -e "
let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d);
if(r.error){console.log('ERROR:',r.error);return}
console.log('mode:',r.mode,'| embedder:',r.embedding_backend,'| results:',r.results.length);
r.results.forEach(x=>console.log(' •',x.doc_id,'|',x.source_class,'|',(x.title||'').slice(0,55),'| score',(x.score*100).toFixed(0)+'%'));
console.log('disclaimer:', r.disclaimer.slice(0,80))})"

echo "=== Bundled real PDF served ==="
curl -s -o /dev/null -w "Circular 02/2020 PDF -> HTTP %{http_code}, %{size_download} bytes\n" "http://localhost:3000/pdf/DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf"

echo "=== Mobile app served ==="
curl -s -o /dev/null -w "/mobile/ -> HTTP %{http_code}\n" http://localhost:3000/mobile/

echo "=== Reset one more time (final state = demo start) ==="
curl -s -X POST http://localhost:3000/api/reset | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d);const h=s.tasks.find(t=>t.id==='TASK-SLOPE-WK-2026-W36');console.log('reset OK:',s.sites.length,'mines ·',s.tasks.length,'tasks · hero =',h.status)})"

pkill -f backend.py 2>/dev/null
pkill -f "tsx server.ts" 2>/dev/null
exit 0
