'use strict';
const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const crypto = require('crypto');
const app = express();
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req,res)=>res.json({ok:true,peers:clients.size}));
const server = http.createServer(app);
const wss = new WebSocketServer({server,path:'/ws',maxPayload:8192});
const clients = new Map();
const clean = (v,max=30)=>String(v??'').replace(/[<>\x00-\x1f]/g,'').slice(0,max);
const validRoom = v => typeof v==='string'&&/^[a-zA-Z0-9_-]{1,32}$/.test(v);
const send=(ws,obj)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj))};
function broadcast(room,obj,exclude){for(const [ws,p] of clients)if(p.room===room&&ws!==exclude)send(ws,obj)}
function peers(room){return [...clients.values()].filter(p=>p.room===room).map(p=>({peer:p.id,kind:'viewer',presence:p.presence}));}
function updateRoom(room){if(!room)return;broadcast(room,{type:'peers',peers:peers(room)});}
const num=(v,min,max,def=0)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):def;
wss.on('connection',(ws,req)=>{
 const p={id:crypto.randomUUID(),room:null,presence:{n:'Driver',c:0xe0483c,st:'w',x:0,z:0,h:0},lastPresence:0,lastChat:0,alive:true};clients.set(ws,p);
 ws.on('pong',()=>{p.alive=true});
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return}if(!m||typeof m!=='object')return;
  if(m.type==='join'){
   if(!validRoom(m.room))return send(ws,{type:'error',message:'Room code must be 1–32 letters, numbers, _ or -.'});
   const next=m.room.toUpperCase();if([...clients.values()].filter(q=>q.room===next).length>=32&&p.room!==next)return send(ws,{type:'error',message:'Room is full (32 players).'});
   const old=p.room;p.room=next;p.presence.n=clean(m.name||'Driver',20)||'Driver';send(ws,{type:'joined',id:p.id,room:next});updateRoom(old);updateRoom(next);return;
  }
  if(!p.room)return;
  if(m.type==='presence'){
   if(Date.now()-p.lastPresence<65)return;p.lastPresence=Date.now();const v=m.data;if(!v||typeof v!=='object')return;
   const allowed=['w','g','r','o','m','n'];const st=allowed.includes(v.st)?v.st:'w';
   p.presence={n:clean(v.n||p.presence.n,20),c:Math.trunc(num(v.c,0,0xffffff,0xe0483c)),st,
    x:num(v.x,-10000,10000),z:num(v.z,-10000,10000),y:num(v.y,-1000,1000),h:num(v.h,-100,100),u:num(v.u,-1000,1000),p:num(v.p,-10,10),e:Math.trunc(num(v.e,-1,100,-1)),en:Math.trunc(num(v.en,0,10000000)),b:num(v.b,0,1000000,0)};
   updateRoom(p.room);return;
  }
  if(m.type==='chat'){
   if(Date.now()-p.lastChat<450)return;p.lastChat=Date.now();const t=clean(m.data?.t,120).trim();if(t)broadcast(p.room,{type:'event',event:'chat',data:{n:p.presence.n,t}},null);return;
  }
  if(m.type==='activity'){
   const activity=clean(m.activity,24);if(!['basketball','racing','motocross','parkour','paintball','fishing','freeroam'].includes(activity))return;
   broadcast(p.room,{type:'event',event:'activity',data:{player:p.id,name:p.presence.n,activity,action:clean(m.action,24)}},null);
  }
 });
 ws.on('close',()=>{const old=p.room;clients.delete(ws);updateRoom(old)});
 ws.on('error',()=>{});
});
const heartbeat=setInterval(()=>{for(const [ws,p] of clients){if(!p.alive){ws.terminate();continue}p.alive=false;ws.ping()}},30000);
server.on('close',()=>clearInterval(heartbeat));
server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('APEXLINE multiplayer at port '+(process.env.PORT||3000)));
