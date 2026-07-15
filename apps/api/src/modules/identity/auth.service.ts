import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
@Injectable() export class AuthService {
 constructor(@Inject(PrismaService)private prisma:PrismaService,@Inject(JwtService)private jwt:JwtService,@Inject(AuditService)private audit:AuditService){}
 private admins(){return(process.env.SYSTEM_ADMIN_EMAILS??'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean)}
 async register(dto:RegisterDto){const email=dto.email.trim().toLowerCase();if(await this.prisma.user.findUnique({where:{email},select:{id:true}}))throw new ConflictException('Bu e-posta adresiyle bir hesap zaten var.');const user=await this.prisma.user.create({data:{email,firstName:dto.firstName.trim(),lastName:dto.lastName.trim(),passwordHash:await hash(dto.password,12),systemRole:this.admins().includes(email)?'SYSTEM_ADMIN':'USER'},select:{id:true,email:true,firstName:true,lastName:true,systemRole:true}});await this.audit.record({actorId:user.id,action:'identity.user_registered',resourceType:'user',resourceId:user.id});return{user,accessToken:await this.sign(user.id,user.email)}}
 async login(dto:LoginDto){let user=await this.prisma.user.findUnique({where:{email:dto.email.trim().toLowerCase()}});if(!user||user.status!=='ACTIVE'||!await compare(dto.password,user.passwordHash))throw new UnauthorizedException('E-posta veya şifre hatalı.');if(this.admins().includes(user.email)&&user.systemRole!=='SYSTEM_ADMIN')user=await this.prisma.user.update({where:{id:user.id},data:{systemRole:'SYSTEM_ADMIN'}});await this.audit.record({actorId:user.id,action:'identity.user_logged_in',resourceType:'user',resourceId:user.id});return{user:{id:user.id,email:user.email,firstName:user.firstName,lastName:user.lastName,systemRole:user.systemRole},accessToken:await this.sign(user.id,user.email)}}
 me(id:string){return this.prisma.user.findUniqueOrThrow({where:{id},select:{id:true,email:true,firstName:true,lastName:true,preferredLanguage:true,emailNotifications:true,partnerEventEmails:true,systemRole:true}})}
 async update(id:string,d:{firstName:string;lastName:string;preferredLanguage:string;emailNotifications:boolean;partnerEventEmails:boolean}){const user=await this.prisma.user.update({where:{id},data:{firstName:d.firstName.trim(),lastName:d.lastName.trim(),preferredLanguage:d.preferredLanguage,emailNotifications:d.emailNotifications,partnerEventEmails:d.partnerEventEmails},select:{id:true,email:true,firstName:true,lastName:true,preferredLanguage:true,emailNotifications:true,partnerEventEmails:true,systemRole:true}});await this.audit.record({actorId:id,action:'identity.profile_updated',resourceType:'user',resourceId:id});return user}
 private sign(id:string,email:string){return this.jwt.signAsync({sub:id,id,email})}
}
