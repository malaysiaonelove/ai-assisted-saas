import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SaleStatus } from '@prisma/client';

export class SaleItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
