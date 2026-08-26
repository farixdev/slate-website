import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class DownloadLinkDto {
  @IsOptional() @IsString() id?: string;

  @IsIn(['windows', 'android', 'ios', 'other'])
  platform!: 'windows' | 'android' | 'ios' | 'other';

  @IsString() @MaxLength(80) label!: string;
  @IsOptional() @IsString() @MaxLength(160) detail?: string;

  // Only http(s). Without this an admin could paste a `javascript:` URL and the
  // redirect endpoint would happily hand it to a visitor's browser.
  @Matches(/^https?:\/\/.+/i, { message: 'The URL must start with http:// or https://' })
  url!: string;

  @IsOptional() @IsString() @MaxLength(120) filename?: string;
  @IsOptional() @IsString() @MaxLength(40) size?: string;
  @IsOptional() @IsString() @MaxLength(128) checksum?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class UpsertReleaseDto {
  @Matches(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/, {
    message: 'Use a semantic version such as 1.2.0',
  })
  version!: string;

  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() notes?: string;

  @IsDateString({}, { message: 'Use a date such as 2026-08-26' })
  releasedAt!: string;

  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsBoolean() latest?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DownloadLinkDto)
  downloads?: DownloadLinkDto[];
}
