import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['ADMIN', 'DOCTOR'])
  role!: 'ADMIN' | 'DOCTOR';

  @IsString()
  fullName!: string;
}
