import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller=createClient(url,anon,{global:{headers:{Authorization:req.headers.get("Authorization")||""}}});
  const {data:{user}}=await caller.auth.getUser(); if(!user)throw new Error("Sessão inválida.");
  const admin=createClient(url,service);
  const {data:perfil}=await admin.from("enigma_usuarios").select("role,ativo").eq("auth_user_id",user.id).single();
  if(!perfil?.ativo||perfil.role!=="admin")throw new Error("Apenas administradores podem gerenciar usuários.");
  const b=await req.json();
  if(b.action==="create"){
   const username=String(b.username||"").trim().toLowerCase();
   if(!/^[a-z0-9._-]{3,30}$/.test(username))throw new Error("Usuário inválido.");
   if(String(b.senha||"").length<6)throw new Error("Senha mínima: 6 caracteres.");
   if(!["admin","gerente","vendedor","tecnico"].includes(b.role))throw new Error("Nível inválido.");
   const email=`${username}@login.enigma.local`;
   const {data:c,error:e}=await admin.auth.admin.createUser({email,password:b.senha,email_confirm:true,user_metadata:{nome:b.nome,username}});if(e)throw e;
   const {error:pe}=await admin.from("enigma_usuarios").insert({auth_user_id:c.user.id,nome:b.nome,email,username,role:b.role,ativo:true});
   if(pe){await admin.auth.admin.deleteUser(c.user.id);throw pe;} return Response.json({ok:true},{headers:cors});
  }
  if(b.action==="profile"){
   const target=String(b.auth_user_id||"");
   if(!target)throw new Error("Usuário inválido.");
   const patch:any={updated_at:new Date().toISOString()};
   if(b.nome!==undefined){const nome=String(b.nome||"").trim();if(!nome)throw new Error("Nome obrigatório.");patch.nome=nome;}
   if(b.username!==undefined){
    const username=String(b.username||"").trim().toLowerCase();
    if(!/^[a-z0-9._-]{3,30}$/.test(username))throw new Error("Usuário inválido.");
    const {data:dup}=await admin.from("enigma_usuarios").select("id").eq("username",username).neq("auth_user_id",target).maybeSingle();
    if(dup)throw new Error("Este nome de usuário já está em uso.");
    patch.username=username;
    const {error:ae}=await admin.auth.admin.updateUserById(target,{email:`${username}@login.enigma.local`,user_metadata:{username,...(b.nome!==undefined?{nome:String(b.nome).trim()}:{})}});
    if(ae)throw ae;
    patch.email=`${username}@login.enigma.local`;
   }else if(b.nome!==undefined){
    const {error:ae}=await admin.auth.admin.updateUserById(target,{user_metadata:{nome:String(b.nome).trim()}});
    if(ae)throw ae;
   }
   if(b.role!==undefined){
    if(!["admin","gerente","vendedor","tecnico"].includes(b.role))throw new Error("Nível inválido.");
    if(target===user.id && b.role!=="admin")throw new Error("Você não pode remover seu próprio acesso de Administrador.");
    patch.role=b.role;
   }
   if(b.ativo!==undefined){
    if(target===user.id && b.ativo===false)throw new Error("Você não pode bloquear sua própria conta.");
    patch.ativo=!!b.ativo;
   }
   const {error}=await admin.from("enigma_usuarios").update(patch).eq("auth_user_id",target);if(error)throw error;
   if(b.ativo===false)await admin.auth.admin.updateUserById(target,{ban_duration:"876000h"});
   if(b.ativo===true)await admin.auth.admin.updateUserById(target,{ban_duration:"none"});
   return Response.json({ok:true},{headers:cors});
  }
  if(b.action==="password"){if(String(b.password||"").length<6)throw new Error("Senha mínima: 6 caracteres.");const {error}=await admin.auth.admin.updateUserById(b.auth_user_id,{password:b.password});if(error)throw error;return Response.json({ok:true},{headers:cors});}
  throw new Error("Ação inválida.");
 }catch(e){return Response.json({error:e?.message||"Erro interno"},{status:400,headers:cors});}
});