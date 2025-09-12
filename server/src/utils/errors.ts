// src/utils/errors.ts
export class HttpError extends Error { constructor(public status: number, msg: string){ super(msg)} }
export const badReq = (m:string)=> new HttpError(400,m)
export const forbidden = (m:string)=> new HttpError(403,m)
export const notFound = (m:string)=> new HttpError(404,m)
