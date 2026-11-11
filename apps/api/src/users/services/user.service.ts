import { Injectable } from '@nestjs/common';
import type { AppRole } from '../../generated/prisma/client';
import { UserRepository, type Account } from '../repositories/user.repository';

/** What other modules may ask of the accounts that can sign in. */
@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  count(): Promise<number> {
    return this.users.count();
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.users.existsByEmail(email);
  }

  findByEmail(email: string): Promise<Account | null> {
    return this.users.findByEmail(email);
  }

  findByEmails(emails: string[]): Promise<Account[]> {
    return this.users.findByEmails(emails);
  }

  isDisabled(id: string): Promise<boolean> {
    return this.users.isDisabled(id);
  }

  countActive(): Promise<number> {
    return this.users.countActive();
  }

  countActiveAdmins(): Promise<number> {
    return this.users.countActiveAdmins();
  }

  setRole(id: string, role: AppRole): Promise<void> {
    return this.users.setRole(id, role);
  }

  disable(id: string, now: Date): Promise<void> {
    return this.users.disable(id, now);
  }
}
