import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizePhone, PHONE_FORMAT_MESSAGE } from '../common/phone.js';

// DTO = "data transfer object": the shape a request body must have.
// The @ labels are checked by Nest's ValidationPipe before our code runs;
// anything wrong becomes a 400 error.

/** Turns "082 123 4567" into "+27821234567" before it's checked. */
const ToSaPhone = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? (normalizePhone(value) ?? value) : value,
  );

const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

const PHONE_PATTERN = /^\+27[1-9]\d{8}$/;

export class SignupDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  @MaxLength(100)
  name: string;

  @ToSaPhone()
  @IsString()
  @Matches(PHONE_PATTERN, { message: PHONE_FORMAT_MESSAGE })
  phone: string;

  @Trim()
  @IsOptional()
  @IsEmail({}, { message: 'Email address is not valid.' })
  email?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128, { message: 'Password must be at most 128 characters.' })
  password: string;
}

export class LoginDto {
  @ToSaPhone()
  @IsString()
  @Matches(PHONE_PATTERN, { message: PHONE_FORMAT_MESSAGE })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MaxLength(128)
  password: string;
}
