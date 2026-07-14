import { NextResponse } from 'next/server';
export async function POST(){const result=NextResponse.json({ok:true});result.cookies.delete('eventise_session');return result}
