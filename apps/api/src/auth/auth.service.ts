import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản người dùng mới (POST /auth/register)
   * - Băm mật khẩu bằng bcrypt (cost = 10)
   * - Lưu vào database
   * - Phát hành JWT token
   */
  async register(dto: RegisterDto) {
    // 1. Kiểm tra email đã đăng ký chưa
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingEmail) {
      throw new ConflictException('Email này đã được đăng ký tài khoản');
    }

    // 2. Kiểm tra tên người dùng (userName) đã tồn tại chưa
    if (dto.userName && dto.userName.trim()) {
      const trimmedUserName = dto.userName.trim();
      const existingUserName = await this.prisma.user.findFirst({
        where: {
          userName: {
            equals: trimmedUserName,
            mode: 'insensitive',
          },
        },
      });

      if (existingUserName) {
        throw new ConflictException('Tên người dùng này đã được đăng ký tài khoản');
      }
    }

    // 3. Kiểm tra số điện thoại (phoneNumber) đã tồn tại chưa
    if (dto.phoneNumber && dto.phoneNumber.trim()) {
      const cleanPhone = dto.phoneNumber.trim().replace(/\s+/g, '');
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phoneNumber: cleanPhone,
        },
      });

      if (existingPhone) {
        throw new ConflictException('Số điện thoại này đã được đăng ký tài khoản');
      }
    }

    // Băm mật khẩu (bcrypt cost 10 theo ADR-003)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        userName: dto.userName?.trim() ?? null,
        phoneNumber: dto.phoneNumber?.trim()?.replace(/\s+/g, '') ?? null,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        userName: true,
        phoneNumber: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    // Phát JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Đăng ký tài khoản thành công',
      accessToken,
      user,
    };
  }

  /**
   * Đăng nhập người dùng (POST /auth/login)
   * - Hỗ trợ đăng nhập bằng Email, Tên người dùng hoặc Số điện thoại
   * - Kiểm tra mật khẩu qua bcrypt.compare
   * - Phát hành JWT token
   */
  async login(dto: LoginDto) {
    const identifier = dto.email.trim();
    const cleanPhone = identifier.replace(/\s+/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { userName: { equals: identifier, mode: 'insensitive' } },
          { phoneNumber: cleanPhone },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác');
    }

    // Phát JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }
}
