export abstract class PdfProvider{abstract textDocument(title:string,lines:string[]):Promise<Buffer>}
