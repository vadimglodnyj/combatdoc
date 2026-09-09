import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceMemberDto } from './create-service-member.dto';

export class UpdateServiceMemberDto extends PartialType(CreateServiceMemberDto) {}
