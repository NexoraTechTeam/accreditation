import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { PasswordHasher } from '../infrastructure/auth/password-hasher';
import { AuthService } from '../application/auth/auth.service';
import { AuthController } from '../interface/auth/auth.controller';
import { JwtAuthGuard } from '../interface/auth/jwt-auth.guard';
import { PermissionsGuard } from '../interface/auth/permissions.guard';

// @Global(): JwtAuthGuard/PermissionsGuard are applied via @UseGuards() by
// class reference on every other feature controller (see interface/auth/
// auth.decorator.ts's @Auth()). Nest resolves those guards' own
// dependencies (JwtService, Reflector) from the *consuming* module's DI
// context, so JwtService must be reachable everywhere without every feature
// module explicitly importing AuthModule.
@Global()
@Module({
  imports: [
    PersistenceModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'nexaccred-dev-secret-change-in-production'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [PasswordHasher, AuthService, JwtAuthGuard, PermissionsGuard],
  exports: [JwtModule, PasswordHasher, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
