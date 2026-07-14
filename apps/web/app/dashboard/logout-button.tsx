'use client';
import { useRouter } from 'next/navigation';
export function LogoutButton(){const router=useRouter();return <button className="nav-button" onClick={async()=>{await fetch('/api/session/logout',{method:'POST'});router.push('/login');router.refresh()}}>Çıkış</button>}
