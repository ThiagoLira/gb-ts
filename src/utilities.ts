export function _base64ToArrayBuffer(base64 : string) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function _base64ToBuffer(base64 : string) {
    const buf = Buffer.from(base64,'base64')
    console.log(buf)
    return buf 
}