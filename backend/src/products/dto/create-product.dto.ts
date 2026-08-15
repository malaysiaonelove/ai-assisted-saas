import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  sku?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
