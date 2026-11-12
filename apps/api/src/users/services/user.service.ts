import { Injectable } from '@nestjs/common';
import type { AppRole } from '../../generated/prisma/client';
import { UserRepository, type Account } from '../repositories/user.repository';

/** What other modules may ask of the accounts that can sign in. */
@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  /** Every account in the install. Zero means nobody has signed in yet. */
  countAll(): Promise<number> {
    return this.users.countAll();
  }

  /** The account with this email in any organisation, if there is one. */
  findAnywhere(email: string): Promise<{ id: string; email: string } | null> {
    return this.users.findAnywhere(email);
  }

  findById(id: string): Promise<{ id: string; email: string; name: string } | null> {
    return this.users.findById(id);
  }

  /** Whether they have an account here, in the organisation the request works in. */
  existsByEmail(email: string): Promise<boolean> {
    return this.users.existsByEmail(email);
  }

  findByEmail(email: string): Promise<Account | null> {
    return this.users.findByEmail(email);
  }

  findByEmails(emails: string[]): Promise<Account[]> {
    return this.users.findByEmails(emails);
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
