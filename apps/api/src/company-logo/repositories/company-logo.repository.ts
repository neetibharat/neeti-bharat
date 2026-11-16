import { Injectable } from '@nestjs/common';
import type { CompanyLogo } from '../../generated/prisma/client';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface LogoFile {
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileSha256: string;
  updatedByName: string;
}

@Injectable()
export class CompanyLogoRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(): Promise<CompanyLogo | null> {
    return this.prisma.db.companyLogo.findUnique({
      where: { organizationId: currentOrganizationId() },
    });
  }

  /** Sets the logo, replacing the one there. */
  save(file: LogoFile): Promise<CompanyLogo> {
    const organizationId = currentOrganizationId();
    return this.prisma.db.companyLogo.upsert({
      where: { organizationId },
      create: { organizationId, ...file },
      update: file,
    });
  }

  async remove(): Promise<void> {
    await this.prisma.db.companyLogo.deleteMany({
      where: { organizationId: currentOrganizationId() },
    });
  }
}
