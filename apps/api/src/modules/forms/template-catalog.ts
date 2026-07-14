import { Prisma } from '@prisma/client';
export const registrationFormTemplates: Array<{name:string;description:string;schema:Prisma.InputJsonValue}> = [
  {name:'Basit etkinlik kaydı',description:'Ad, soyad ve e-posta ile hızlı kayıt.',schema:{fields:[{key:'firstName',type:'text',label:'Ad',required:true},{key:'lastName',type:'text',label:'Soyad',required:true},{key:'email',type:'email',label:'E-posta',required:true}]}},
  {name:'Eğitim veya atölye başvurusu',description:'Deneyim ve beklenti bilgileri içerir.',schema:{fields:[{key:'experience',type:'textarea',label:'İlgili deneyiminiz'},{key:'expectation',type:'textarea',label:'Beklentiniz',required:true}]}},
  {name:'Konferans veya geniş katılımlı etkinlik',description:'Kurum ve görev bilgileri içerir.',schema:{fields:[{key:'organization',type:'text',label:'Kurum'},{key:'title',type:'text',label:'Görev / unvan'}]}},
  {name:'Gönüllü veya ağ buluşması',description:'İlgi alanı ve gönüllülük tercihleri içerir.',schema:{fields:[{key:'interests',type:'textarea',label:'İlgi alanlarınız'},{key:'volunteerConsent',type:'checkbox',label:'Gönüllü çalışmalardan haberdar olmak isterim'}]}}
];
