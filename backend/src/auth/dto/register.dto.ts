import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  organizationName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}
