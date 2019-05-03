export function readBinFile(file: string): string {
    var rawFile = new XMLHttpRequest();
    var out = "";
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                out = rawFile.response;

            }
        }
    }
    rawFile.send(null);
    return out;
}
