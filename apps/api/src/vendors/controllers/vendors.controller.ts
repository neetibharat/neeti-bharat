import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  ActivityListResponse,
  VendorListResponse,
  VendorResponse,
} from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { Roles } from '../../core/org/roles.decorator';
import {
  AddVendorDto,
  UpdateVendorDto,
  addVendorSchema,
  listVendorsSchema,
  pageSchema,
  updateVendorSchema,
  type AddVendorInput,
  type ListVendorsQuery,
  type PageQuery,
  type UpdateVendorInput,
} from '../dto/vendor.dto';
import { VendorsService } from '../services/vendors.service';

@ApiTags('Vendors')
@ApiCookieAuth()
@Controller('vendors')
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'One page of the vendors that handle personal data, with the counts for each tab',
  })
  @ApiQuery({
    name: 'tab',
    required: false,
    description: 'active (default), attention (needs a look) or archived',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search name, website or what they do' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  list(
    @Query(new ZodValidationPipe(listVendorsSchema)) query: ListVendorsQuery,
  ): Promise<VendorListResponse> {
    return this.service.list(query, new Date());
  }

  @Get(':id')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One vendor, with why it needs a look when it does' })
  get(@Param('id') id: string): Promise<VendorResponse> {
    return this.service.get(id, new Date());
  }

  @Get(':id/activity')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'What has been done to one vendor, newest first' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  activity(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(pageSchema)) query: PageQuery,
  ): Promise<ActivityListResponse> {
    return this.service.activityOf(id, query.page, query.limit);
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Add a vendor (admin or member)' })
  @ApiBody({ type: AddVendorDto })
  add(
    @Body(new ZodValidationPipe(addVendorSchema)) body: AddVendorInput,
    @Session() { user }: UserSession,
  ): Promise<VendorResponse> {
    return this.service.add(body, actorOf(user), new Date());
  }

  @Patch(':id')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Change a vendor that is in use (admin or member)' })
  @ApiBody({ type: UpdateVendorDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVendorSchema)) body: UpdateVendorInput,
    @Session() { user }: UserSession,
  ): Promise<VendorResponse> {
    return this.service.update(id, body, actorOf(user), new Date());
  }

  @Post(':id/archive')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Mark a vendor as no longer used. It stays on record (admin or member)',
  })
  archive(@Param('id') id: string, @Session() { user }: UserSession): Promise<VendorResponse> {
    return this.service.archive(id, actorOf(user), new Date());
  }

  @Post(':id/restore')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Bring an archived vendor back into use (admin or member)' })
  restore(@Param('id') id: string, @Session() { user }: UserSession): Promise<VendorResponse> {
    return this.service.restore(id, actorOf(user), new Date());
  }
}
