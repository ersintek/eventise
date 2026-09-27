import { notFound } from 'next/navigation';
import { SurveyForm } from './survey-form';
export default async function SurveyPage({params}:{params:Promise<{token:string}>}){const{token}=await params;const response=await fetch(`${process.env.API_INTERNAL_URL}/api/public/surveys/${token}`,{cache:'no-store'});if(response.status===404)notFound();if(!response.ok)throw new Error('Anket yüklenemedi.');return <SurveyForm token={token} survey={await response.json()}/>}
