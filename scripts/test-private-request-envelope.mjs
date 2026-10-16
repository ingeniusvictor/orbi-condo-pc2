import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync("proxy.ts","utf8");

assert.match(source,/MAX_PRIVATE_MUTATION_BODY_BYTES=8\*1024/,"private mutation body cap must remain 8 KiB");
assert.match(source,/mutatingMethods=new Set\(\["POST","PUT","PATCH","DELETE"\]\)/,"all mutating HTTP methods must share the envelope guard");
assert.match(source,/length>MAX_PRIVATE_MUTATION_BODY_BYTES/,"oversized declared bodies must fail before handlers");
assert.match(source,/status,413,"Solicitud demasiado grande"/,"oversized request response must be normalized");
assert.match(source,/contentType!=="application\/json"/,"declared request bodies must be JSON");
assert.match(source,/status,415,"Tipo de contenido no admitido"/,"unsupported media type response must be normalized");
assert.match(source,/"Cache-Control":"private, no-store"/,"boundary rejections must remain private and no-store");
assert.match(source,/\[ORBI_REQUEST_ID_HEADER\]:requestId/,"boundary rejections must preserve a safe correlation ID");
assert.doesNotMatch(source,/request\.(?:text|json|arrayBuffer|formData)\(/,"proxy must not consume request bodies before route handlers");

console.log("PRIVATE REQUEST ENVELOPE CONTRACT GREEN");
