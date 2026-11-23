export async function verifyPaddleSignature(raw, header, secret, now = Math.floor(Date.now()/1000)) {
  if (!secret || !header) return false;
  const parts=header.split(";").map(part=>part.trim().split("="));
  const timestamp=parts.find(([key])=>key==="ts")?.[1];
  const signatures=parts.filter(([key])=>key==="h1").map(([,value])=>value);
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now-Number(timestamp))>5) return false;
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  for (const signature of signatures) {
    if (!/^[a-f0-9]{64}$/i.test(signature || "")) continue;
    const bytes=Uint8Array.from(signature.match(/../g),hex=>parseInt(hex,16));
    if (await crypto.subtle.verify("HMAC",key,bytes,encoder.encode(timestamp+":"+raw))) return true;
  }
  return false;
}
