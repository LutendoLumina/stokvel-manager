import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LoginDto, SignupDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';

/** POST /api/v1/auth/signup and /api/v1/auth/login (US-01). */
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup') // 201 Created
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('login')
  @HttpCode(200) // logging in doesn't create anything, so 200 rather than 201
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
