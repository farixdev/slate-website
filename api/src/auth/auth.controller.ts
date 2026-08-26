import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class SignInDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter your username.' })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Enter your password.' })
  password!: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  signIn(@Body() dto: SignInDto) {
    return this.auth.signIn(dto.username, dto.password);
  }

  /** Lets the admin app check a stored token is still good before rendering. */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me() {
    return { ok: true };
  }
}
